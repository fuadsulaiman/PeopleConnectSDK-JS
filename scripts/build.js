#!/usr/bin/env node
/**
 * Build script for PeopleConnect SDK
 * Creates CommonJS (.js) and ES Module (.mjs) versions
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const indexFile = path.join(srcDir, 'index.js');

// Read the source file
let content = fs.readFileSync(indexFile, 'utf8');

// Create ESM version (index.mjs)
const esmContent = content;
fs.writeFileSync(path.join(srcDir, 'index.mjs'), esmContent);
console.log('Created index.mjs (ES Module)');

// Create CommonJS version - remove ES module exports
let cjsContent = content
  .replace(/^export \{ PeopleConnectSDK \};$/m, '')
  .replace(/^export default PeopleConnectSDK;$/m, '');

fs.writeFileSync(path.join(srcDir, 'index.cjs.js'), cjsContent);
console.log('Created index.cjs.js (CommonJS fallback)');

console.log('Build complete!');
