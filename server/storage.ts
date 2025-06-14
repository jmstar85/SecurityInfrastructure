import { 
  codeExamples, 
  searchQueries,
  type CodeExample, 
  type InsertCodeExample,
  type SearchQuery,
  type InsertSearchQuery 
} from "@shared/schema";

export interface IStorage {
  getAllCodeExamples(): Promise<CodeExample[]>;
  getCodeExamplesByCategory(category: string): Promise<CodeExample[]>;
  searchCodeExamples(query: string): Promise<CodeExample[]>;
  trackSearchQuery(query: string): Promise<void>;
  getPopularSearchQueries(limit?: number): Promise<SearchQuery[]>;
}

export class MemStorage implements IStorage {
  private codeExamples: Map<number, CodeExample>;
  private searchQueries: Map<number, SearchQuery>;
  private currentCodeExampleId: number;
  private currentSearchQueryId: number;

  constructor() {
    this.codeExamples = new Map();
    this.searchQueries = new Map();
    this.currentCodeExampleId = 1;
    this.currentSearchQueryId = 1;
    
    // Initialize with default code examples
    this._initializeCodeExamples();
  }

  private _initializeCodeExamples() {
    const examples: Omit<CodeExample, 'id' | 'createdAt'>[] = [
      {
        title: "Splunk MCP Server",
        description: "Complete MCP server implementation for Splunk SIEM integration",
        code: `#!/usr/bin/env python3
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
        self._register_resources()`,
        language: "python",
        category: "splunk"
      },
      {
        title: "CrowdStrike MCP Server",
        description: "Complete MCP server implementation for CrowdStrike EDR integration",
        code: `#!/usr/bin/env python3
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
        self.logger = logging.getLogger(__name__)`,
        language: "python",
        category: "crowdstrike"
      },
      {
        title: "Microsoft MISP MCP Server",
        description: "Complete MCP server implementation for Microsoft MISP integration",
        code: `#!/usr/bin/env python3
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
        self.logger = logging.getLogger(__name__)`,
        language: "python",
        category: "misp"
      },
      {
        title: "Docker Compose Configuration",
        description: "Docker compose setup for all MCP servers",
        code: `version: '3.8'

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

networks:
  mcp-network:
    driver: bridge`,
        language: "yaml",
        category: "docker"
      }
    ];

    examples.forEach(example => {
      const codeExample: CodeExample = {
        id: this.currentCodeExampleId++,
        createdAt: new Date(),
        ...example
      };
      this.codeExamples.set(codeExample.id, codeExample);
    });
  }

  async getAllCodeExamples(): Promise<CodeExample[]> {
    return Array.from(this.codeExamples.values());
  }

  async getCodeExamplesByCategory(category: string): Promise<CodeExample[]> {
    return Array.from(this.codeExamples.values()).filter(
      example => example.category === category
    );
  }

  async searchCodeExamples(query: string): Promise<CodeExample[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.codeExamples.values()).filter(example => 
      example.title.toLowerCase().includes(searchTerm) ||
      example.description.toLowerCase().includes(searchTerm) ||
      example.code.toLowerCase().includes(searchTerm) ||
      example.category.toLowerCase().includes(searchTerm)
    );
  }

  async trackSearchQuery(query: string): Promise<void> {
    // Find existing query
    const existingQuery = Array.from(this.searchQueries.values())
      .find(sq => sq.query === query);

    if (existingQuery) {
      // Update count and last searched time
      existingQuery.count += 1;
      existingQuery.lastSearched = new Date();
    } else {
      // Create new search query record
      const searchQuery: SearchQuery = {
        id: this.currentSearchQueryId++,
        query,
        count: 1,
        lastSearched: new Date()
      };
      this.searchQueries.set(searchQuery.id, searchQuery);
    }
  }

  async getPopularSearchQueries(limit: number = 10): Promise<SearchQuery[]> {
    return Array.from(this.searchQueries.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
