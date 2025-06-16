# Replit Deployment Configuration Guide

## Quick Setup Instructions

Your deployment failed because it's configured for static hosting, but this is a full-stack Express application. Follow these steps to fix it:

### 1. Manual Configuration Required

Go to your Replit project's Deployment settings and update these fields:

**Deployment Type:** `Autoscale` (change from Static)

**Build Command:** `node build-for-deployment.js`

**Public Directory:** `dist/server/public`

**Run Command:** `node dist/start.js`

### 2. Why These Settings Are Required

- **Autoscale**: This app needs to run an Express server, not just serve static files
- **Custom Build**: The build script creates the correct file structure for production
- **Specific Public Directory**: Static files are served from `dist/server/public`
- **Node Start**: Starts the Express server in production mode

### 3. How to Apply These Settings

1. Open your Replit project
2. Click on the "Deploy" button/tab
3. If you have an existing deployment, click "Configure" or "Settings"
4. If creating new deployment, choose "Autoscale" type
5. Update the four settings listed above
6. Click "Deploy"

### 4. Verification

After successful deployment, your app will:
- Serve the documentation website at the root URL
- Provide API endpoints at `/api/code-examples`, `/api/code-examples/search`, etc.
- Handle both static files and dynamic API requests

### 5. Troubleshooting

If deployment still fails:
- Ensure all four settings are exactly as specified above
- Try deleting the existing deployment and creating a new one
- Check that the build command runs successfully in the Shell tab first

## Build Process Details

The `build-for-deployment.js` script:
1. Builds the Express server into `dist/index.js`
2. Creates static files in `dist/server/public/`
3. Creates a production start script at `dist/start.js`
4. Ensures proper file structure for Replit's autoscale deployment