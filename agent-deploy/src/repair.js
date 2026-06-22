// Repair dry-run usecase.
// Unlike update — which rebuilds the next plan from the current asset bundle and
// diffs it — repair treats the recorded install-state as the source of truth and
// detects managed destinations that have gone missing on disk. This first slice
// is existence-based and non-writing: it reports present vs missing managed files
// without restoring anything. Content/hash drift and the actual restore writes
// are follow-ups.
import fs from 'node:fs';
import { getAdapter } from './targets/registry.js';
import { ASSET_ROOT } from './manifest.js';
import { readState } from './state.js';

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
  const exists = fs.existsSync(op.dest);
  return {
    status: exists ? 'present' : 'missing',
    moduleId: op.moduleId,
    kind: op.kind,
    sourceRel: op.sourceRel,
    dest: op.dest,
    reason: exists
      ? 'managed destination recorded in install-state is present'
      : 'managed destination recorded in install-state is missing and would be restored',
  };
}

function summarize(items) {
  const summary = {};
  for (const item of items) {
    summary[item.status] = (summary[item.status] || 0) + 1;
  }
  return summary;
}

// Shared analysis for dry-run reporting (and, later, repair writes): read the
// trusted install-state and classify each recorded managed operation by on-disk
// existence. Pure (no writes). Skip ops and operations without a destination are
// not managed files and are excluded.
export function analyzeRepair(request) {
  const statePath = locateStatePath(request);
  const currentState = readState(statePath);
  if (request.target && currentState.target.target !== request.target) {
    throw new Error(`install-state target mismatch: expected ${request.target}, got ${currentState.target.target}`);
  }

  const managed = currentState.operations.filter((op) => op.dest && op.kind !== 'skip');
  const items = managed.map(classifyManagedOperation);

  return { statePath, currentState, items };
}

export function buildRepairDryRun(request) {
  const { statePath, currentState, items } = analyzeRepair(request);

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
  };
}
