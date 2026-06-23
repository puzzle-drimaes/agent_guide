import fs from 'node:fs';
import path from 'node:path';

export const MCP_SERVERS_REL = 'mcp/servers.json';
export const MCP_ALLOWLIST_REL = 'mcp/allowlist.json';

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function defaultPolicy() {
  return {
    allowedServers: [],
    defaultExcludedServers: ['filesystem'],
    envDisableVariable: 'DISABLED_MCPS',
    requireEnvPlaceholders: true,
    requireNpxVersionPin: true,
  };
}

function loadPolicy(assetRoot, allowlistRel = MCP_ALLOWLIST_REL) {
  const policyPath = path.join(assetRoot, allowlistRel);
  return { ...defaultPolicy(), ...(readJsonIfExists(policyPath) || {}) };
}

function loadServers(assetRoot, sourceRel = MCP_SERVERS_REL) {
  const sourcePath = path.join(assetRoot, sourceRel);
  const doc = readJsonIfExists(sourcePath) || { mcpServers: {} };
  return { sourcePath, servers: doc.mcpServers || {} };
}

function parseDisabledServers(env, variableName) {
  return new Set(String(env?.[variableName] || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean));
}

function isPlaceholder(value) {
  return /^\$\{[A-Z][A-Z0-9_]*\}$/.test(String(value || ''));
}

function firstNpxPackage(args = []) {
  return args.find((arg) => typeof arg === 'string' && arg && !arg.startsWith('-')) || null;
}

function isPinnedPackageSpec(spec) {
  if (!spec) return false;
  if (spec.startsWith('@')) return /^@[^/]+\/[^@]+@[^@]+$/.test(spec);
  return /^[^@]+@[^@]+$/.test(spec);
}

function validateServer(name, server, policy) {
  const errors = [];
  const allowed = new Set(policy.allowedServers || []);
  const defaultExcluded = new Set(policy.defaultExcludedServers || []);

  if (!allowed.has(name)) errors.push(`MCP server '${name}' is not in allowlist`);
  if (defaultExcluded.has(name)) errors.push(`MCP server '${name}' is default-excluded and must not ship in servers.json`);

  if (policy.requireEnvPlaceholders && server.env) {
    for (const [key, value] of Object.entries(server.env)) {
      if (!isPlaceholder(value)) {
        errors.push(`MCP server '${name}' env '${key}' must use a \${ENV_NAME} placeholder`);
      }
    }
  }

  if (policy.requireNpxVersionPin && server.command === 'npx') {
    const pkg = firstNpxPackage(server.args || []);
    if (!isPinnedPackageSpec(pkg)) {
      errors.push(`MCP server '${name}' uses npx without a pinned package version`);
    }
  }

  return errors;
}

export function validateMcpGovernance(assetRoot, options = {}) {
  const policy = loadPolicy(assetRoot, options.allowlistRel);
  const { servers } = loadServers(assetRoot, options.sourceRel);
  const errors = [];

  if (!Array.isArray(policy.allowedServers)) errors.push('MCP allowlist allowedServers must be an array');
  if (!Array.isArray(policy.defaultExcludedServers)) errors.push('MCP allowlist defaultExcludedServers must be an array');
  if (!policy.envDisableVariable || typeof policy.envDisableVariable !== 'string') {
    errors.push('MCP allowlist envDisableVariable must be a string');
  }

  if (!errors.length) {
    for (const [name, server] of Object.entries(servers)) {
      errors.push(...validateServer(name, server || {}, policy));
    }
  }

  return {
    errors,
    checked: Object.keys(servers).length,
    allowedServers: policy.allowedServers || [],
    defaultExcludedServers: policy.defaultExcludedServers || [],
    envDisableVariable: policy.envDisableVariable || 'DISABLED_MCPS',
  };
}

export function buildGovernedMcpConfig({
  assetRoot,
  sourceRel = MCP_SERVERS_REL,
  allowlistRel = MCP_ALLOWLIST_REL,
  env = process.env,
} = {}) {
  const validation = validateMcpGovernance(assetRoot, { sourceRel, allowlistRel });
  if (validation.errors.length) {
    throw new Error(`MCP governance validation failed: ${validation.errors.join('; ')}`);
  }

  const policy = loadPolicy(assetRoot, allowlistRel);
  const { sourcePath, servers } = loadServers(assetRoot, sourceRel);
  const disabled = parseDisabledServers(env, policy.envDisableVariable);
  const selected = {};
  const skipped = [];

  for (const [name, server] of Object.entries(servers)) {
    if (disabled.has(name)) {
      skipped.push({
        name,
        sourceRel,
        reason: `MCP server '${name}' disabled by ${policy.envDisableVariable}`,
      });
    } else {
      selected[name] = server;
    }
  }

  return {
    sourcePath,
    sourceRel,
    mergePayload: { mcpServers: selected },
    skipped,
    envDisableVariable: policy.envDisableVariable,
  };
}

export function codexMcpPayload(source) {
  const servers = {};
  for (const [name, server] of Object.entries(source.mcpServers || {})) {
    const next = { enabled: true };
    if (server.url) next.url = server.url;
    if (server.command) next.command = server.command;
    if (server.args) next.args = server.args;
    if (server.env) next.env = server.env;
    servers[name] = next;
  }
  return { mcp_servers: servers };
}
