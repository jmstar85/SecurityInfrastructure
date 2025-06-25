# Security Infrastructure MCP Servers

A comprehensive collection of MCP (Model Context Protocol) server implementations for security platform integrations.

## 🔐 Supported Platforms

### Splunk SIEM
- **SPL Query Execution**: Execute Search Processing Language queries with custom time ranges
- **Event Search**: Search security events across all indexes with flexible filtering
- **Time-based Analysis**: Support for relative time ranges (-24h, -1d) and custom time windows
- **Asynchronous Job Management**: Create and monitor search jobs with automatic result retrieval
- **JSON Result Format**: Structured output for seamless integration with other tools

### CrowdStrike EDR  
- **Detection Search**: Query detections using FQL (Falcon Query Language) with advanced filtering
- **Detection Details**: Retrieve comprehensive detection summaries and metadata
- **OAuth 2.0 Authentication**: Secure API access using client credentials flow
- **Sorting and Pagination**: Flexible result ordering and limit controls
- **Real-time Threat Data**: Access to latest endpoint detection and response information

### Microsoft MISP
- **Event Search**: Query MISP events with customizable filters and event type targeting
- **IOC Attribute Search**: Search indicators of compromise by value, type, or category
- **Multi-format Support**: Handle various IOC types (IP addresses, domains, hashes, URLs)
- **Published Status Filtering**: Filter events by publication status
- **RESTful API Integration**: Native MISP REST API support with JSON responses

## 📖 Live Documentation

Features available in the live documentation:
- 📋 Complete server implementation code
- 🔍 Real-time search and filtering
- 📱 Responsive mobile support
- 📑 One-click code copying
- 🗂️ Organized by categories

## 🚀 Quick Start

### For MCP Client Integration (Claude Desktop)

```bash
# 1. Clone the repository
git clone https://github.com/jmstar85/SecurityInfrastructure.git
cd SecurityInfrastructure

# 2. Install dependencies
pip install -r project-requirements.txt

# 3. Configure credentials
cp .env.example .env
# Edit .env with your platform credentials

# 4. Add to Claude Desktop configuration
# Copy config/mcp-settings.json content to your Claude Desktop config
# Location: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
# Update the "cwd" paths and environment variables with your values
```

### For Standalone Server Usage

```bash
# Start individual MCP servers
python src/splunk_server.py        # Runs on localhost:8080
python src/crowdstrike_server.py   # Runs on localhost:8081
python src/misp_server.py          # Runs on localhost:8082

# Or use Docker for all services
docker-compose up -d

# Run tests to verify connectivity
pytest tests/test_mcp_servers.py -v
```

## 🔧 MCP Server Tools

### Splunk SIEM Tools
- `search-events`: Execute SPL queries with time range filtering
  ```python
  # Example: Search for failed login attempts in last 24 hours
  query = "index=security sourcetype=auth action=failure"
  earliest_time = "-24h"
  ```

### CrowdStrike EDR Tools  
- `search-detections`: Query detections using FQL filtering
  ```python
  # Example: Search for high severity detections
  filter_query = "max_severity:'high'"
  sort = "created_timestamp.desc"
  ```

### MISP Tools
- `search-events`: Query threat intelligence events
- `search-attributes`: Search IOCs by type, value, or category
  ```python
  # Example: Search for IP-based IOCs
  type = "ip-dst"
  category = "Network activity"
  ```

## 📁 Project Structure

```
SecurityInfrastructure/
├── docs/                    # GitHub Pages documentation
│   ├── index.html          # Main documentation page
│   └── assets/             # CSS, JS resources
├── src/                    # MCP server source code
│   ├── splunk_server.py    # Splunk SIEM integration
│   ├── crowdstrike_server.py # CrowdStrike EDR integration
│   └── misp_server.py      # Microsoft MISP integration
├── config/                 # Configuration files
│   └── mcp-settings.json   # MCP client configuration template
├── tests/                  # Unit tests
├── mcp-config.json         # Basic MCP configuration
├── .env.example            # Environment variables template
├── INSTALLATION.md         # Detailed setup guide
├── docker-compose.yml      # Container configuration
└── project-requirements.txt # Python dependencies
```

## 🔧 MCP Client Configuration

### Claude Desktop Setup

