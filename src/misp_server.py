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
                
                if query:
                    search_params["eventinfo"] = query
                if event_type:
                    search_params["type"] = event_type
                if published is not None:
                    search_params["published"] = published
                
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
                self.logger.error(f"Search events failed: {e}")
                return {"error": str(e)}
        
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
                
                if value:
                    search_params["value"] = value
                if type:
                    search_params["type"] = type
                if category:
                    search_params["category"] = category
                
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
                self.logger.error(f"Search attributes failed: {e}")
                return {"error": str(e)}
    
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
            self.client = httpx.AsyncClient(
                verify=self.config.verifycert,
                timeout=self.config.timeout,
                proxies=self.config.proxies
            )

    async def run(self, host: str = "localhost", port: int = 8082):
        """Start the MCP server"""
        self.logger.info(f"Starting MISP MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)

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