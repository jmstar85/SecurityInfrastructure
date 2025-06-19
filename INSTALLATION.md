# MCP Server Installation & Configuration Guide

## Overview
This guide helps you set up and configure the Security Infrastructure MCP servers for use with Claude Desktop or other MCP-compatible clients.

## Prerequisites
- Python 3.11+
- Git
- Claude Desktop (or another MCP client)

## Installation Steps

### 1. Clone and Setup Repository
```bash
git clone https://github.com/jmstar85/SecurityInfrastructure.git
cd SecurityInfrastructure
pip install -r project-requirements.txt
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env file with your actual credentials
```

### 3. Claude Desktop Configuration

#### Option A: Individual Server Configuration
Add each server separately to your Claude Desktop configuration file:

**Location:** 
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "splunk-siem": {
      "command": "python",
      "args": ["/path/to/SecurityInfrastructure/src/splunk_server.py"],
      "env": {
        "SPLUNK_HOST": "your-splunk-host.com",
        "SPLUNK_PORT": "8089",
        "SPLUNK_USERNAME": "admin",
        "SPLUNK_PASSWORD": "your-password",
        "SPLUNK_TOKEN": "your-api-token",
        "SPLUNK_VERIFY_SSL": "true"
      }
    },
    "crowdstrike-edr": {
      "command": "python",
      "args": ["/path/to/SecurityInfrastructure/src/crowdstrike_server.py"],
      "env": {
        "CROWDSTRIKE_CLIENT_ID": "your-client-id",
        "CROWDSTRIKE_CLIENT_SECRET": "your-client-secret",
        "CROWDSTRIKE_BASE_URL": "https://api.crowdstrike.com"
      }
    },
    "misp-threat-intel": {
      "command": "python",
      "args": ["/path/to/SecurityInfrastructure/src/misp_server.py"],
      "env": {
        "MISP_URL": "https://your-misp-instance.com",
        "MISP_KEY": "your-api-key",
        "MISP_VERIFY_CERT": "true"
      }
    }
  }
}
```

#### Option B: Using Configuration File
Copy the provided configuration template:
```bash
cp config/mcp-settings.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Then edit the file with your credentials.

## Platform-Specific Setup

### Splunk SIEM Setup
1. **API Token Method (Recommended):**
   - Generate API token in Splunk Web: Settings > Tokens
   - Use token instead of username/password

2. **Username/Password Method:**
   - Ensure user has search permissions
   - Enable REST API access

**Required Environment Variables:**
```
SPLUNK_HOST=your-splunk-server.com
SPLUNK_PORT=8089
SPLUNK_TOKEN=your-api-token
SPLUNK_VERIFY_SSL=true
```

### CrowdStrike EDR Setup
1. **Create API Client:**
   - Log into Falcon Console
   - Go to Support > API Clients & Keys
   - Create new API client with these scopes:
     - Detections: READ
     - Hosts: READ
     - Incidents: READ

2. **OAuth Configuration:**
   - Note Client ID and Client Secret
   - Select appropriate base URL for your region

**Required Environment Variables:**
```
CROWDSTRIKE_CLIENT_ID=your-client-id
CROWDSTRIKE_CLIENT_SECRET=your-client-secret
CROWDSTRIKE_BASE_URL=https://api.crowdstrike.com
```

### Microsoft MISP Setup
1. **Generate API Key:**
   - Log into MISP instance
   - Go to Global Actions > My Profile
   - Generate new auth key

2. **SSL Configuration:**
   - Set verify certificate based on your MISP setup
   - For self-signed certificates, set to false

**Required Environment Variables:**
```
MISP_URL=https://your-misp-instance.com
MISP_KEY=your-api-key
MISP_VERIFY_CERT=true
```

## Testing Your Setup

### 1. Test Individual Servers
```bash
# Test Splunk server
python src/splunk_server.py

# Test CrowdStrike server  
python src/crowdstrike_server.py

# Test MISP server
python src/misp_server.py
```

### 2. Run Automated Tests
```bash
pytest tests/test_mcp_servers.py -v
```

### 3. Claude Desktop Integration
1. Restart Claude Desktop after configuration
2. Start a new conversation
3. Test MCP tools:
   - "Search for failed login events in Splunk"
   - "Find high severity detections in CrowdStrike"
   - "Search for IP indicators in MISP"

## Troubleshooting

### Common Issues

**Authentication Errors:**
- Verify credentials are correct
- Check API key permissions
- Ensure network connectivity to platforms

**SSL Certificate Errors:**
- Set `VERIFY_SSL=false` for self-signed certificates
- Ensure proper certificate chain for production

**Permission Errors:**
- Verify API user has required permissions
- Check scope settings for CrowdStrike API client

### Logs and Debugging
Enable debug logging by setting:
```bash
export LOG_LEVEL=DEBUG
```

## Security Best Practices

1. **Credential Management:**
   - Store credentials in environment variables
   - Never commit credentials to version control
   - Use API tokens instead of passwords when possible

2. **Network Security:**
   - Use SSL/TLS for all connections
   - Implement proper firewall rules
   - Consider VPN for remote access

3. **Access Control:**
   - Use least privilege principle for API accounts
   - Regularly rotate API keys
   - Monitor API usage

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for error details
3. Verify platform connectivity and credentials
4. Submit issues to the repository

## Advanced Configuration

### Custom Ports
Modify server ports by setting environment variables:
```bash
MCP_SPLUNK_PORT=8080
MCP_CROWDSTRIKE_PORT=8081
MCP_MISP_PORT=8082
```

### Docker Deployment
Use the provided docker-compose.yml for containerized deployment:
```bash
docker-compose up -d
```

### Load Balancing
For high-availability setups, configure multiple server instances with load balancing.