**Configuration File Location:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Basic Configuration:**
```json
{
  "mcpServers": {
    "security-infrastructure-splunk": {
      "command": "python",
      "args": ["/path/to/SecurityInfrastructure/src/splunk_server.py"],
      "env": {
        "SPLUNK_HOST": "your-splunk-host.com",
        "SPLUNK_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Complete setup instructions:** See [INSTALLATION.md](INSTALLATION.md) for detailed configuration guide.
**Quick setup:** See [setup-guide.md](setup-guide.md) for copy-paste configuration templates.

## 💻 Usage Examples

Once configured with Claude Desktop, you can use natural language to interact with your security platforms:

### Splunk SIEM Queries
```
"Search for failed SSH login attempts in the last 6 hours"
"Find all authentication events from IP 192.168.1.100"  
"Show me high priority security alerts from yesterday"
"Search for events in the security index containing 'malware'"
```

### CrowdStrike EDR Queries  
```
"Show me all high severity detections from today"
"Find endpoint detections with 'ransomware' behavior"
"List recent detections sorted by creation time"
"Search for detections on hostname 'web-server-01'"
```

### MISP Threat Intelligence
```
"Search for events related to APT29"
"Find all IP address indicators of compromise"
"Look up domain indicators from the last week"
"Search for published threat intelligence events about phishing"
```

### Cross-Platform Analysis
```
"Search Splunk for events related to this CrowdStrike detection ID"
"Check MISP for threat intelligence on this suspicious IP from Splunk"
"Correlate this endpoint detection with known threat indicators"
```

## 🔧 Configuration Examples

### Splunk Connection
```yaml
splunk:
  host: "your-splunk-server.com"
  port: 8089
  username: "admin"
  token: "your-api-token"
  verify_ssl: true
```

### CrowdStrike Authentication
```yaml
crowdstrike:
  client_id: "your-client-id"
  client_secret: "your-client-secret"
  base_url: "https://api.crowdstrike.com"
```

### MISP Setup
```yaml
misp:
  url: "https://your-misp-instance.com"
  key: "your-api-key"
  verifycert: true
```

## 🛠️ Key Features

### Core Functionality
- **MCP Protocol Integration**: Native Model Context Protocol server implementation
- **Asynchronous Operations**: Non-blocking API calls for optimal performance
- **Multi-platform Support**: Unified interface for Splunk, CrowdStrike, and MISP
- **Flexible Query Language**: Support for SPL, FQL, and MISP REST queries

### Security & Authentication
- **Multiple Auth Methods**: Session-based, token-based, and OAuth 2.0 authentication
- **SSL/TLS Support**: Configurable certificate verification for secure connections
- **API Key Management**: Secure credential handling and rotation support
- **Error Recovery**: Automatic token refresh and connection retry mechanisms

### Data Processing
- **Real-time Search**: Live querying across security platforms
- **Structured Output**: Consistent JSON response format across all integrations
- **Time Range Flexibility**: Custom time windows and relative time specifications
- **Result Pagination**: Configurable limits and sorting for large datasets

### Development & Testing
- **Comprehensive Testing**: Unit tests with pytest framework
- **Docker Support**: Containerized deployment with docker-compose
- **Configuration Management**: YAML-based configuration with environment variable support
- **Logging & Monitoring**: Structured logging with configurable levels

## 📋 Requirements

- Python 3.11+
- Access credentials for security platforms (API keys, tokens)
- MCP-compatible client (Claude Desktop, or other MCP clients)
- Docker & Docker Compose (optional, for containerized deployment)

## 🔐 Required Credentials

### Splunk SIEM
- **API Token** (recommended) or Username/Password
- **Host/Port** information for your Splunk instance
- **Search permissions** on target indexes

### CrowdStrike EDR
- **Client ID** and **Client Secret** from Falcon Console
- API permissions: Detections (READ), Hosts (READ), Incidents (READ)
- Appropriate **Base URL** for your region

### Microsoft MISP
- **API Key** generated from MISP user profile
- **MISP instance URL**
- Read access to events and attributes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is provided for security research and educational purposes.

## 🔗 Related Links

- [MCP Protocol Documentation](https://github.com/anthropics/mcp)
- [Splunk API Documentation](https://docs.splunk.com/Documentation/Splunk/latest/RESTREF)
- [CrowdStrike API Documentation](https://falcon.crowdstrike.com/documentation)
- [MISP API Documentation](https://www.misp-project.org/openapi/)

---

⭐ **If you find this useful, please give it a star!**