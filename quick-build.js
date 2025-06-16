#!/usr/bin/env node
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
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

async function build() {
  try {
    console.log('🚀 Starting quick deployment build...');
    
    // Step 1: Clean previous build
    console.log('🧹 Cleaning previous build...');
    if (fs.existsSync(path.join(__dirname, 'dist'))) {
      fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
    }
    
    // Step 2: Build the backend
    console.log('🔧 Building backend...');
    await runCommand('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');
    
    // Step 3: Create minimal frontend files directly
    console.log('📦 Creating static files...');
    const publicDir = path.join(__dirname, 'dist', 'public');
    fs.mkdirSync(publicDir, { recursive: true });
    
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MCP Server Documentation</title>
    <meta name="description" content="Documentation website showcasing MCP server source code for Splunk SIEM, CrowdStrike EDR, and Microsoft MISP integrations">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; }
      .container { max-width: 1200px; margin: 0 auto; }
      .header { border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
      .code-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
      pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="container">
        <div class="header">
          <h1>MCP Server Documentation</h1>
          <p>Documentation website showcasing MCP server source code for Splunk SIEM, CrowdStrike EDR, and Microsoft MISP integrations</p>
        </div>
        <div class="code-section">
          <h2>API Endpoints</h2>
          <ul>
            <li><strong>GET /api/code-examples</strong> - Get all code examples</li>
            <li><strong>GET /api/code-examples/category/:category</strong> - Get examples by category</li>
            <li><strong>GET /api/code-examples/search?q=query</strong> - Search code examples</li>
            <li><strong>GET /api/search-queries/popular</strong> - Get popular search queries</li>
          </ul>
        </div>
        <div class="code-section">
          <h2>Available Categories</h2>
          <ul>
            <li>Splunk SIEM Integration</li>
            <li>CrowdStrike EDR Integration</li>
            <li>Microsoft MISP Integration</li>
          </ul>
        </div>
      </div>
    </div>
  </body>
</html>`;
    
    fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);
    
    // Step 4: Copy static files to the server public directory
    const targetDir = path.join(__dirname, 'dist', 'server', 'public');
    console.log('📂 Copying static files for production deployment...');
    copyRecursiveSync(publicDir, targetDir);
    
    // Step 5: Create production start script
    const startScript = `#!/usr/bin/env node
import './index.js';
`;
    fs.writeFileSync(path.join(__dirname, 'dist', 'start.js'), startScript);
    
    console.log('✅ Quick deployment build completed successfully!');
    console.log('📝 Deployment configuration required:');
    console.log('   - Deployment Type: Autoscale');
    console.log('   - Build Command: node quick-build.js');
    console.log('   - Public Directory: dist/server/public');
    console.log('   - Run Command: node dist/start.js');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();