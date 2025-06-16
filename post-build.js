import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy dist/public to dist/server/public for production static serving
const sourceDir = path.join(__dirname, 'dist', 'public');
const targetDir = path.join(__dirname, 'dist', 'server', 'public');

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

if (fs.existsSync(sourceDir)) {
  console.log('Copying static files for production deployment...');
  copyRecursiveSync(sourceDir, targetDir);
  console.log('Static files copied successfully.');
} else {
  console.log('Source directory does not exist:', sourceDir);
}