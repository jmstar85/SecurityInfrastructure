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

async function build() {
  try {
    console.log('🚀 Starting deployment build...');
    
    // Step 1: Build the frontend
    console.log('📦 Building frontend...');
    await runCommand('vite build');
    
    // Step 2: Build the backend
    console.log('🔧 Building backend...');
    await runCommand('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');
    
    // Step 3: Copy static files to the correct location for deployment
    const sourceDir = path.join(__dirname, 'dist', 'public');
    const targetDir = path.join(__dirname, 'dist', 'server', 'public');
    
    if (fs.existsSync(sourceDir)) {
      console.log('📂 Copying static files for production deployment...');
      copyRecursiveSync(sourceDir, targetDir);
      console.log('✅ Static files copied successfully.');
    } else {
      console.warn('⚠️  Source directory does not exist:', sourceDir);
    }
    
    // Step 4: Create a production start script
    const startScript = `#!/usr/bin/env node
import './index.js';
`;
    fs.writeFileSync(path.join(__dirname, 'dist', 'start.js'), startScript);
    
    console.log('🎉 Deployment build completed successfully!');
    console.log('📝 To deploy:');
    console.log('   1. Set deployment type to "Autoscale"');
    console.log('   2. Set public directory to "dist/server/public"');
    console.log('   3. Set run command to "node dist/start.js"');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();