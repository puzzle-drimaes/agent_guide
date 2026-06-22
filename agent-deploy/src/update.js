// Update usecase.
// Reads trusted install-state, builds the next plan, and either reports what
// would happen (--dry-run) or applies the managed-file refresh. Drift against
// the previous install-state is surfaced as `possible-user-modified`; applying
// over those files is fail-closed unless an explicit --on-user-modified policy
// is given. All real writes/backup/state-rewrite delegate to applyPlan.
import fs from 'node:fs';
import { buildPlan } from './planner.js';
import { applyPlan } from './apply.js';
import { getAdapter } from './targets/registry.js';
import { ASSET_ROOT } from './manifest.js';
import { readState } from './state.js';
import { deepMergeJson } from './json-merge.js';
import { mergeTomlAddOnly } from './toml-merge.js';

export const USER_MODIFIED_POLICIES = ['fail', 'skip', 'overwrite'];

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

function opKey(op) {
  return [
    op.kind,
    op.moduleId || '',
    op.sourceRel || '',
    op.dest || '',
  ].join('|');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasManagedMarkdownBlock(current, markerId) {
  if (!markerId) return false;
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  return new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`).test(current);
}

function upsertManagedMarkdownBlock(current, markerId, content) {
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  const block = `${start}\n${content.trim()}\n${end}`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);

  if (pattern.test(current)) {
    return `${current.replace(pattern, block).replace(/\s+$/u, '')}\n`;
  }
  const prefix = current.trimEnd();
  return `${prefix ? `${prefix}\n\n` : ''}${block}\n`;
}

function desiredTextForOperation(op, currentText) {
  if (op.kind === 'copy-file') return fs.readFileSync(op.sourcePath, 'utf8');
  if (op.kind === 'append-markdown') {
    return upsertManagedMarkdownBlock(currentText, op.markerId, op.content);
  }
  if (op.kind === 'merge-json') {
    const current = currentText.trim() ? JSON.parse(currentText) : {};
    return `${JSON.stringify(deepMergeJson(current, op.mergePayload), null, 2)}\n`;
  }
  if (op.kind === 'merge-toml') return mergeTomlAddOnly(currentText, op.mergePayload);
  return currentText;
}

function classifyOperation(op, previousByKey) {
  if (op.kind === 'skip') {
    return {
      status: 'skip-record',
      moduleId: op.moduleId,
      kind: op.kind,
      dest: op.dest,
      reason: op.reason || 'planned skip operation',
    };
  }

  const previous = previousByKey.get(opKey(op));
  const exists = fs.existsSync(op.dest);
  const base = {
    moduleId: op.moduleId,
    kind: op.kind,
    sourceRel: op.sourceRel,
    dest: op.dest,
  };

  if (!exists) {
    return {
      ...base,
      status: previous ? 'missing-would-create' : 'new-would-apply',
      reason: previous
        ? 'previously managed destination is missing'
        : 'destination is newly planned and does not exist yet',
    };
  }

  if (!previous) {
    return {
      ...base,
      status: 'new-would-apply',
      reason: 'destination exists but was not recorded in the previous install-state',
    };
  }

  let currentText;
  let desiredText;
  try {
    currentText = fs.readFileSync(op.dest, 'utf8');
    desiredText = desiredTextForOperation(op, currentText);
  } catch (error) {
    return {
      ...base,
      status: 'possible-user-modified',
      reason: `unable to compute desired content safely: ${error.message}`,
    };
  }

  if (currentText === desiredText) {
    return { ...base, status: 'unchanged', reason: 'current destination already matches desired output' };
  }

  if (op.kind === 'append-markdown' && hasManagedMarkdownBlock(currentText, op.markerId)) {
    return { ...base, status: 'would-update', reason: 'managed markdown block would be refreshed' };
  }
  if (op.kind === 'merge-json' || op.kind === 'merge-toml') {
    return { ...base, status: 'would-update', reason: `${op.kind} would add missing managed keys` };
  }

  return {
    ...base,
    status: 'possible-user-modified',
    reason: 'managed destination differs from the expected canonical output',
  };
}

function summarize(items) {
  const summary = {};
  for (const item of items) {
    summary[item.status] = (summary[item.status] || 0) + 1;
  }
  return summary;
}

function deriveRequestFromState(request, state) {
  const moduleIds = request.moduleIds?.length ? request.moduleIds : state.request.modules;
  const packPaths = request.packPaths?.length
    ? request.packPaths
    : (state.source.packs || []).map((pack) => pack.root).filter(Boolean);
  const conflictResolutions = request.conflictResolutions?.length
    ? request.conflictResolutions
    : state.source.conflictResolutions;

  return {
    ...request,
    profile: request.profile || state.request.profile,
    moduleIds,
    packPaths,
    conflictResolutions,
  };
}

// Shared analysis for dry-run reporting and apply gating: read the trusted
// install-state, derive the next request, build the next plan, and classify
// every next/previous operation. Pure (no writes) so apply can reuse it.
export function analyzeUpdate(request) {
  const statePath = locateStatePath(request);
  const currentState = readState(statePath);
  if (request.target && currentState.target.target !== request.target) {
    throw new Error(`install-state target mismatch: expected ${request.target}, got ${currentState.target.target}`);
  }

  const nextRequest = deriveRequestFromState(request, currentState);
  const nextPlan = buildPlan(nextRequest);
  const previousManaged = currentState.operations.filter((op) => op.dest && op.kind !== 'skip');
  const previousByKey = new Map(previousManaged.map((op) => [opKey(op), op]));
  const nextKeys = new Set(nextPlan.operations.map(opKey));
  const items = nextPlan.operations.map((op) => classifyOperation(op, previousByKey));

  for (const op of previousManaged) {
    if (!nextKeys.has(opKey(op))) {
      items.push({
        status: 'removed-from-plan',
        moduleId: op.moduleId,
        kind: op.kind,
        sourceRel: op.sourceRel,
        dest: op.dest,
        reason: 'previously managed operation is no longer present in the next plan',
      });
    }
  }

  return { statePath, currentState, nextRequest, nextPlan, items };
}

export function buildUpdateDryRun(request) {
  const { statePath, currentState, nextRequest, nextPlan, items } = analyzeUpdate(request);

  return {
    dryRun: true,
    statePath,
    target: currentState.target,
    request: {
      profile: nextRequest.profile ?? null,
      modules: nextRequest.moduleIds || [],
      seedIds: nextPlan.resolution.seedIds,
    },
    summary: summarize(items),
    items,
  };
}

function userModifiedSkipOp(op) {
  return {
    ...op,
    kind: 'skip',
    dest: null,
    strategy: `${op.strategy}+update-skip`,
    reason: `Skipped by update --on-user-modified skip: destination looks user-modified (${op.dest})`,
  };
}

// Apply a managed-file update: refresh only the operations in the next plan
// (so user-created files and removed-from-plan files are never touched), gate
// on user-modified drift, then delegate writes/backup/state-rewrite to apply.
export function applyUpdate(
  request,
  { backup = false, conflictPolicy = 'managed-overwrite', onUserModified = 'fail', installedAt } = {},
) {
  if (!USER_MODIFIED_POLICIES.includes(onUserModified)) {
    throw new Error(`--on-user-modified must be one of ${USER_MODIFIED_POLICIES.join(', ')} (got ${onUserModified})`);
  }

  const { nextPlan, items } = analyzeUpdate(request);
  const modifiedItems = items.filter((item) => item.status === 'possible-user-modified');

  if (modifiedItems.length && onUserModified === 'fail') {
    const list = modifiedItems.map((item) => item.dest).join(', ');
    throw new Error(
      `update refused: ${modifiedItems.length} managed file(s) look user-modified (${list}). `
      + 'Re-run with --on-user-modified skip (keep your edits) or overwrite (restore canonical content, ideally with --backup).',
    );
  }

  let { operations } = nextPlan;
  if (modifiedItems.length && onUserModified === 'skip') {
    const modifiedDests = new Set(modifiedItems.map((item) => item.dest));
    operations = operations.map((op) => (
      op.kind !== 'skip' && op.dest && modifiedDests.has(op.dest)
        ? userModifiedSkipOp(op)
        : op
    ));
  }

  const applyOptions = { backup, conflictPolicy };
  if (installedAt !== undefined) applyOptions.installedAt = installedAt;
  const result = applyPlan({ ...nextPlan, operations }, applyOptions);

  return {
    updated: true,
    onUserModified,
    userModified: modifiedItems,
    baseRoot: nextPlan.baseRoot,
    ...result,
  };
}
