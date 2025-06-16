# MCP Server Documentation Website

A documentation website showcasing MCP (Model Context Protocol) server source code for Splunk SIEM, CrowdStrike EDR, and Microsoft MISP integrations.

## Features

- Browse code examples by category (SIEM, EDR, MISP)
- Search functionality with query tracking
- Syntax-highlighted code blocks
- Responsive design with dark/light theme support
- Popular search queries tracking

## Development

### Prerequisites

- Node.js 18+ 
- npm

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities and configurations
├── server/                 # Express backend
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data storage interface
├── shared/                 # Shared types and schemas
└── dist/                  # Build output (created during build)
```

## Deployment

This application is designed to run as a full-stack Express application. For deployment:

### Quick Deployment

1. Run the deployment build:
```bash
node quick-build.js
```

2. Configure your deployment platform:
   - **Deployment Type**: Autoscale (not Static)
   - **Build Command**: `node quick-build.js`
   - **Public Directory**: `dist/server/public`
   - **Run Command**: `node dist/start.js`

> **Important**: This is a full-stack Express application. Static deployment will not work as it cannot run the server code that handles API endpoints.

### Manual Build Process

If you prefer to build manually:

```bash
# Build frontend
vite build

# Build backend
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Copy static files to correct location
node post-build.js
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## API Endpoints

- `GET /api/code-examples` - Get all code examples
- `GET /api/code-examples/category/:category` - Get examples by category
- `GET /api/code-examples/search?q=query` - Search code examples
- `GET /api/search-queries/popular` - Get popular search queries

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Data**: In-memory storage with TypeScript interfaces
- **Build**: Vite + esbuild
- **Styling**: Tailwind CSS with custom theming