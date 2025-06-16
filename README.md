# Security Infrastructure MCP Servers

A comprehensive collection of MCP (Model Context Protocol) server implementations for security platform integrations.

## 🔐 Supported Platforms

### Splunk SIEM
- Security Information and Event Management
- SPL query execution and result analysis
- Real-time alerting and dashboard management

### CrowdStrike EDR  
- Endpoint Detection and Response
- Threat hunting and incident investigation
- Host management and policy deployment

### Microsoft MISP
- Threat Intelligence Sharing Platform
- IOC search and analysis
- Threat intelligence feed management

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

# 2. Install dependencies
pip install -r project-requirements.txt

# 3. Setup environment variables
cp .env.example .env
# Edit .env file with your API keys and credentials

# 4. Run tests
pytest tests/

# 5. Start servers
docker-compose up -d
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

- **Asynchronous API Calls**: Efficient communication with all platforms
- **Error Handling**: Robust error handling and retry logic
- **Security Authentication**: Token-based and OAuth 2.0 support
- **Logging System**: Structured logging and monitoring
- **Test Coverage**: Comprehensive unit and integration tests

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