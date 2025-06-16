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

**Complete documentation and code examples**: [https://jmstar85.github.io/SecurityInfrastructure](https://jmstar85.github.io/SecurityInfrastructure)

Features available in the live documentation:
- 📋 Complete server implementation code
- 🔍 Real-time search and filtering
- 📱 Responsive mobile support
- 📑 One-click code copying
- 🗂️ Organized by categories

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/jmstar85/SecurityInfrastructure.git
cd SecurityInfrastructure

# 2. Install Python dependencies
pip install -r project-requirements.txt

# 3. Configure your security platforms
# Edit config/splunk.yaml, config/crowdstrike.yaml, config/misp.yaml
# Add your API credentials and connection settings

# 4. Start individual MCP servers
python src/splunk_server.py        # Runs on localhost:8080
python src/crowdstrike_server.py   # Runs on localhost:8081
python src/misp_server.py          # Runs on localhost:8082

# Or use Docker for all services
docker-compose up -d

# 5. Run tests to verify connectivity
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
├── tests/                  # Unit tests
├── config/                 # Configuration files
├── docker-compose.yml      # Container configuration
└── project-requirements.txt # Python dependencies
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
- Docker & Docker Compose
- Access credentials for respective security platforms

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