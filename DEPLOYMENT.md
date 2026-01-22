# Deployment Guide

This guide explains how to build and deploy the MCP Local LLM server to npm as a binary distribution.

## Prerequisites

1. GitHub repository with Actions enabled
2. npm account (create at https://www.npmjs.com)
3. npm access token (for publishing)

## Setup

### 1. Configure GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

- `NPM_TOKEN`: Your npm access token (create at https://www.npmjs.com/settings/YOUR_USERNAME/tokens)

### 2. Local Build Testing

Before deploying, you can test building binaries locally:

```bash
# Install pkg globally
npm install -g pkg

# Build for your platform
npm run build

# Or build for specific platforms
npm run build:linux
npm run build:win
npm run build:macos
```

## Deployment Process

### Automatic Deployment via GitHub Actions

The workflow automatically builds and packages when you:

1. **Create a Git tag** (recommended):
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Or trigger manually** via GitHub Actions:
   - Go to Actions tab
   - Select "Build and Deploy to npm"
   - Click "Run workflow"
   - Enter version tag (e.g., `v1.0.0`)

### What the Workflow Does

1. **Builds binaries** for multiple platforms:
   - Linux (x64)
   - Windows (x64)
   - macOS (x64 and ARM64)

2. **Creates npm package** structure:
   - Includes all binaries
   - Platform detection script
   - npm configuration

3. **Publishes to npm** automatically:
   - Package is published to npm registry
   - Available via `npm install mcp-local-llm`

4. **Creates GitHub Release** with:
   - All binaries
   - Binary archive
   - Release notes

## Package Structure

The npm package includes:

```
npm-package/
├── bin/
│   ├── mcp-local-llm-linux-x64
│   ├── mcp-local-llm-win-x64.exe
│   ├── mcp-local-llm-darwin-x64
│   └── mcp-local-llm-darwin-arm64
├── install.js
├── package.json
└── README.md
```

## Usage After Installation

### Via npm (Global)

```bash
npm install -g mcp-local-llm
mcp-local-llm
```

### Via npm (Local)

```bash
npm install mcp-local-llm
npx mcp-local-llm
```

### Direct Binary Usage

```bash
node_modules/.bin/mcp-local-llm
```

## Troubleshooting

### Build Failures

- Ensure Node.js 18+ is available
- Check that all dependencies are installed
- Verify `pkg` can access the entry point (`src/index.js`)

### npm Publishing Issues

- Ensure `package.json` is valid
- Check that package name is available on npm
- Verify version tag format: `v1.0.0` or `1.0.0`
- Ensure `NPM_TOKEN` secret is set correctly
- Check npm account permissions

### Binary Execution Issues

- Ensure binaries have execute permissions (Linux/macOS)
- Check platform compatibility
- Verify Node.js dependencies are bundled correctly

## Version Management

- Use semantic versioning: `v1.0.0`, `v1.1.0`, `v2.0.0`
- Update version in `package.json` before tagging
- Tag format: `vMAJOR.MINOR.PATCH`

## Notes

- Binaries are built with `pkg` which bundles Node.js runtime
- Each binary is platform-specific and self-contained
- The PHP wrapper automatically selects the correct binary for the platform
- Binaries are compressed with GZip for smaller file sizes
