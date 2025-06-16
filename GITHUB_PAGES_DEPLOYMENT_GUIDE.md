# GitHub Pages Deployment Guide

## Overview
This guide will help you deploy your Security MCP documentation to GitHub Pages at https://github.com/jmstar85/SecurityMCP.

## Quick Deployment Steps

### 1. Copy Files to Your Repository
Copy these files and folders from your Replit project to your GitHub repository:

```
docs/
├── index.html
├── assets/
│   ├── style.css
│   └── script.js
└── .nojekyll
```

### 2. Upload to GitHub
1. Go to https://github.com/jmstar85/SecurityMCP
2. Click "Upload files" or use git commands:
   ```bash
   git add docs/
   git commit -m "Add GitHub Pages documentation"
   git push origin main
   ```

### 3. Configure GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch
6. Select "/docs" folder
7. Click "Save"

### 4. Access Your Site
After 5-10 minutes, your site will be available at:
`https://jmstar85.github.io/SecurityMCP`

## What's Included

Your GitHub Pages site includes:
- **Interactive Documentation**: Browse security MCP server examples
- **Search Functionality**: Find specific integrations by keyword
- **Category Filtering**: Filter by SIEM, EDR, or Threat Intelligence
- **Code Examples**: Ready-to-use Python code for:
  - Splunk SIEM integration
  - CrowdStrike EDR integration  
  - Microsoft MISP integration
- **Copy-to-Clipboard**: Easy code copying functionality
- **Responsive Design**: Works on desktop and mobile

## File Structure Explanation

- `docs/index.html`: Main documentation page
- `docs/assets/style.css`: Professional styling with security theme
- `docs/assets/script.js`: Interactive functionality (search, filtering, copy)
- `docs/.nojekyll`: Tells GitHub Pages to serve files as-is

## Customization Options

### Adding More Examples
Edit `docs/index.html` and add new example cards following the existing pattern:

```html
<div class="example-card" data-category="YOUR_CATEGORY" data-tags="tag1 tag2 tag3">
    <div class="example-header">
        <h3>Your Integration Title</h3>
        <span class="category-badge">YOUR_CATEGORY</span>
    </div>
    <p class="example-description">Description of your integration</p>
    <div class="example-tags">
        <span class="tag">tag1</span>
        <span class="tag">tag2</span>
    </div>
    <div class="code-container">
        <div class="code-header">
            <span class="language">python</span>
            <button class="copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <pre><code class="language-python">Your code here</code></pre>
    </div>
</div>
```

### Custom Domain (Optional)
To use a custom domain:
1. Add a `CNAME` file to the `docs/` folder with your domain name
2. Configure DNS settings with your domain provider

## Troubleshooting

### Site Not Loading
- Check that files are in the `docs/` folder
- Ensure GitHub Pages is configured for `/docs` folder
- Wait 5-10 minutes for deployment

### Styling Issues
- Verify `docs/assets/style.css` exists
- Check browser console for any errors

### JavaScript Not Working
- Verify `docs/assets/script.js` exists
- Check browser console for JavaScript errors

## Maintenance

To update your documentation:
1. Edit files in the `docs/` folder
2. Commit and push changes to GitHub
3. Site will automatically update within minutes

## Differences from Replit Version

The GitHub Pages version is static-only and includes:
- Pre-built HTML with embedded examples
- Client-side search and filtering
- No backend API (data is embedded in HTML)
- Optimized for fast loading and SEO

This provides the same user experience as your Replit version but optimized for GitHub Pages hosting.