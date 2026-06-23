// Install-state / provenance record (modeled on ECC schemas/install-state).
// Written after a successful apply so every install is auditable and
// reproducible: which repo version/commit, which manifest version, which
// modules were selected vs skipped, and exactly which files were written.
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, '..', 'package.json');
const INSTALL_STATE_SCHEMA = path.resolve(HERE, '..', 'schemas', 'install-state.schema.json');

function loadInstallStateSchema() {
  return JSON.parse(fs.readFileSync(INSTALL_STATE_SCHEMA, 'utf8'));
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function describeType(type) {
  return Array.isArray(type) ? type.join(' or ') : type;
}

function valueMatchesType(value, type) {
  if (Array.isArray(type)) return type.some((entry) => valueMatchesType(value, entry));
  if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'null') return value === null;
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'boolean') return typeof value === 'boolean';
  return true;
}

function validateJsonSchemaSubset(schema, value, label = '$') {
  const errors = [];

  if (value === undefined) {
    return [`${label} must not be undefined; use null or omit the property`];
  }

  if (hasOwn(schema, 'const') && value !== schema.const) {
    errors.push(`${label} must be ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${label} must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(', ')}`);
  }

  if (schema.type && !valueMatchesType(value, schema.type)) {
    errors.push(`${label} must be ${describeType(schema.type)}`);
    return errors;
  }

  if (schema.type === 'string' || typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(`${label} must be at least ${schema.minLength} character(s)`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${label} must match pattern ${schema.pattern}`);
    }
  }

  if ((schema.type === 'integer' || schema.type === 'number') && typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${label} must be >= ${schema.minimum}`);
    }
  }

  if ((schema.type === 'object' || schema.properties || schema.required) && valueMatchesType(value, 'object')) {
    for (const key of schema.required || []) {
      if (!hasOwn(value, key) || value[key] === undefined) {
        errors.push(`${label}.${key} is required`);
      }
    }

    const properties = schema.properties || {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!hasOwn(properties, key)) errors.push(`${label}.${key} is not allowed`);
      }
    }

    for (const [key, childValue] of Object.entries(value)) {
      if (hasOwn(properties, key)) {
        errors.push(...validateJsonSchemaSubset(properties[key], childValue, `${label}.${key}`));
      } else if (childValue === undefined) {
        errors.push(`${label}.${key} must not be undefined; use null or omit the property`);
      }
    }
  }

  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      errors.push(...validateJsonSchemaSubset(schema.items, item, `${label}[${index}]`));
    });
  }

  return errors;
}

function repoCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}

function repoVersion() {
  try {
    return JSON.parse(fs.readFileSync(PKG, 'utf8')).version || null;
  } catch {
    return null;
  }
}

function sha256Text(value) {
  return `sha256:${crypto.createHash('sha256').update(String(value), 'utf8').digest('hex')}`;
}

function sha256Json(value) {
  return sha256Text(JSON.stringify(value));
}

function sourceHash(sourcePath) {
  if (!sourcePath || !fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) return null;
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex')}`;
}

function managedContentHash(operation) {
  if (operation.kind === 'copy-file') return sourceHash(operation.sourcePath);
  if (operation.kind === 'append-markdown' && operation.markerId && operation.content !== undefined) {
    const start = `<!-- agent-deploy:${operation.markerId}:start -->`;
    const end = `<!-- agent-deploy:${operation.markerId}:end -->`;
    return sha256Text(`${start}\n${String(operation.content).trim()}\n${end}`);
  }
  if ((operation.kind === 'merge-json' || operation.kind === 'merge-toml') && operation.mergePayload !== undefined) {
    return sha256Json(operation.mergePayload);
  }
  return null;
}

function stateOperation(operation) {
  const hash = managedContentHash(operation);
  return {
    kind: operation.kind,
    moduleId: operation.moduleId,
    sourceRel: operation.sourceRel ?? null,
    dest: operation.dest ?? null,
    strategy: operation.strategy,
    scope: operation.scope,
    ...(operation.reason !== undefined ? { reason: operation.reason } : {}),
    ...(operation.markerId !== undefined ? { markerId: operation.markerId } : {}),
    ...(operation.content !== undefined ? { content: operation.content } : {}),
    ...(operation.mergePayload !== undefined ? { mergePayload: operation.mergePayload } : {}),
    ...(hash ? { contentHash: hash } : {}),
  };
}

export function buildState({
  adapter,
  input,
  request,
  resolution,
  manifestVersion,
  packs = [],
  conflictResolutions = [],
  backup = { enabled: false, root: null, entries: [] },
  conflictPolicy = { policy: 'managed-overwrite', decisions: [] },
  operations,
  installedAt,
}) {
  return {
    schemaVersion: 'agentdeploy.install.v1',
    installedAt,
    target: {
      id: adapter.id,
      target: adapter.target,
      scope: adapter.scopeOf(input),
      root: adapter.resolveRoot(input),
      statePath: adapter.statePath(input),
    },
    request: {
      profile: request.profile ?? null,
      modules: request.moduleIds ?? [],
      seedIds: resolution.seedIds,
    },
    resolution: {
      selectedModules: resolution.selected.map((m) => m.id),
      skippedModules: resolution.skipped,
    },
    source: {
      repoVersion: repoVersion(),
      repoCommit: repoCommit(),
      manifestVersion,
      packs,
      conflictResolutions,
    },
    backup: {
      enabled: Boolean(backup.enabled),
      root: backup.root ?? null,
      entries: (backup.entries || []).map((entry) => ({
        source: entry.source,
        backupPath: entry.backupPath,
        reason: entry.reason,
      })),
    },
    conflictPolicy: {
      policy: conflictPolicy.policy || 'managed-overwrite',
      decisions: (conflictPolicy.decisions || []).map((decision) => ({
        moduleId: decision.moduleId,
        kind: decision.kind,
        dest: decision.dest,
        decision: decision.decision,
        reason: decision.reason,
      })),
    },
    operations: operations.map(stateOperation),
  };
}

export function validateInstallState(state, schema = loadInstallStateSchema()) {
  return validateJsonSchemaSubset(schema, state, '$');
}

export function assertValidInstallState(state) {
  const errors = validateInstallState(state);
  if (errors.length) {
    throw new Error(`install-state validation failed: ${errors.join('; ')}`);
  }
}

export function readState(statePath) {
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`install-state not found: ${statePath}`);
    }
    throw new Error(`install-state is invalid JSON at ${statePath}: ${error.message}`);
  }
  assertValidInstallState(state);
  return state;
}

export function writeState(statePath, state) {
  // Validate the runtime provenance before touching the state file. Backup,
  // update, repair, and uninstall flows will rely on this record as trusted
  // input, so invalid state must fail closed.
  assertValidInstallState(state);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}
