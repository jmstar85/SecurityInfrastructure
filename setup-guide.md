# MCP Server Quick Setup Guide

## Copy-Paste Configuration Templates

### 1. Claude Desktop Configuration
Copy this configuration to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "splunk-siem": {
      "command": "python",
      "args": ["/FULL/PATH/TO/SecurityInfrastructure/src/splunk_server.py"],
      "env": {
        "SPLUNK_HOST": "YOUR_SPLUNK_HOST",
        "SPLUNK_PORT": "8089",
        "SPLUNK_TOKEN": "YOUR_API_TOKEN",
        "SPLUNK_VERIFY_SSL": "true"
      }
    },
    "crowdstrike-edr": {
      "command": "python",
      "args": ["/FULL/PATH/TO/SecurityInfrastructure/src/crowdstrike_server.py"],
      "env": {
        "CROWDSTRIKE_CLIENT_ID": "YOUR_CLIENT_ID",
        "CROWDSTRIKE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "CROWDSTRIKE_BASE_URL": "https://api.crowdstrike.com"
      }
    },
    "misp-threat-intel": {
      "command": "python",
      "args": ["/FULL/PATH/TO/SecurityInfrastructure/src/misp_server.py"],
      "env": {
        "MISP_URL": "YOUR_MISP_URL",
        "MISP_KEY": "YOUR_API_KEY",
        "MISP_VERIFY_CERT": "true"
      }
    }
  }
}
```

### 2. Environment Variables Template
Create `.env` file in your project directory:

```bash
# Splunk Configuration
SPLUNK_HOST=your-splunk-server.domain.com
SPLUNK_PORT=8089
SPLUNK_TOKEN=your_splunk_api_token_here
SPLUNK_VERIFY_SSL=true
SPLUNK_INDEX=main

# CrowdStrike Configuration
CROWDSTRIKE_CLIENT_ID=your_client_id_here
CROWDSTRIKE_CLIENT_SECRET=your_client_secret_here
CROWDSTRIKE_BASE_URL=https://api.crowdstrike.com

# MISP Configuration
MISP_URL=https://your-misp-instance.com
MISP_KEY=your_misp_api_key_here
MISP_VERIFY_CERT=true
```

## Setup Steps

### Step 1: Install Prerequisites
```bash
git clone https://github.com/jmstar85/SecurityInfrastructure.git
cd SecurityInfrastructure
pip install -r project-requirements.txt
```

### Step 2: Configure Credentials
1. Copy the environment template above into a `.env` file
2. Replace placeholder values with your actual credentials
3. Update the full paths in the Claude Desktop configuration

### Step 3: Test Connection
```bash
# Test each server individually
python src/splunk_server.py
python src/crowdstrike_server.py  
python src/misp_server.py
```

### Step 4: Configure Claude Desktop
1. Copy the JSON configuration above
2. Replace `/FULL/PATH/TO/SecurityInfrastructure` with your actual path
3. Replace placeholder credentials with real values
4. Restart Claude Desktop

## Credential Sources

### Splunk API Token
1. Login to Splunk Web
2. Settings → Tokens
3. Create new token with search permissions

### CrowdStrike API Credentials
1. Falcon Console → Support → API Clients & Keys
2. Create API client with scopes: Detections:READ, Hosts:READ, Incidents:READ
3. Note Client ID and Secret

### MISP API Key
1. Login to MISP
2. Global Actions → My Profile
3. Generate new authentication key

## Ready-to-Use Commands

After setup, try these commands in Claude Desktop:

**Splunk:**
- "Search for failed login events in the last hour"
- "Find all events with source IP 10.0.0.1"

**CrowdStrike:**
- "Show high severity detections from today"
- "List recent endpoint threats"

**MISP:**
- "Search for IP indicators of compromise"
- "Find threat events about malware"