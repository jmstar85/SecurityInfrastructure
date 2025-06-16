#!/usr/bin/env node
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve();
    });
  });
}

function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function buildForGitHubPages() {
  try {
    console.log('🚀 Building for GitHub Pages deployment...');
    
    // Step 1: Clean previous build
    console.log('🧹 Cleaning previous build...');
    if (fs.existsSync(path.join(__dirname, 'docs'))) {
      fs.rmSync(path.join(__dirname, 'docs'), { recursive: true, force: true });
    }
    
    // Step 2: Create docs directory (GitHub Pages source)
    fs.mkdirSync(path.join(__dirname, 'docs'), { recursive: true });
    
    // Step 3: Build the frontend for static hosting
    console.log('📦 Building frontend for static deployment...');
    try {
      // Try to build with Vite
      await Promise.race([
        runCommand('npx vite build --mode production --outDir docs'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Frontend build timeout')), 45000))
      ]);
      console.log('✅ Frontend build completed successfully');
    } catch (error) {
      console.warn('⚠️  Frontend build failed or timed out, creating static version...');
      
      // Create static version with embedded data
      const docsDir = path.join(__dirname, 'docs');
      fs.mkdirSync(docsDir, { recursive: true });
      
      // Read code examples from the storage
      const codeExamples = await getCodeExamplesForStatic();
      
      const staticHtml = createStaticHtml(codeExamples);
      fs.writeFileSync(path.join(docsDir, 'index.html'), staticHtml);
      
      // Create assets directory and basic CSS
      fs.mkdirSync(path.join(docsDir, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'assets', 'style.css'), getStaticCSS());
      fs.writeFileSync(path.join(docsDir, 'assets', 'script.js'), getStaticJS());
    }
    
    // Step 4: Create .nojekyll file for GitHub Pages
    fs.writeFileSync(path.join(__dirname, 'docs', '.nojekyll'), '');
    
    // Step 5: Create CNAME file if needed (for custom domain)
    // fs.writeFileSync(path.join(__dirname, 'docs', 'CNAME'), 'your-domain.com');
    
    console.log('🎉 GitHub Pages build completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Commit and push the docs/ directory to your GitHub repository');
    console.log('   2. Go to your GitHub repository settings');
    console.log('   3. Navigate to Pages section');
    console.log('   4. Set source to "Deploy from a branch"');
    console.log('   5. Select "main" branch and "/docs" folder');
    console.log('   6. Save the settings');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function getCodeExamplesForStatic() {
  // Import the storage to get code examples
  try {
    const { storage } = await import('./server/storage.js');
    return await storage.getAllCodeExamples();
  } catch (error) {
    console.warn('Could not load code examples from storage, using fallback data');
    return [
      {
        id: 1,
        title: "Splunk SIEM Integration",
        description: "MCP server for Splunk SIEM integration with search and alert capabilities",
        code: `# Splunk MCP Server
import splunklib.client as client
import splunklib.results as results

class SplunkMCPServer:
    def __init__(self, host, port, username, password):
        self.service = client.connect(
            host=host,
            port=port,
            username=username,
            password=password
        )
    
    def search_events(self, query, earliest_time="-24h"):
        """Search Splunk events"""
        search_query = f"search {query} earliest={earliest_time}"
        job = self.service.jobs.create(search_query)
        
        # Wait for job completion
        while not job.is_done():
            time.sleep(1)
        
        return list(results.ResultsReader(job.results()))`,
        language: "python",
        category: "SIEM",
        tags: ["splunk", "siem", "security", "mcp"]
      },
      {
        id: 2,
        title: "CrowdStrike EDR Integration",
        description: "MCP server for CrowdStrike Falcon EDR with endpoint management",
        code: `# CrowdStrike MCP Server
import requests
from falconpy import Hosts, Detects

class CrowdStrikeMCPServer:
    def __init__(self, client_id, client_secret):
        self.hosts = Hosts(client_id=client_id, client_secret=client_secret)
        self.detects = Detects(client_id=client_id, client_secret=client_secret)
    
    def get_hosts(self, limit=100):
        """Get host information"""
        response = self.hosts.query_devices_by_filter(limit=limit)
        if response['status_code'] == 200:
            host_ids = response['body']['resources']
            return self.hosts.get_device_details(ids=host_ids)
        return None
    
    def get_detections(self, limit=100):
        """Get recent detections"""
        response = self.detects.query_detects(limit=limit)
        if response['status_code'] == 200:
            detection_ids = response['body']['resources']
            return self.detects.get_detect_summaries(ids=detection_ids)
        return None`,
        language: "python",
        category: "EDR",
        tags: ["crowdstrike", "edr", "endpoint", "mcp"]
      },
      {
        id: 3,
        title: "Microsoft MISP Integration",
        description: "MCP server for Microsoft MISP threat intelligence platform",
        code: `# Microsoft MISP MCP Server
import requests
import json
from datetime import datetime

class MISPMCPServer:
    def __init__(self, misp_url, api_key):
        self.misp_url = misp_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Authorization': api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def search_events(self, tags=None, limit=100):
        """Search MISP events"""
        endpoint = f"{self.misp_url}/events/restSearch"
        payload = {
            'limit': limit,
            'tags': tags or [],
            'published': True
        }
        
        response = requests.post(endpoint, headers=self.headers, json=payload)
        if response.status_code == 200:
            return response.json()
        return None
    
    def get_attributes(self, event_id):
        """Get attributes for an event"""
        endpoint = f"{self.misp_url}/attributes/restSearch"
        payload = {'eventid': event_id}
        
        response = requests.post(endpoint, headers=self.headers, json=payload)
        if response.status_code == 200:
            return response.json()
        return None`,
        language: "python",
        category: "Threat Intelligence",
        tags: ["misp", "threat-intelligence", "microsoft", "mcp"]
      }
    ];
  }
}

function createStaticHtml(codeExamples) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Server Documentation - Security Integrations</title>
    <meta name="description" content="Documentation website showcasing MCP server source code for Splunk SIEM, CrowdStrike EDR, and Microsoft MISP integrations">
    <link rel="stylesheet" href="./assets/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>🔐 Security MCP Server Documentation</h1>
            <p>Model Context Protocol servers for security tool integrations</p>
        </div>
    </header>

    <nav class="nav">
        <div class="container">
            <div class="nav-links">
                <a href="#all" class="nav-link active" data-category="all">All Examples</a>
                <a href="#siem" class="nav-link" data-category="SIEM">SIEM</a>
                <a href="#edr" class="nav-link" data-category="EDR">EDR</a>
                <a href="#threat-intelligence" class="nav-link" data-category="Threat Intelligence">Threat Intelligence</a>
            </div>
            <div class="search-container">
                <input type="text" id="search" placeholder="Search code examples..." class="search-input">
            </div>
        </div>
    </nav>

    <main class="main">
        <div class="container">
            <div class="examples-grid" id="examples-grid">
                ${codeExamples.map(example => `
                    <div class="example-card" data-category="${example.category}" data-tags="${example.tags.join(' ')}">
                        <div class="example-header">
                            <h3>${example.title}</h3>
                            <span class="category-badge">${example.category}</span>
                        </div>
                        <p class="example-description">${example.description}</p>
                        <div class="example-tags">
                            ${example.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div class="code-container">
                            <div class="code-header">
                                <span class="language">${example.language}</span>
                                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                            </div>
                            <pre><code class="language-${example.language}">${escapeHtml(example.code)}</code></pre>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Security MCP Documentation. Built for GitHub Pages.</p>
            <p>Repository: <a href="https://github.com/jmstar85/SecurityMCP" target="_blank">github.com/jmstar85/SecurityMCP</a></p>
        </div>
    </footer>

    <script>
        // Embed code examples data
        window.codeExamples = ${JSON.stringify(codeExamples)};
    </script>
    <script src="./assets/script.js"></script>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getStaticCSS() {
  return `/* Security MCP Documentation Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f8fafc;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    text-align: center;
}

.header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.nav {
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
}

.nav-links {
    display: flex;
    gap: 1rem;
}

.nav-link {
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #666;
    border-radius: 4px;
    transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
    background: #667eea;
    color: white;
}

.search-container {
    position: relative;
}

.search-input {
    padding: 0.5rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    width: 300px;
    font-size: 0.9rem;
}

.search-input:focus {
    outline: none;
    border-color: #667eea;
}

.main {
    padding: 2rem 0;
}

.examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.example-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.example-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.example-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.example-header h3 {
    color: #1a202c;
    font-size: 1.2rem;
}

.category-badge {
    background: #667eea;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.example-description {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.5;
}

.example-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.tag {
    background: #e2e8f0;
    color: #4a5568;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

.code-container {
    background: #1a202c;
    border-radius: 6px;
    overflow: hidden;
}

.code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: #2d3748;
    color: white;
    font-size: 0.9rem;
}

.language {
    color: #a0aec0;
}

.copy-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background 0.2s;
}

.copy-btn:hover {
    background: #5a6fd8;
}

.code-container pre {
    margin: 0;
    padding: 1rem;
    overflow-x: auto;
    background: #1a202c;
}

.code-container code {
    color: #e2e8f0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.4;
}

/* Syntax highlighting */
.language-python .keyword { color: #fc8181; }
.language-python .string { color: #68d391; }
.language-python .comment { color: #a0aec0; }
.language-python .function { color: #63b3ed; }

.footer {
    background: #2d3748;
    color: white;
    padding: 2rem 0;
    text-align: center;
    margin-top: 3rem;
}

.footer a {
    color: #63b3ed;
    text-decoration: none;
}

.footer a:hover {
    text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
    .nav .container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-links {
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .search-input {
        width: 100%;
        max-width: 300px;
    }
    
    .examples-grid {
        grid-template-columns: 1fr;
    }
    
    .header h1 {
        font-size: 2rem;
    }
}

/* Hidden state for filtering */
.example-card.hidden {
    display: none;
}`;
}

function getStaticJS() {
  return `// Security MCP Documentation JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    const navLinks = document.querySelectorAll('.nav-link');
    const exampleCards = document.querySelectorAll('.example-card');
    
    let currentCategory = 'all';
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        filterExamples(query, currentCategory);
    });
    
    // Category navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Update current category
            currentCategory = this.dataset.category;
            
            // Filter examples
            const query = searchInput.value.toLowerCase();
            filterExamples(query, currentCategory);
        });
    });
    
    function filterExamples(query, category) {
        exampleCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('.example-description').textContent.toLowerCase();
            const tags = card.dataset.tags.toLowerCase();
            const cardCategory = card.dataset.category;
            
            const matchesSearch = !query || title.includes(query) || description.includes(query) || tags.includes(query);
            const matchesCategory = category === 'all' || cardCategory === category;
            
            if (matchesSearch && matchesCategory) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }
});

// Copy code functionality
function copyCode(button) {
    const codeBlock = button.closest('.code-container').querySelector('code');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(function() {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#48bb78';
        
        setTimeout(function() {
            button.textContent = originalText;
            button.style.background = '#667eea';
        }, 2000);
    }).catch(function(err) {
        console.error('Failed to copy: ', err);
        button.textContent = 'Copy failed';
        button.style.background = '#f56565';
        
        setTimeout(function() {
            button.textContent = 'Copy';
            button.style.background = '#667eea';
        }, 2000);
    });
}`;
}

buildForGitHubPages();