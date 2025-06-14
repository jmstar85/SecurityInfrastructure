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
import xml.etree.ElementTree as ET
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
        
        @self.server.tool("get-indexes")
        async def get_indexes() -> List[Dict]:
            """Get list of available Splunk indexes"""
            try:
                await self._ensure_authenticated()
                
                response = await self.client.get(
                    f"https://{self.config.host}:{self.config.port}/services/data/indexes",
                    headers={"Authorization": f"Splunk {self.session_key}"},
                    params={"output_mode": "json", "count": 0}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("entry", [])
                else:
                    raise Exception(f"Failed to get indexes: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Get indexes failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("create-alert")
        async def create_alert(name: str, search: str, cron_schedule: str, 
                             email: Optional[str] = None) -> Dict:
            """
            Create a scheduled alert in Splunk
            
            Args:
                name: Alert name
                search: SPL search query for the alert
                cron_schedule: Cron expression for scheduling
                email: Optional email address for notifications
            """
            try:
                await self._ensure_authenticated()
                
                alert_data = {
                    "name": name,
                    "search": search,
                    "cron_schedule": cron_schedule,
                    "is_scheduled": "1",
                    "actions": "email" if email else ""
                }
                
                if email:
                    alert_data["action.email.to"] = email
                
                response = await self.client.post(
                    f"https://{self.config.host}:{self.config.port}/services/saved/searches",
                    data=alert_data,
                    headers={"Authorization": f"Splunk {self.session_key}"}
                )
                
                if response.status_code == 201:
                    return {"status": "success", "message": f"Alert '{name}' created"}
                else:
                    raise Exception(f"Failed to create alert: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Create alert failed: {e}")
                return {"error": str(e)}
    
    def _register_resources(self):
        """Register available resources"""
        
        @self.server.resource("splunk://dashboards")
        async def get_dashboards() -> TextContent:
            """Get list of Splunk dashboards"""
            try:
                await self._ensure_authenticated()
                
                response = await self.client.get(
                    f"https://{self.config.host}:{self.config.port}/services/data/ui/views",
                    headers={"Authorization": f"Splunk {self.session_key}"},
                    params={"output_mode": "json"}
                )
                
                if response.status_code == 200:
                    dashboards = response.json().get("entry", [])
                    return TextContent(
                        type="text",
                        text=json.dumps(dashboards, indent=2)
                    )
                else:
                    return ErrorContent(
                        type="error",
                        error=f"Failed to get dashboards: {response.text}"
                    )
                    
            except Exception as e:
                return ErrorContent(
                    type="error",
                    error=f"Error getting dashboards: {e}"
                )
    
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
                root = ET.fromstring(status_response.text)
                dispatch_state = None
                for entry in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                    for content in entry.findall('.//{http://www.w3.org/2005/Atom}content'):
                        for key in content.findall('.//s:key[@name="dispatchState"]', 
                                                  {'s': 'http://dev.splunk.com/ns/rest'}):
                            dispatch_state = key.text
                            break
                
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
                root = ET.fromstring(response.text)
                session_key_elem = root.find('.//{http://dev.splunk.com/ns/rest}sessionKey')
                if session_key_elem is not None:
                    self.session_key = session_key_elem.text
                else:
                    raise Exception("Session key not found in response")
            else:
                raise Exception(f"Authentication failed: {response.text}")

    async def run(self, host: str = "localhost", port: int = 8080):
        """Start the MCP server"""
        self.logger.info(f"Starting Splunk MCP Server on {host}:{port}")
        await self.server.run(host=host, port=port)

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
        
        @self.server.tool("get-hosts")
        async def get_hosts(filter_query: str = "", limit: int = 100) -> List[Dict]:
            """
            Get list of hosts/endpoints
            
            Args:
                filter_query: FQL filter query (e.g., "platform_name:'Windows'")
                limit: Maximum number of results
            """
            try:
                await self._ensure_authenticated()
                
                params = {
                    "limit": limit
                }
                if filter_query:
                    params["filter"] = filter_query
                
                response = await self.client.get(
                    f"{self.config.base_url}/devices/queries/devices/v1",
                    headers=self._get_headers(),
                    params=params
                )
                
                if response.status_code == 200:
                    device_ids = response.json().get("resources", [])
                    
                    if device_ids:
                        # Get detailed device information
                        details_response = await self.client.post(
                            f"{self.config.base_url}/devices/entities/devices/v2",
                            headers=self._get_headers(),
                            json={"ids": device_ids}
                        )
                        
                        if details_response.status_code == 200:
                            return details_response.json().get("resources", [])
                    
                    return []
                else:
                    raise Exception(f"Failed to get hosts: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Get hosts failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("quarantine-host")
        async def quarantine_host(device_id: str, action: str = "contain") -> Dict:
            """
            Quarantine or unquarantine a host
            
            Args:
                device_id: Device ID to quarantine/unquarantine
                action: Action to take ("contain" or "lift_containment")
            """
            try:
                await self._ensure_authenticated()
                
                if action not in ["contain", "lift_containment"]:
                    return {"error": "Invalid action. Use 'contain' or 'lift_containment'"}
                
                response = await self.client.post(
                    f"{self.config.base_url}/devices/entities/devices-actions/v2",
                    headers=self._get_headers(),
                    params={"action_name": action},
                    json={"ids": [device_id]}
                )
                
                if response.status_code == 202:
                    result = response.json()
                    return {
                        "status": "success",
                        "action": action,
                        "device_id": device_id,
                        "batch_id": result.get("batch_id")
                    }
                else:
                    raise Exception(f"Failed to {action} host: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Quarantine host failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("run-rtr-command")
        async def run_rtr_command(device_id: str, command: str, 
                                command_type: str = "runscript") -> Dict:
            """
            Run Real Time Response (RTR) command on a host
            
            Args:
                device_id: Device ID to run command on
                command: Command to execute
                command_type: Type of command ("runscript", "get", "put")
            """
            try:
                await self._ensure_authenticated()
                
                # Start RTR session
                session_response = await self.client.post(
                    f"{self.config.base_url}/real-time-response/entities/sessions/v1",
                    headers=self._get_headers(),
                    json={
                        "device_id": device_id,
                        "origin": "mcp-server"
                    }
                )
                
                if session_response.status_code != 201:
                    raise Exception(f"Failed to create RTR session: {session_response.text}")
                
                session_id = session_response.json()["resources"][0]["session_id"]
                
                # Execute command
                command_response = await self.client.post(
                    f"{self.config.base_url}/real-time-response/entities/command/v1",
                    headers=self._get_headers(),
                    json={
                        "session_id": session_id,
                        "command_type": command_type,
                        "raw_command": command
                    }
                )
                
                if command_response.status_code == 201:
                    result = command_response.json()
                    return {
                        "status": "success",
                        "session_id": session_id,
                        "cloud_request_id": result.get("meta", {}).get("trace_id"),
                        "stdout": result.get("resources", [{}])[0].get("stdout", ""),
                        "stderr": result.get("resources", [{}])[0].get("stderr", "")
                    }
                else:
                    raise Exception(f"Failed to execute command: {command_response.text}")
                    
            except Exception as e:
                self.logger.error(f"RTR command failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("search-iocs")
        async def search_iocs(types: List[str] = None, values: List[str] = None, 
                            limit: int = 100) -> List[Dict]:
            """
            Search for Indicators of Compromise (IOCs)
            
            Args:
                types: List of IOC types to search for
                values: List of IOC values to search for
                limit: Maximum number of results
            """
            try:
                await self._ensure_authenticated()
                
                params = {
                    "limit": limit
                }
                
                if types:
                    params["types"] = types
                if values:
                    params["values"] = values
                
                response = await self.client.get(
                    f"{self.config.base_url}/indicators/queries/iocs/v1",
                    headers=self._get_headers(),
                    params=params
                )
                
                if response.status_code == 200:
                    ioc_ids = response.json().get("resources", [])
                    
                    if ioc_ids:
                        # Get detailed IOC information
                        details_response = await self.client.post(
                            f"{self.config.base_url}/indicators/entities/iocs/GET/v1",
                            headers=self._get_headers(),
                            json={"ids": ioc_ids}
                        )
                        
                        if details_response.status_code == 200:
                            return details_response.json().get("resources", [])
                    
                    return []
                else:
                    raise Exception(f"Failed to search IOCs: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Search IOCs failed: {e}")
                return {"error": str(e)}
    
    def _register_resources(self):
        """Register available resources"""
        
        @self.server.resource("crowdstrike://incidents")
        async def get_incidents() -> TextContent:
            """Get list of security incidents"""
            try:
                await self._ensure_authenticated()
                
                response = await self.client.get(
                    f"{self.config.base_url}/incidents/queries/incidents/v1",
                    headers=self._get_headers(),
                    params={"limit": 50, "sort": "created_timestamp.desc"}
                )
                
                if response.status_code == 200:
                    incident_ids = response.json().get("resources", [])
                    
                    if incident_ids:
                        details_response = await self.client.post(
                            f"{self.config.base_url}/incidents/entities/incidents/GET/v1",
                            headers=self._get_headers(),
                            json={"ids": incident_ids}
                        )
                        
                        if details_response.status_code == 200:
                            incidents = details_response.json().get("resources", [])
                            return TextContent(
                                type="text",
                                text=json.dumps(incidents, indent=2)
                            )
                    
                    return TextContent(
                        type="text",
                        text="No incidents found"
                    )
                else:
                    return ErrorContent(
                        type="error",
                        error=f"Failed to get incidents: {response.text}"
                    )
                    
            except Exception as e:
                return ErrorContent(
                    type="error",
                    error=f"Error getting incidents: {e}"
                )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def _ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return
        
        if not self.client:
            self.client = httpx.AsyncClient(timeout=30.0)
        
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
    logging.basicConfig(level=logging.INFO)
    
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
        
        @self.server.tool("create-event")
        async def create_event(info: str, distribution: int = 0, 
                             threat_level_id: int = 3, analysis: int = 0) -> Dict:
            """
            Create a new MISP event
            
            Args:
                info: Event description
                distribution: Distribution level (0-4)
                threat_level_id: Threat level (1-4)
                analysis: Analysis status (0-2)
            """
            try:
                await self._ensure_client()
                
                event_data = {
                    "Event": {
                        "info": info,
                        "distribution": distribution,
                        "threat_level_id": threat_level_id,
                        "analysis": analysis
                    }
                }
                
                response = await self.client.post(
                    f"{self.config.url}/events",
                    headers=self._get_headers(),
                    json=event_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "status": "success",
                        "event_id": result.get("Event", {}).get("id"),
                        "uuid": result.get("Event", {}).get("uuid")
                    }
                else:
                    raise Exception(f"Failed to create event: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Create event failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("add-attribute")
        async def add_attribute(event_id: str, type: str, value: str, 
                              category: str = "Network activity", to_ids: bool = True) -> Dict:
            """
            Add an attribute to a MISP event
            
            Args:
                event_id: Event ID to add attribute to
                type: Attribute type (ip-dst, domain, md5, etc.)
                value: Attribute value
                category: Attribute category
                to_ids: Whether to use for IDS signatures
            """
            try:
                await self._ensure_client()
                
                attribute_data = {
                    "Attribute": {
                        "type": type,
                        "value": value,
                        "category": category,
                        "to_ids": to_ids
                    }
                }
                
                response = await self.client.post(
                    f"{self.config.url}/attributes/add/{event_id}",
                    headers=self._get_headers(),
                    json=attribute_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "status": "success",
                        "attribute_id": result.get("Attribute", {}).get("id"),
                        "uuid": result.get("Attribute", {}).get("uuid")
                    }
                else:
                    raise Exception(f"Failed to add attribute: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Add attribute failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("publish-event")
        async def publish_event(event_id: str) -> Dict:
            """
            Publish a MISP event
            
            Args:
                event_id: Event ID to publish
            """
            try:
                await self._ensure_client()
                
                response = await self.client.post(
                    f"{self.config.url}/events/publish/{event_id}",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    return {"status": "success", "message": f"Event {event_id} published"}
                else:
                    raise Exception(f"Failed to publish event: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Publish event failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("get-taxonomies")
        async def get_taxonomies() -> List[Dict]:
            """Get list of available taxonomies"""
            try:
                await self._ensure_client()
                
                response = await self.client.get(
                    f"{self.config.url}/taxonomies",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", [])
                else:
                    raise Exception(f"Failed to get taxonomies: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Get taxonomies failed: {e}")
                return {"error": str(e)}
        
        @self.server.tool("tag-event")
        async def tag_event(event_id: str, tag: str) -> Dict:
            """
            Add a tag to a MISP event
            
            Args:
                event_id: Event ID to tag
                tag: Tag name to add
            """
            try:
                await self._ensure_client()
                
                tag_data = {
                    "Tag": {
                        "name": tag
                    }
                }
                
                response = await self.client.post(
                    f"{self.config.url}/events/addTag/{event_id}",
                    headers=self._get_headers(),
                    json=tag_data
                )
                
                if response.status_code == 200:
                    return {"status": "success", "message": f"Tag '{tag}' added to event {event_id}"}
                else:
                    raise Exception(f"Failed to tag event: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"Tag event failed: {e}")
                return {"error": str(e)}
    
    def _register_resources(self):
        """Register available resources"""
        
        @self.server.resource("misp://organizations")
        async def get_organizations() -> TextContent:
            """Get list of MISP organizations"""
            try:
                await self._ensure_client()
                
                response = await self.client.get(
                    f"{self.config.url}/organisations",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    organizations = response.json().get("response", [])
                    return TextContent(
                        type="text",
                        text=json.dumps(organizations, indent=2)
                    )
                else:
                    return ErrorContent(
                        type="error",
                        error=f"Failed to get organizations: {response.text}"
                    )
                    
            except Exception as e:
                return ErrorContent(
                    type="error",
                    error=f"Error getting organizations: {e}"
                )
        
        @self.server.resource("misp://feeds")
        async def get_feeds() -> TextContent:
            """Get list of MISP feeds"""
            try:
                await self._ensure_client()
                
                response = await self.client.get(
                    f"{self.config.url}/feeds",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    feeds = response.json().get("response", [])
                    return TextContent(
                        type="text",
                        text=json.dumps(feeds, indent=2)
                    )
                else:
                    return ErrorContent(
                        type="error",
                        error=f"Failed to get feeds: {response.text}"
                    )
                    
            except Exception as e:
                return ErrorContent(
                    type="error",
                    error=f"Error getting feeds: {e}"
                )
    
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
    logging.basicConfig(level=logging.INFO)
    
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
