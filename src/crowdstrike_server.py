#!/usr/bin/env python3
"""
CrowdStrike EDR MCP Server
Provides integration with CrowdStrike Falcon platform for endpoint detection and response.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import httpx
from mcp import Server, Tool, Resource
from mcp.types import TextContent, ErrorContent

@dataclass
class CrowdStrikeConfig:
    """CrowdStrike configuration parameters"""
    client_id: str
    client_secret: str
    base_url: str = "https://api.crowdstrike.com"
    member_cid: Optional[str] = None

class CrowdStrikeMCPServer:
    """MCP Server for CrowdStrike EDR integration"""
    
    def __init__(self, config: CrowdStrikeConfig):
        self.config = config
        self.server = Server("crowdstrike-edr")
        self.client: Optional[httpx.AsyncClient] = None
        self.access_token: Optional[str] = None
        self.token_expires: Optional[datetime] = None
        self.logger = logging.getLogger(__name__)
        
        self._register_tools()
        self._register_resources()
    
    def _register_tools(self):
        """Register available tools"""
        
        @self.server.tool("search-detections")
        async def search_detections(filter_query: str = "", limit: int = 100, 
                                  sort: str = "created_timestamp.desc") -> List[Dict]:
            """
            Search for detections in CrowdStrike
            
            Args:
                filter_query: FQL filter query
                limit: Maximum number of results
                sort: Sort order
            """
            try:
                await self._ensure_authenticated()
                
                params = {
                    "limit": limit,
                    "sort": sort
                }
                if filter_query:
                    params["filter"] = filter_query
                
                response = await self.client.get(
                    f"{self.config.base_url}/detects/queries/detects/v1",
                    headers=self._get_headers(),
                    params=params
                )
                
                if response.status_code == 200:
                    detection_ids = response.json().get("resources", [])
                    
                    if detection_ids:
                        details_response = await self.client.post(
                            f"{self.config.base_url}/detects/entities/summaries/GET/v1",
                            headers=self._get_headers(),
                            json={"ids": detection_ids}
                        )
                        
                        if details_response.status_code == 200:
                            return details_response.json().get("resources", [])
                    
                    return []
                else:
                    raise Exception(f"Failed to search detections: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Search detections failed: {e}")
                return {"error": str(e)}
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.config.member_cid:
            headers["X-CS-USERUUID"] = self.config.member_cid
        return headers
    
    async def _ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return
            
        if not self.client:
            self.client = httpx.AsyncClient(timeout=30.0)
        
        # OAuth 2.0 client credentials flow
        auth_data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret
        }
        
        response = await self.client.post(
            f"{self.config.base_url}/oauth2/token",
            data=auth_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 3600)
            self.token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
        else:
            raise Exception(f"Authentication failed: {response.text}")

    async def run(self, host: str = "localhost", port: int = 8081):
        """Start the MCP server"""
        self.logger.info(f"Starting CrowdStrike MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)

async def main():
    import os
    logging.basicConfig(level=logging.INFO)
    
    config = CrowdStrikeConfig(
        client_id=os.getenv("CROWDSTRIKE_CLIENT_ID", ""),
        client_secret=os.getenv("CROWDSTRIKE_CLIENT_SECRET", ""),
        base_url=os.getenv("CROWDSTRIKE_BASE_URL", "https://api.crowdstrike.com")
    )
    
    server = CrowdStrikeMCPServer(config)
    await server.run()

if __name__ == "__main__":
    asyncio.run(main())