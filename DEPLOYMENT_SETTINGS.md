# Replit Deployment Settings

## Required Configuration

Copy these exact settings when configuring your Replit deployment:

**Deployment Target**: `autoscale`
**Build Command**: `node build-for-deployment.js`
**Public Directory**: `dist/server/public`
**Run Command**: `node dist/start.js`

## Manual Configuration Steps

Since the .replit file cannot be modified automatically, you need to manually update these settings in your Replit deployment configuration:

1. Go to your Replit project settings
2. Navigate to the Deployment tab
3. Change the deployment type from "Static" to "Autoscale"
4. Set the build command to: `node build-for-deployment.js`
5. Set the public directory to: `dist/server/public`
6. Set the run command to: `node dist/start.js`

## Why These Settings Are Required

- **Autoscale instead of Static**: This is a full-stack Express application that needs to run a server, not just serve static files
- **Custom build command**: The `build-for-deployment.js` script properly builds both frontend and backend with correct file structure
- **Specific public directory**: `dist/server/public` is where the production static files are located for proper serving
- **Node start command**: `node dist/start.js` starts the Express server in production mode

## Verification

After deployment, your application will:
- Serve the API endpoints at `/api/*`
- Serve the static frontend files
- Handle client-side routing with fallback to index.html
- Run on the correct port (5000) with proper host binding

## Troubleshooting

If deployment still fails:
1. Ensure you've changed from "Static" to "Autoscale" deployment type
2. Verify the build command runs successfully: `node build-for-deployment.js`
3. Check that the `dist/server/public` directory exists after building
4. Confirm the run command is exactly: `node dist/start.js`