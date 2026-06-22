// Install-state / provenance record (modeled on ECC schemas/install-state).
// Written after a successful apply so every install is auditable and
// reproducible: which repo version/commit, which manifest version, which
// modules were selected vs skipped, and exactly which files were written.
import { execSync } from 'node:child_process';
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
    operations: operations.map((o) => ({
      kind: o.kind,
      moduleId: o.moduleId,
      sourceRel: o.sourceRel ?? null,
      dest: o.dest ?? null,
      strategy: o.strategy,
      scope: o.scope,
      ...(o.reason !== undefined ? { reason: o.reason } : {}),
    })),
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

export function writeState(statePath, state) {
  // Validate the runtime provenance before touching the state file. Backup,
  // update, repair, and uninstall flows will rely on this record as trusted
  // input, so invalid state must fail closed.
  assertValidInstallState(state);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}
