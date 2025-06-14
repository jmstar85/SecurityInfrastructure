export const codeExamples = {
  splunk: {
    server: `#!/usr/bin/env python3
"""
Splunk SIEM MCP Server
Provides integration with Splunk for security information and event management.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import httpx
from mcp import Server, Tool, Resource
from mcp.types import TextContent, ErrorContent

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
                
                search_params = {
                    "search": f"search {query}",
                    "earliest_time": earliest_time,
                    "latest_time": latest_time,
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
                
                # Parse job ID from response
                job_id = response.text.split('<sid>')[1].split('</sid>')[0]
                
                # Wait for job completion and get results
                results = await self._get_search_results(job_id)
                return results
                
            except Exception as e:
                self.logger.error(f"Search failed: {e}")
                return {"error": str(e)}
    
    async def _ensure_authenticated(self):
        """Ensure we have a valid session key"""
        if self.session_key:
            return
            
        if not self.client:
            self.client = httpx.AsyncClient(verify=self.config.verify_ssl)
        
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
                session_key = response.text.split('<sessionKey>')[1].split('</sessionKey>')[0]
                self.session_key = session_key
            else:
                raise Exception(f"Authentication failed: {response.text}")

    async def run(self, host: str = "localhost", port: int = 8080):
        """Start the MCP server"""
        self.logger.info(f"Starting Splunk MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)

# Configuration and startup
async def main():
    import os
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
    asyncio.run(main())`,
    
    config: `# splunk-config.yaml
splunk:
  host: "your-splunk-server.com"
  port: 8089
  username: "admin"
  password: "your-password"
  # OR use token-based auth
  token: "your-api-token"
  verify_ssl: true
  default_index: "security"

# Environment variables (.env)
SPLUNK_HOST=your-splunk-server.com
SPLUNK_PORT=8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=your-password
SPLUNK_TOKEN=your-api-token
SPLUNK_VERIFY_SSL=true`
  },
  
  crowdstrike: {
    server: `#!/usr/bin/env python3
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
    member_cid: Optional[str] = None  # For MSSP scenarios

class CrowdStrikeMCPServer:
    """MCP Server for CrowdStrike EDR integration"""
    
    def __init__(self, config: CrowdStrikeConfig):
        self.config = config
        self.server = Server("crowdstrike-edr")
        self.client: Optional[httpx.AsyncClient] = None
        self.access_token: Optional[str] = None
        self.token_expires: Optional[datetime] = None
        self.logger = logging.getLogger(__name__)
        
        # Register tools and resources
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
                filter_query: FQL filter query (e.g., "status:'new'+severity:'medium'")
                limit: Maximum number of results
                sort: Sort order (e.g., "created_timestamp.desc")
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
                        # Get detailed detection information
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
    
    async def _ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return
        
        if not self.client:
            self.client = httpx.AsyncClient()
        
        # Get OAuth2 token
        auth_data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret
        }
        
        if self.config.member_cid:
            auth_data["member_cid"] = self.config.member_cid
        
        response = await self.client.post(
            f"{self.config.base_url}/oauth2/token",
            data=auth_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 201:
            token_data = response.json()
            self.access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 1800)
            self.token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
        else:
            raise Exception(f"Authentication failed: {response.text}")

    async def run(self, host: str = "localhost", port: int = 8081):
        """Start the MCP server"""
        self.logger.info(f"Starting CrowdStrike MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)

# Configuration and startup
async def main():
    import os
    config = CrowdStrikeConfig(
        client_id=os.getenv("CROWDSTRIKE_CLIENT_ID"),
        client_secret=os.getenv("CROWDSTRIKE_CLIENT_SECRET"),
        base_url=os.getenv("CROWDSTRIKE_BASE_URL", "https://api.crowdstrike.com"),
        member_cid=os.getenv("CROWDSTRIKE_MEMBER_CID")
    )
    
    server = CrowdStrikeMCPServer(config)
    await server.run()

if __name__ == "__main__":
    asyncio.run(main())`
  },
  
  misp: {
    server: `#!/usr/bin/env python3
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
        
        # Register tools and resources
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
    
    async def _ensure_client(self):
        """Ensure HTTP client is initialized"""
        if not self.client:
            self.client = httpx.AsyncClient(
                verify=self.config.verifycert,
                timeout=self.config.timeout
            )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        return {
            "Authorization": self.config.key,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    async def run(self, host: str = "localhost", port: int = 8082):
        """Start the MCP server"""
        self.logger.info(f"Starting Microsoft MISP MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)

# Configuration and startup
async def main():
    import os
    config = MISPConfig(
        url=os.getenv("MISP_URL", "https://your-misp-instance.com"),
        key=os.getenv("MISP_KEY"),
        verifycert=os.getenv("MISP_VERIFYCERT", "true").lower() == "true"
    )
    
    server = MicrosoftMISPServer(config)
    await server.run()

if __name__ == "__main__":
    asyncio.run(main())`
  },
  
  docker: {
    compose: `version: '3.8'

services:
  splunk-mcp:
    build:
      context: ./splunk-mcp
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPLUNK_HOST=\${SPLUNK_HOST}
      - SPLUNK_PORT=\${SPLUNK_PORT}
      - SPLUNK_USERNAME=\${SPLUNK_USERNAME}
      - SPLUNK_PASSWORD=\${SPLUNK_PASSWORD}
      - SPLUNK_TOKEN=\${SPLUNK_TOKEN}
      - SPLUNK_VERIFY_SSL=\${SPLUNK_VERIFY_SSL}
    restart: unless-stopped
    networks:
      - mcp-network

  crowdstrike-mcp:
    build:
      context: ./crowdstrike-mcp
      dockerfile: Dockerfile
    ports:
      - "8081:8081"
    environment:
      - CROWDSTRIKE_CLIENT_ID=\${CROWDSTRIKE_CLIENT_ID}
      - CROWDSTRIKE_CLIENT_SECRET=\${CROWDSTRIKE_CLIENT_SECRET}
      - CROWDSTRIKE_BASE_URL=\${CROWDSTRIKE_BASE_URL}
      - CROWDSTRIKE_MEMBER_CID=\${CROWDSTRIKE_MEMBER_CID}
    restart: unless-stopped
    networks:
      - mcp-network

  misp-mcp:
    build:
      context: ./misp-mcp
      dockerfile: Dockerfile
    ports:
      - "8082:8082"
    environment:
      - MISP_URL=\${MISP_URL}
      - MISP_KEY=\${MISP_KEY}
      - MISP_VERIFYCERT=\${MISP_VERIFYCERT}
    restart: unless-stopped
    networks:
      - mcp-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - splunk-mcp
      - crowdstrike-mcp
      - misp-mcp
    restart: unless-stopped
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge`,
    
    dockerfile: `FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash mcpuser && \\
    chown -R mcpuser:mcpuser /app
USER mcpuser

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Run application
CMD ["python", "server.py"]`
  },
  
  tests: {
    suite: `#!/usr/bin/env python3
"""
Test suite for MCP Security Servers
"""

import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

# Import your server classes
from splunk_mcp_server import SplunkMCPServer, SplunkConfig
from crowdstrike_mcp_server import CrowdStrikeMCPServer, CrowdStrikeConfig
from misp_mcp_server import MicrosoftMISPServer, MISPConfig

class TestSplunkMCPServer:
    """Test cases for Splunk MCP Server"""
    
    @pytest.fixture
    def splunk_config(self):
        return SplunkConfig(
            host="test-splunk.com",
            port=8089,
            username="testuser",
            password="testpass"
        )
    
    @pytest.fixture
    def splunk_server(self, splunk_config):
        return SplunkMCPServer(splunk_config)
    
    @pytest.mark.asyncio
    async def test_authentication(self, splunk_server):
        """Test Splunk authentication"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.text = '<sessionKey>test-session-key</sessionKey>'
            
            mock_client.return_value.post.return_value = mock_response
            splunk_server.client = mock_client.return_value
            
            await splunk_server._ensure_authenticated()
            
            assert splunk_server.session_key == "test-session-key"

class TestCrowdStrikeMCPServer:
    """Test cases for CrowdStrike MCP Server"""
    
    @pytest.fixture
    def crowdstrike_config(self):
        return CrowdStrikeConfig(
            client_id="test-client-id",
            client_secret="test-client-secret"
        )
    
    @pytest.fixture
    def crowdstrike_server(self, crowdstrike_config):
        return CrowdStrikeMCPServer(crowdstrike_config)
    
    @pytest.mark.asyncio
    async def test_authentication(self, crowdstrike_server):
        """Test CrowdStrike OAuth authentication"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 201
            mock_response.json.return_value = {
                "access_token": "test-token",
                "expires_in": 1800
            }
            
            mock_client.return_value.post.return_value = mock_response
            crowdstrike_server.client = mock_client.return_value
            
            await crowdstrike_server._ensure_authenticated()
            
            assert crowdstrike_server.access_token == "test-token"

class TestMicrosoftMISPServer:
    """Test cases for Microsoft MISP Server"""
    
    @pytest.fixture
    def misp_config(self):
        return MISPConfig(
            url="https://test-misp.com",
            key="test-api-key"
        )
    
    @pytest.fixture
    def misp_server(self, misp_config):
        return MicrosoftMISPServer(misp_config)
    
    @pytest.mark.asyncio
    async def test_search_events(self, misp_server):
        """Test MISP event searching"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "response": [
                    {"Event": {"id": "1", "info": "Test event", "threat_level_id": "2"}}
                ]
            }
            
            mock_client.return_value.post.return_value = mock_response
            misp_server.client = mock_client.return_value
            
            results = await misp_server.search_events("malware")
            
            assert len(results) == 1
            assert results[0]["Event"]["info"] == "Test event"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])`,
    
    requirements: `# MCP Security Servers Requirements

# Core MCP dependencies
mcp-server>=1.0.0
asyncio-mqtt>=0.13.0

# HTTP client
httpx>=0.24.0

# Data handling
pydantic>=2.0.0
dataclasses-json>=0.6.0

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-mock>=3.11.0

# Utilities
python-dotenv>=1.0.0
PyYAML>=6.0

# Security
cryptography>=41.0.0
certifi>=2023.0.0

# Logging
structlog>=23.1.0

# Development
black>=23.0.0
flake8>=6.0.0
mypy>=1.5.0`
  }
};
