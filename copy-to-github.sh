#!/bin/bash

# Script to prepare files for GitHub Pages deployment
# Run this script to create a clean copy of files for your GitHub repository

echo "📁 Creating GitHub Pages deployment files..."

# Create a temporary directory for clean files
mkdir -p github-deployment
cd github-deployment

# Copy the docs directory
cp -r ../docs .

# Create README for the deployment
cat > README.md << 'EOF'
# Security MCP Server Documentation

This repository contains documentation and examples for Model Context Protocol (MCP) servers focused on security tool integrations.

## Live Documentation
Visit the live documentation at: https://jmstar85.github.io/SecurityMCP

## Included Integrations
- **Splunk SIEM**: Search and alert capabilities
- **CrowdStrike EDR**: Endpoint detection and response
- **Microsoft MISP**: Threat intelligence platform

## Local Development
The full-stack version with API endpoints is available on Replit. This GitHub Pages version provides static documentation optimized for fast loading and search engine optimization.

## Contributing
Feel free to submit pull requests with additional security MCP server examples or improvements to the documentation.
EOF

echo "✅ Files prepared in 'github-deployment' directory"
echo ""
echo "📋 Next steps:"
echo "1. Copy the contents of 'github-deployment' to your GitHub repository"
echo "2. Commit and push to GitHub"
echo "3. Configure GitHub Pages in repository settings"
echo "4. Set source to 'main' branch and '/docs' folder"
echo ""
echo "📁 Files to copy:"
find . -type f | sort