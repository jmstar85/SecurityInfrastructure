#!/usr/bin/env python3
"""
CrowdStrike EDR MCP Server
Provides integration with CrowdStrike Falcon platform for endpoint detection and response.
"""

import asyncio
import json
import logging
import re
import ssl
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import httpx
from mcp import Server, Tool, Resource
from mcp.types import TextContent, ErrorContent

# Input validation patterns
VALID_SORT_PATTERNS = [
    "created_timestamp.desc", "created_timestamp.asc",
    "updated_timestamp.desc", "updated_timestamp.asc",
    "severity.desc", "severity.asc"
]

# FQL injection protection - allow only safe characters and patterns
SAFE_FQL_PATTERN = re.compile(r'^[a-zA-Z0-9_\-\.:\s\'\"=<>!,\(\)]+$')

@dataclass
class CrowdStrikeConfig:
    """CrowdStrike configuration parameters"""
    client_id: str
    client_secret: str
    base_url: str = "https://api.crowdstrike.com"
    member_cid: Optional[str] = None

class SecurityError(Exception):
    """Custom exception for security-related errors"""
    pass

class CrowdStrikeMCPServer:
    """MCP Server for CrowdStrike EDR integration"""
    
    def __init__(self, config: CrowdStrikeConfig):
        self.config = self._validate_config(config)
        self.server = Server("crowdstrike-edr")
        self.client: Optional[httpx.AsyncClient] = None
        self.access_token: Optional[str] = None
        self.token_expires: Optional[datetime] = None
        self.logger = logging.getLogger(__name__)
        
        # Configure secure logging - avoid token exposure
        self.logger.addFilter(self._log_filter)
        
        self._register_tools()
        self._register_resources()
    
    def _validate_config(self, config: CrowdStrikeConfig) -> CrowdStrikeConfig:
        """Validate and sanitize configuration"""
        if not config.client_id or not config.client_secret:
            raise SecurityError("Client credentials are required")
        
        if not config.base_url.startswith("https://"):
            raise SecurityError("Base URL must use HTTPS")
        
        # Validate base URL format
        if not re.match(r'^https://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}$', config.base_url):
            raise SecurityError("Invalid base URL format")
        
        # Validate member CID if provided
        if config.member_cid and not re.match(r'^[a-zA-Z0-9\-]+$', config.member_cid):
            raise SecurityError("Invalid member CID format")
        
        return config
    
    def _log_filter(self, record):
        """Filter sensitive information from logs"""
        if hasattr(record, 'msg'):
            # Remove potential tokens from log messages
            record.msg = re.sub(r'Bearer\s+[A-Za-z0-9\-_\.]+', 'Bearer [REDACTED]', str(record.msg))
            record.msg = re.sub(r'access_token["\']\s*:\s*["\'][^"\']+["\']', 'access_token": "[REDACTED]"', str(record.msg))
            record.msg = re.sub(r'client_secret["\']\s*:\s*["\'][^"\']+["\']', 'client_secret": "[REDACTED]"', str(record.msg))
        return True
    
    def _register_tools(self):
        """Register available tools"""
        
        @self.server.tool("search-detections")
        async def search_detections(filter_query: str = "", limit: int = 100, 
                                  sort: str = "created_timestamp.desc") -> Union[List[Dict], Dict]:
            """
            Search for detections in CrowdStrike
            
            Args:
                filter_query: FQL filter query (sanitized)
                limit: Maximum number of results (1-1000)
                sort: Sort order (predefined values only)
            """
            try:
                # Input validation and sanitization
                validated_params = self._validate_search_params(filter_query, limit, sort)
                
                await self._ensure_authenticated()
                
                response = await self.client.get(
                    f"{self.config.base_url}/detects/queries/detects/v1",
                    headers=self._get_headers(),
                    params=validated_params
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
                            return self._sanitize_detection_data(details_response.json().get("resources", []))
                    
                    return []
                else:
                    self.logger.warning(f"API request failed with status {response.status_code}")
                    return {"error": "Failed to retrieve detection data"}
                    
            except SecurityError as e:
                self.logger.error(f"Security validation failed: {e}")
                return {"error": "Invalid request parameters"}
            except Exception as e:
                self.logger.error(f"Search detections failed: {type(e).__name__}")
                return {"error": "Internal server error occurred"}
    
    def _validate_search_params(self, filter_query: str, limit: int, sort: str) -> Dict[str, Any]:
        """Validate and sanitize search parameters"""
        # Validate limit
        if not isinstance(limit, int) or limit < 1 or limit > 1000:
            raise SecurityError("Limit must be between 1 and 1000")
        
        # Validate sort parameter
        if sort not in VALID_SORT_PATTERNS:
            raise SecurityError("Invalid sort parameter")
        
        # Validate and sanitize filter query
        if filter_query:
            if len(filter_query) > 1000:
                raise SecurityError("Filter query too long")
            
            if not SAFE_FQL_PATTERN.match(filter_query):
                raise SecurityError("Invalid characters in filter query")
            
            # Additional FQL injection protection
            dangerous_patterns = [
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(--|\#|\/\*|\*\/)',
                r'(\bor\b.*\b1\s*=\s*1\b)',
                r'(\band\b.*\b1\s*=\s*1\b)'
            ]
            
            for pattern in dangerous_patterns:
                if re.search(pattern, filter_query.lower()):
                    raise SecurityError("Potentially malicious filter query detected")
        
        params = {
            "limit": limit,
            "sort": sort
        }
        
        if filter_query:
            params["filter"] = filter_query
        
        return params
    
    def _sanitize_detection_data(self, detections: List[Dict]) -> List[Dict]:
        """Sanitize detection data to remove sensitive information"""
        sanitized = []
        
        for detection in detections:
            # Remove potentially sensitive fields
            sanitized_detection = {}
            
            # Allow only safe fields
            safe_fields = [
                "detection_id", "created_timestamp", "updated_timestamp",
                "severity", "status", "device", "behaviors"
            ]
            
            for field in safe_fields:
                if field in detection:
                    if field == "behaviors" and isinstance(detection[field], list):
                        # Sanitize behavior data
                        sanitized_detection[field] = [
                            {k: v for k, v in behavior.items() 
                             if k not in ["raw_data", "command_line", "file_path"]}
                            for behavior in detection[field]
                        ]
                    else:
                        sanitized_detection[field] = detection[field]
            
            sanitized.append(sanitized_detection)
        
        return sanitized
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "CrowdStrike-MCP-Server/1.0"
        }
        if self.config.member_cid:
            headers["X-CS-USERUUID"] = self.config.member_cid
        return headers
    
    def _create_secure_client(self) -> httpx.AsyncClient:
        """Create HTTP client with secure SSL/TLS configuration"""
        # Create secure SSL context
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_REQUIRED
        ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
        
        # Disable weak ciphers
        ssl_context.set_ciphers("ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS")
        
        return httpx.AsyncClient(
            timeout=30.0,
            verify=ssl_context,
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)
        )
    
    async def _ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return
            
        if not self.client:
            self.client = self._create_secure_client()
        
        # OAuth 2.0 client credentials flow
        auth_data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret
        }
        
        try:
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
                self.logger.info("Authentication successful")
            else:
                self.logger.error(f"Authentication failed with status {response.status_code}")
                raise SecurityError("Authentication failed")
                
        except httpx.RequestError as e:
            self.logger.error(f"Authentication request failed: {type(e).__name__}")
            raise SecurityError("Authentication request failed")
    
    def _register_resources(self):
        """Register available resources"""
        # Resources implementation would go here
        pass

    async def run(self, host: str = "localhost", port: int = 8081):
        """Start the MCP server"""
        # Validate host parameter
        if not re.match(r'^[a-zA-Z0-9\-\.]+$', host):
            raise SecurityError("Invalid host parameter")
        
        # Validate port parameter
        if not isinstance(port, int) or port < 1024 or port > 65535:
            raise SecurityError("Port must be between 1024 and 65535")
        
        self.logger.info(f"Starting CrowdStrike MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)
    
    async def close(self):
        """Clean up resources"""
        if self.client:
            await self.client.aclose()
        self.access_token = None
        self.token_expires = None

async def main():
    import os
    
    # Configure secure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        config = CrowdStrikeConfig(
            client_id=os.getenv("CROWDSTRIKE_CLIENT_ID", ""),
            client_secret=os.getenv("CROWDSTRIKE_CLIENT_SECRET", ""),
            base_url=os.getenv("CROWDSTRIKE_BASE_URL", "https://api.crowdstrike.com")
        )
        
        server = CrowdStrikeMCPServer(config)
        await server.run()
        
    except SecurityError as e:
        logging.error(f"Security configuration error: {e}")
        return 1
    except Exception as e:
        logging.error(f"Server startup failed: {type(e).__name__}")
        return 1
    finally:
        if 'server' in locals():
            await server.close()
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)