#!/usr/bin/env python3
"""
Microsoft MISP MCP Server
Provides integration with MISP (Malware Information Sharing Platform) for threat intelligence.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import httpx
from mcp import Server, Tool, Resource
from mcp.types import TextContent, ErrorContent

@dataclass
class MISPConfig:
    """MISP configuration parameters"""
    url: str
    key: str
    verifycert: bool = True
    proxies: Optional[Dict] = None
    cert: Optional[str] = None
    timeout: int = 300

class MicrosoftMISPServer:
    """MCP Server for Microsoft MISP integration"""
    
    def __init__(self, config: MISPConfig):
        self.config = config
        self.server = Server("microsoft-misp")
        self.client: Optional[httpx.AsyncClient] = None
        self.logger = logging.getLogger(__name__)
        
        self._register_tools()
        self._register_resources()
    
    def _register_tools(self):
        """Register available tools"""
        
        @self.server.tool("search-events")
        async def search_events(query: str = "", limit: int = 100, 
                              event_type: str = "", published: bool = None) -> List[Dict]:
            """
            Search MISP events
            
            Args:
                query: Search query string
                limit: Maximum number of results
                event_type: Filter by event type
                published: Filter by published status
            """
            try:
                await self._ensure_client()
                
                search_params = {
                    "limit": limit,
                    "returnFormat": "json"
                }
                
                # Validate and sanitize inputs
                if query:
                    query = self._sanitize_input(query)
                    search_params["eventinfo"] = query
                if event_type:
                    event_type = self._sanitize_input(event_type)
                    search_params["type"] = event_type
                if published is not None:
                    search_params["published"] = published
                
                # Limit search results
                limit = min(max(1, limit), 1000)
                
                response = await self.client.post(
                    f"{self.config.url}/events/restSearch",
                    headers=self._get_headers(),
                    json=search_params
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", [])
                else:
                    raise Exception(f"Failed to search events: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Search events failed: {str(e)}")
                return {"error": "Failed to search events. Please check your query and try again."}
        
        @self.server.tool("search-attributes")
        async def search_attributes(value: str = "", type: str = "", 
                                  category: str = "", limit: int = 100) -> List[Dict]:
            """
            Search MISP attributes (IOCs)
            
            Args:
                value: Attribute value to search for
                type: Attribute type (ip-dst, domain, md5, etc.)
                category: Attribute category
                limit: Maximum number of results
            """
            try:
                await self._ensure_client()
                
                search_params = {
                    "limit": limit,
                    "returnFormat": "json"
                }
                
                # Validate and sanitize inputs
                if value:
                    value = self._sanitize_input(value)
                    search_params["value"] = value
                if type:
                    type = self._sanitize_input(type)
                    search_params["type"] = type
                if category:
                    category = self._sanitize_input(category)
                    search_params["category"] = category
                
                # Limit search results
                limit = min(max(1, limit), 1000)
                
                response = await self.client.post(
                    f"{self.config.url}/attributes/restSearch",
                    headers=self._get_headers(),
                    json=search_params
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", {}).get("Attribute", [])
                else:
                    raise Exception(f"Failed to search attributes: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Search attributes failed: {str(e)}")
                return {"error": "Failed to search attributes. Please check your query and try again."}
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        return {
            "Authorization": self.config.key,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    
    async def _ensure_client(self):
        """Ensure HTTP client is initialized"""
        if not self.client:
            # Force SSL verification for security
            verify_ssl = self.config.verifycert
            if not verify_ssl:
                self.logger.warning("SSL verification is disabled. This is not recommended for production.")
            
            self.client = httpx.AsyncClient(
                verify=verify_ssl,
                timeout=self.config.timeout,
                proxies=self.config.proxies
            )

    async def run(self, host: str = "localhost", port: int = 8082):
        """Start the MCP server"""
        self.logger.info(f"Starting MISP MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)
    
    def _sanitize_input(self, input_str: str) -> str:
        """Sanitize input strings to prevent injection attacks"""
        if not input_str or len(input_str) > 1000:
            raise ValueError("Input is empty or too long")
        
        # Remove control characters and potential injection patterns
        import re
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', input_str)
        
        # Remove potential script tags or SQL injection patterns
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'vbscript:',
            r'on\w+\s*=',
            r'union\s+select',
            r'drop\s+table',
            r'delete\s+from',
            r'insert\s+into'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, sanitized, re.IGNORECASE):
                raise ValueError("Input contains potentially dangerous content")
        
        return sanitized.strip()
    
    def _register_resources(self):
        """Register available resources"""
        pass

async def main():
    import os
    logging.basicConfig(level=logging.INFO)
    
    config = MISPConfig(
        url=os.getenv("MISP_URL", ""),
        key=os.getenv("MISP_KEY", ""),
        verifycert=os.getenv("MISP_VERIFYCERT", "true").lower() == "true"
    )
    
    server = MicrosoftMISPServer(config)
    await server.run()

if __name__ == "__main__":
    asyncio.run(main())