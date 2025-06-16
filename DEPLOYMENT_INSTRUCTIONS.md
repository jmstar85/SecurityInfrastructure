# Deployment Instructions for Replit

## Current Issue
Your deployment failed because the project is configured as a "Static" deployment, but this is a full-stack Express application that requires server functionality.

## Required Changes in Replit Deployment Settings

You need to manually update these settings in your Replit deployment configuration:

### 1. Change Deployment Type
- **Current**: Static
- **Required**: Autoscale

### 2. Update Build Command
- **Current**: `npm run build`
- **Required**: `node quick-build.js`

### 3. Update Public Directory
- **Current**: `dist`
- **Required**: `dist/server/public`

### 4. Set Run Command
- **Current**: Not set
- **Required**: `node dist/start.js`

## How to Apply These Changes

1. Go to your Replit project
2. Click on the "Deploy" tab
3. Click "Configure deployment" or edit your existing deployment
4. Update the settings as shown above
5. Deploy the application

## What the Build Process Does

The `quick-build.js` script:
- Builds the Express server into `dist/index.js`
- Creates static HTML files in `dist/server/public/`
- Copies all necessary files to the correct locations
- Creates a production start script at `dist/start.js`

## Verification

After deployment, your application will:
- Serve the documentation website at the root URL
- Provide API endpoints at `/api/code-examples`, `/api/code-examples/search`, etc.
- Handle both static file serving and dynamic API requests

## Testing the Build Locally

To verify the build works correctly:
```bash
node quick-build.js
```

The output should show:
```
✅ Quick deployment build completed successfully!
```

This confirms all files are generated correctly for deployment.