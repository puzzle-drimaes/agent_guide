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
    operations: operations.map((o) => ({
      kind: o.kind,
      moduleId: o.moduleId,
      sourceRel: o.sourceRel,
      dest: o.dest,
      strategy: o.strategy,
      scope: o.scope,
      ...(o.reason !== undefined ? { reason: o.reason } : {}),
    })),
  };
}

export function writeState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}
