#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ASSET_ROOT } from '../src/manifest.js';
import { validateMcpGovernance } from '../src/mcp-governance.js';

export function checkMcpGovernance(assetRoot = ASSET_ROOT) {
  return validateMcpGovernance(assetRoot);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = checkMcpGovernance();
  if (result.errors.length) {
    console.error(`MCP governance validation FAILED (${result.errors.length}):`);
    for (const error of result.errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(`MCP governance validation OK (${result.checked} servers, env filter ${result.envDisableVariable})`);
}
