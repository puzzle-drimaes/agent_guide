// Uninstall dry-run usecase.
// Reverse-replays the recorded install-state operations and reports what an
// uninstall would do, without writing. Safety boundary: only managed artifacts
// are touched. Fully managed files (copy-file) are deletion candidates; shared
// files we merged/appended into (append-markdown/merge-json/merge-toml) are
// reverted in place — the managed block/keys would be removed, but the file
// (which may hold user-authored content) is kept, never deleted. The
// install-state provenance file is reported as a separate teardown target.
// Actual deletion/reversion writes are a follow-up.
import fs from 'node:fs';
import { getAdapter } from './targets/registry.js';
import { ASSET_ROOT } from './manifest.js';
import { readState } from './state.js';

// Shared destinations we only contribute to, rather than own outright. Uninstall
// reverts our managed portion in place instead of deleting the whole file.
const REVERT_KINDS = new Set(['append-markdown', 'merge-json', 'merge-toml']);

function inputForRequest(request) {
  return {
    assetRoot: ASSET_ROOT,
    scope: request.scope || 'project',
    projectRoot: request.projectRoot,
    homeDir: request.homeDir,
  };
}

function locateStatePath(request) {
  const adapter = getAdapter(request.target);
  return adapter.statePath(inputForRequest(request));
}

function classifyManagedOperation(op) {
  const base = {
    moduleId: op.moduleId,
    kind: op.kind,
    sourceRel: op.sourceRel,
    dest: op.dest,
  };

  if (!fs.existsSync(op.dest)) {
    return {
      ...base,
      status: 'already-absent',
      reason: 'managed destination recorded in install-state is already absent',
    };
  }

  if (REVERT_KINDS.has(op.kind)) {
    return {
      ...base,
      status: 'would-revert',
      reason: 'shared file: managed block/keys would be removed in place, file preserved (may contain user content)',
    };
  }

  return {
    ...base,
    status: 'would-delete',
    reason: 'fully managed file would be deleted',
  };
}

function summarize(items) {
  const summary = {};
  for (const item of items) {
    summary[item.status] = (summary[item.status] || 0) + 1;
  }
  return summary;
}

// Shared analysis for dry-run reporting (and, later, uninstall writes): read the
// trusted install-state and reverse-replay the recorded managed operations into
// classified teardown items. Pure (no writes). Skip ops and operations without a
// destination are not managed files and are excluded.
export function analyzeUninstall(request) {
  const statePath = locateStatePath(request);
  const currentState = readState(statePath);
  if (request.target && currentState.target.target !== request.target) {
    throw new Error(`install-state target mismatch: expected ${request.target}, got ${currentState.target.target}`);
  }

  const managed = currentState.operations.filter((op) => op.dest && op.kind !== 'skip');
  // Reverse of recorded order: last written, first removed.
  const items = [...managed].reverse().map(classifyManagedOperation);

  const stateExists = fs.existsSync(statePath);
  const stateFile = {
    dest: statePath,
    status: stateExists ? 'would-delete' : 'already-absent',
    reason: stateExists
      ? 'install-state provenance file would be deleted'
      : 'install-state provenance file is already absent',
  };

  return { statePath, currentState, items, stateFile };
}

export function buildUninstallDryRun(request) {
  const { statePath, currentState, items, stateFile } = analyzeUninstall(request);

  return {
    dryRun: true,
    statePath,
    target: currentState.target,
    request: {
      profile: currentState.request.profile ?? null,
      modules: currentState.request.modules || [],
    },
    summary: summarize(items),
    items,
    stateFile,
  };
}
