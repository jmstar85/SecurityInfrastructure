# Deployment Guide

This application is a full-stack Express.js application with a React frontend. Follow these steps to deploy it properly on Replit.

## Deployment Configuration

### 1. Build the Application
Run the deployment build script:
```bash
node build-for-deployment.js
```

This script will:
- Build the React frontend using Vite
- Bundle the Express server
- Copy static files to the correct location
- Create the necessary production files

### 2. Replit Deployment Settings

When deploying on Replit, use these settings:

**Deployment Type:** Autoscale (not Static)
- This is a full-stack application with both client and server code
- Static deployment will not work as it cannot run the Express server

**Public Directory:** `dist/server/public`
- This is where the built static files are located for production serving
- The server will serve these files and handle API routes

**Run Command:** `node dist/start.js`
- This starts the Express server in production mode
- The server runs on port 5000 and serves both API and static content

**Build Command:** `node build-for-deployment.js`
- This builds both frontend and backend for production
- Creates the correct directory structure for deployment

**Environment Variables:**
- `NODE_ENV=production` (should be set automatically)

## Project Structure

```
├── client/                 # React frontend source
├── server/                 # Express backend source
├── shared/                 # Shared types and schemas
├── dist/
│   ├── public/            # Built frontend files (from Vite)
│   ├── server/
│   │   └── public/        # Static files for production serving
│   ├── index.js           # Built Express server
│   └── start.js           # Production start script
├── build-for-deployment.js # Custom build script
└── post-build.js          # File copying utility
```

## Development vs Production

- **Development:** Uses Vite dev server with HMR
- **Production:** Serves static files through Express with fallback to index.html

## Troubleshooting

If deployment fails:

1. **"Could not find index.html"** - Ensure you're using Autoscale deployment, not Static
2. **"Build directory not found"** - Run the deployment build script first
3. **Server not starting** - Check that the run command is set to `node dist/start.js`

## Manual Build Steps (if needed)

If the automated script doesn't work, you can build manually:

```bash
# 1. Build frontend
vite build

# 2. Build backend
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 3. Copy static files
node post-build.js
```