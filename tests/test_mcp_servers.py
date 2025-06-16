#!/usr/bin/env python3
"""
Unit tests for MCP Security Servers
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
import sys
import os

# Add src directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from splunk_server import SplunkMCPServer, SplunkConfig
from crowdstrike_server import CrowdStrikeMCPServer, CrowdStrikeConfig
from misp_server import MicrosoftMISPServer, MISPConfig

class TestSplunkMCPServer:
    """Test cases for Splunk MCP Server"""
    
    @pytest.fixture
    def splunk_config(self):
        return SplunkConfig(
            host="test-splunk.local",
            port=8089,
            username="testuser",
            password="testpass"
        )
    
    @pytest.fixture
    def splunk_server(self, splunk_config):
        return SplunkMCPServer(splunk_config)
    
    @pytest.mark.asyncio
    async def test_authentication(self, splunk_server):
        """Test Splunk authentication process"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.text = '''<?xml version="1.0" encoding="UTF-8"?>
                <response>
                    <sessionKey>test-session-key</sessionKey>
                </response>'''
            
            mock_client.return_value.post = AsyncMock(return_value=mock_response)
            
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
    async def test_oauth_authentication(self, crowdstrike_server):
        """Test OAuth authentication flow"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "access_token": "test-access-token",
                "token_type": "bearer",
                "expires_in": 3600
            }
            
            mock_client.return_value.post = AsyncMock(return_value=mock_response)
            
            await crowdstrike_server._ensure_authenticated()
            assert crowdstrike_server.access_token == "test-access-token"

class TestMicrosoftMISPServer:
    """Test cases for Microsoft MISP Server"""
    
    @pytest.fixture
    def misp_config(self):
        return MISPConfig(
            url="https://test-misp.local",
            key="test-api-key"
        )
    
    @pytest.fixture
    def misp_server(self, misp_config):
        return MicrosoftMISPServer(misp_config)
    
    @pytest.mark.asyncio
    async def test_client_initialization(self, misp_server):
        """Test MISP client initialization"""
        await misp_server._ensure_client()
        assert misp_server.client is not None

if __name__ == "__main__":
    pytest.main([__file__, "-v"])