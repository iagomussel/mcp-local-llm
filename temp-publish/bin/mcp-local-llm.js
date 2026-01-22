#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const platform = os.platform();
const arch = os.arch();

const binaries = {
  'linux-x64': 'mcp-local-llm-linux-x64',
  'darwin-x64': 'mcp-local-llm-darwin-x64',
  'darwin-arm64': 'mcp-local-llm-darwin-arm64',
  'win32-x64': 'mcp-local-llm-win-x64.exe'
};

const binaryKey = `${platform}-${arch}`;
const binaryName = binaries[binaryKey];

if (!binaryName) {
  console.error(`Unsupported platform: ${platform}-${arch}`);
  console.error(`Supported platforms: ${Object.keys(binaries).join(', ')}`);
  process.exit(1);
}

const binDir = __dirname;
const binaryPath = path.join(binDir, binaryName);

if (!fs.existsSync(binaryPath)) {
  console.error(`Binary not found: ${binaryPath}`);
  console.error(`Available files in bin directory:`);
  try {
    const files = fs.readdirSync(binDir);
    files.forEach(file => console.error(`  - ${file}`));
  } catch (e) {
    console.error(`  (could not read directory)`);
  }
  process.exit(1);
}

// Make binary executable on Unix systems
if (platform !== 'win32') {
  try {
    fs.chmodSync(binaryPath, 0o755);
  } catch (e) {
    // Ignore chmod errors
  }
}

// Spawn the binary with all arguments
const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

child.on('error', (err) => {
  console.error(`Failed to start binary: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code !== null ? code : 0);
});

// Handle signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
