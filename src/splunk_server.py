#!/usr/bin/env python3
"""
Splunk SIEM MCP Server
Provides integration with Splunk for security information and event management.
"""

import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import httpx
from mcp import Server, Tool, Resource
from mcp.types import TextContent, ErrorContent
try:
    import defusedxml.ElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET
    import warnings
    warnings.warn("defusedxml not available, using standard ElementTree (less secure)", SecurityWarning)

@dataclass
class SplunkConfig:
    """Splunk configuration parameters"""
    host: str
    port: int = 8089
    username: str = ""
    password: str = ""
    token: Optional[str] = None
    verify_ssl: bool = True
    index: str = "main"

class SplunkMCPServer:
    """MCP Server for Splunk SIEM integration"""
    
    def __init__(self, config: SplunkConfig):
        self.config = config
        self.server = Server("splunk-siem")
        self.client: Optional[httpx.AsyncClient] = None
        self.session_key: Optional[str] = None
        self.logger = logging.getLogger(__name__)
        
        # Register tools and resources
        self._register_tools()
        self._register_resources()
    
    def _register_tools(self):
        """Register available tools"""
        
        @self.server.tool("search-events")
        async def search_events(query: str, earliest_time: str = "-24h", 
                              latest_time: str = "now", count: int = 100) -> List[Dict]:
            """
            Search Splunk events using SPL (Search Processing Language)
            
            Args:
                query: SPL search query
                earliest_time: Start time for search (e.g., "-24h", "-1d")
                latest_time: End time for search (default: "now")
                count: Maximum number of results to return
            """
            try:
                await self._ensure_authenticated()
                
                # Validate and sanitize inputs
                sanitized_query = self._sanitize_spl_query(query)
                validated_time_range = self._validate_time_range(earliest_time, latest_time)
                count = min(max(1, count), 10000)  # Limit count between 1 and 10000
                
                search_params = {
                    "search": f"search {sanitized_query}",
                    "earliest_time": validated_time_range[0],
                    "latest_time": validated_time_range[1],
                    "count": count,
                    "output_mode": "json"
                }
                
                # Create search job
                response = await self.client.post(
                    f"https://{self.config.host}:{self.config.port}/services/search/jobs",
                    data=search_params,
                    headers={"Authorization": f"Splunk {self.session_key}"}
                )
                
                if response.status_code != 201:
                    raise Exception(f"Failed to create search job: {response.text}")
                
                # Parse job ID from response using secure XML parsing
                try:
                    root = ET.fromstring(response.text)
                    job_id_elem = root.find('.//{http://dev.splunk.com/ns/rest}sid')
                    if job_id_elem is not None:
                        job_id = job_id_elem.text
                    else:
                        # Fallback to string parsing if XML structure is different
                        job_id = response.text.split('<sid>')[1].split('</sid>')[0]
                except Exception:
                    raise Exception("Failed to parse job ID from response")
                
                # Wait for job completion and get results
                results = await self._get_search_results(job_id)
                return results
                
            except Exception as e:
                self.logger.error(f"Search failed: {str(e)}")
                return {"error": "Search operation failed. Please check your query and try again."}
    
    async def _get_search_results(self, job_id: str) -> List[Dict]:
        """Get results from a search job"""
        max_attempts = 30
        attempt = 0
        
        while attempt < max_attempts:
            # Check job status
            status_response = await self.client.get(
                f"https://{self.config.host}:{self.config.port}/services/search/jobs/{job_id}",
                headers={"Authorization": f"Splunk {self.session_key}"}
            )
            
            if status_response.status_code == 200:
                try:
                    root = ET.fromstring(status_response.text)
                    dispatch_state = None
                    for entry in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                        for content in entry.findall('.//{http://www.w3.org/2005/Atom}content'):
                            for key in content.findall('.//s:key[@name="dispatchState"]', 
                                                      {'s': 'http://dev.splunk.com/ns/rest'}):
                                dispatch_state = key.text
                                break
                except Exception:
                    self.logger.error("Failed to parse job status response")
                    continue
                
                if dispatch_state == "DONE":
                    # Get results
                    results_response = await self.client.get(
                        f"https://{self.config.host}:{self.config.port}/services/search/jobs/{job_id}/results",
                        headers={"Authorization": f"Splunk {self.session_key}"},
                        params={"output_mode": "json"}
                    )
                    
                    if results_response.status_code == 200:
                        return results_response.json().get("results", [])
                    
                elif dispatch_state == "FAILED":
                    raise Exception("Search job failed")
            
            await asyncio.sleep(1)
            attempt += 1
        
        raise Exception("Search job timeout")
    
    async def _ensure_authenticated(self):
        """Ensure we have a valid session key"""
        if self.session_key:
            return
            
        if not self.client:
            self.client = httpx.AsyncClient(verify=self.config.verify_ssl, timeout=30.0)
        
        if self.config.token:
            self.session_key = self.config.token
        else:
            # Authenticate with username/password
            auth_data = {
                "username": self.config.username,
                "password": self.config.password
            }
            
            response = await self.client.post(
                f"https://{self.config.host}:{self.config.port}/services/auth/login",
                data=auth_data
            )
            
            if response.status_code == 200:
                # Parse session key from XML response
                try:
                    root = ET.fromstring(response.text)
                    session_key_elem = root.find('.//{http://dev.splunk.com/ns/rest}sessionKey')
                    if session_key_elem is not None:
                        self.session_key = session_key_elem.text
                    else:
                        raise Exception("Session key not found in response")
                except Exception:
                    raise Exception("Failed to parse authentication response")
            else:
                raise Exception("Authentication failed. Please check your credentials.")

    async def run(self, host: str = "localhost", port: int = 8080):
        """Start the MCP server"""
        self.logger.info(f"Starting Splunk MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)
    
    def _sanitize_spl_query(self, query: str) -> str:
        """Sanitize SPL query to prevent injection attacks"""
        if not query or len(query) > 10000:
            raise ValueError("Query is empty or too long")
        
        # Remove dangerous SPL commands
        dangerous_commands = [
            r'\|\s*delete\b',
            r'\|\s*outputcsv\b',
            r'\|\s*outputlookup\b',
            r'\|\s*script\b',
            r'\|\s*sendemail\b',
            r'\|\s*run\b',
            r'\|\s*collect\b',
            r'\|\s*dbxquery\b'
        ]
        
        for pattern in dangerous_commands:
            if re.search(pattern, query, re.IGNORECASE):
                raise ValueError("Query contains potentially dangerous commands")
        
        # Basic sanitization - remove control characters
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', query)
        
        return sanitized.strip()
    
    def _validate_time_range(self, earliest_time: str, latest_time: str) -> tuple:
        """Validate time range parameters"""
        valid_time_patterns = [
            r'^-?\d+[smhdwMy]$',  # Relative time like -24h, -1d, etc.
            r'^now$',             # Now
            r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$',  # ISO format
            r'^\d{10}$',          # Unix timestamp
            r'^@[dwyMm]$'         # Snap to time units
        ]
        
        def is_valid_time(time_str):
            return any(re.match(pattern, time_str) for pattern in valid_time_patterns)
        
        if not is_valid_time(earliest_time):
            earliest_time = "-24h"
        if not is_valid_time(latest_time):
            latest_time = "now"
            
        return (earliest_time, latest_time)
    
    def _register_resources(self):
        """Register available resources"""
        pass

# Configuration and startup
async def main():
    import os
    logging.basicConfig(level=logging.INFO)
    
    config = SplunkConfig(
        host=os.getenv("SPLUNK_HOST", "localhost"),
        port=int(os.getenv("SPLUNK_PORT", "8089")),
        username=os.getenv("SPLUNK_USERNAME", ""),
        password=os.getenv("SPLUNK_PASSWORD", ""),
        token=os.getenv("SPLUNK_TOKEN"),
        verify_ssl=os.getenv("SPLUNK_VERIFY_SSL", "true").lower() == "true"
    )
    
    server = SplunkMCPServer(config)
    await server.run()

if __name__ == "__main__":
    asyncio.run(main())