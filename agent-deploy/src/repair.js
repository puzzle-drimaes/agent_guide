// Repair usecase.
// Unlike update — which rebuilds the next plan from the current asset bundle and
// diffs it — repair treats the recorded install-state as the source of truth and
// detects managed destinations that have gone missing or drifted on disk. Real
// repair writes replay only recorded managed operations, with the same
// path-safety and symlink guards used by apply.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getAdapter } from './targets/registry.js';
import { ASSET_ROOT } from './manifest.js';
import { deepMergeJson } from './json-merge.js';
import { mergeTomlAddOnly } from './toml-merge.js';
import { assertNoSymlinkEscape, assertPathInsideRoot } from './path-safety.js';
import { backupRootForPlan, copyBackupEntries } from './backup.js';
import { readState, writeState } from './state.js';

export const DRIFT_POLICIES = ['fail', 'skip', 'overwrite'];

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sha256Text(value) {
  return `sha256:${crypto.createHash('sha256').update(String(value), 'utf8').digest('hex')}`;
}

function sha256File(filePath) {
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
}

function managedMarkdownBlock(markerId, content) {
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  return `${start}\n${String(content).trim()}\n${end}`;
}

function extractManagedMarkdownBlock(current, markerId) {
  if (!markerId) return null;
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  return current.match(pattern)?.[0] || null;
}

function upsertManagedMarkdownBlock(current, markerId, content) {
  const block = managedMarkdownBlock(markerId, content);
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);

  if (pattern.test(current)) {
    return `${current.replace(pattern, block).replace(/\s+$/u, '')}\n`;
  }
  const prefix = current.trimEnd();
  return `${prefix ? `${prefix}\n\n` : ''}${block}\n`;
}

function readTextOrEmpty(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function readJsonOrEmpty(filePath) {
  const text = readTextOrEmpty(filePath).trim();
  return text ? JSON.parse(text) : {};
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function jsonContainsPatch(current, patch) {
  if (!isPlainObject(patch)) return JSON.stringify(current) === JSON.stringify(patch);
  if (!isPlainObject(current)) return false;
  return Object.entries(patch).every(([key, value]) => jsonContainsPatch(current[key], value));
}

function currentManagedHash(op) {
  if (!fs.existsSync(op.dest)) return null;
  if (!op.contentHash) return null;

  if (op.kind === 'copy-file') return sha256File(op.dest);
  if (op.kind === 'append-markdown') {
    const block = extractManagedMarkdownBlock(fs.readFileSync(op.dest, 'utf8'), op.markerId);
    return block ? sha256Text(block) : null;
  }
  return null;
}

function hasManagedContent(op) {
  if (!op.contentHash) return true;
  if (op.kind === 'copy-file') return currentManagedHash(op) === op.contentHash;
  if (op.kind === 'append-markdown') return currentManagedHash(op) === op.contentHash;
  if (op.kind === 'merge-json') {
    if (op.mergePayload === undefined) return true;
    try {
      return jsonContainsPatch(readJsonOrEmpty(op.dest), op.mergePayload);
    } catch {
      return false;
    }
  }
  if (op.kind === 'merge-toml') {
    if (op.mergePayload === undefined) return true;
    try {
      const current = readTextOrEmpty(op.dest);
      return mergeTomlAddOnly(current, op.mergePayload) === current;
    } catch {
      return false;
    }
  }
  return true;
}

function classifyManagedOperation(op) {
  const exists = fs.existsSync(op.dest);
  const base = {
    moduleId: op.moduleId,
    kind: op.kind,
    sourceRel: op.sourceRel,
    dest: op.dest,
    expectedHash: op.contentHash || null,
    actualHash: exists ? currentManagedHash(op) : null,
  };
  if (!exists) {
    return {
      ...base,
      status: 'missing',
      reason: 'managed destination recorded in install-state is missing and would be restored',
    };
  }
  if (!hasManagedContent(op)) {
    return {
      ...base,
      status: 'drifted',
      reason: op.contentHash
        ? 'managed content hash differs from install-state'
        : 'managed content recorded in install-state is no longer present',
    };
  }
  return {
    ...base,
    status: 'present',
    reason: op.contentHash
      ? 'managed content hash matches install-state'
      : 'managed destination recorded in install-state is present',
  };
}

function summarize(items) {
  const summary = {};
  for (const item of items) {
    summary[item.status] = (summary[item.status] || 0) + 1;
  }
  return summary;
}

function sourceSearchRoots(currentState) {
  const packAssetRoots = (currentState.source.packs || [])
    .map((pack) => pack.root && path.join(pack.root, 'assets'))
    .filter(Boolean);
  return [ASSET_ROOT, ...packAssetRoots];
}

function locateSourcePath(op, currentState) {
  if (!op.sourceRel) throw new Error(`repair cannot restore ${op.dest}: operation has no sourceRel`);
  for (const root of sourceSearchRoots(currentState)) {
    const candidate = path.join(root, op.sourceRel);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`repair cannot restore ${op.dest}: source asset not found for ${op.sourceRel}`);
}

function assertRepairableOperation(op) {
  if (op.kind === 'copy-file') return;
  if (op.kind === 'append-markdown' && op.markerId && op.content !== undefined) return;
  if ((op.kind === 'merge-json' || op.kind === 'merge-toml') && op.mergePayload !== undefined) return;
  throw new Error(
    `repair cannot replay ${op.kind} for ${op.dest}: install-state lacks the managed operation payload; run update/apply first`,
  );
}

function writeRepairOperation(op, currentState) {
  assertRepairableOperation(op);
  fs.mkdirSync(path.dirname(op.dest), { recursive: true });

  if (op.kind === 'copy-file') {
    fs.copyFileSync(locateSourcePath(op, currentState), op.dest);
  } else if (op.kind === 'append-markdown') {
    fs.writeFileSync(op.dest, upsertManagedMarkdownBlock(readTextOrEmpty(op.dest), op.markerId, op.content), 'utf8');
  } else if (op.kind === 'merge-json') {
    const merged = deepMergeJson(readJsonOrEmpty(op.dest), op.mergePayload);
    fs.writeFileSync(op.dest, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  } else if (op.kind === 'merge-toml') {
    fs.writeFileSync(op.dest, mergeTomlAddOnly(readTextOrEmpty(op.dest), op.mergePayload), 'utf8');
  }
}

function backupEntry({ sourcePath, backupRoot, safetyRoot, reason }) {
  assertPathInsideRoot(sourcePath, safetyRoot, `backup source for ${reason}`);
  assertNoSymlinkEscape(sourcePath, safetyRoot, `backup source for ${reason}`);
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) return null;
  const backupPath = path.join(backupRoot, path.relative(safetyRoot, sourcePath));
  assertPathInsideRoot(backupPath, safetyRoot, `backup destination for ${reason}`);
  assertNoSymlinkEscape(backupPath, safetyRoot, `backup destination for ${reason}`);
  return { source: sourcePath, backupPath, reason };
}

function collectRepairBackupEntries({ statePath, operations, backupRoot, safetyRoot, enabled }) {
  const entries = [];
  if (!enabled) return { enabled: false, root: null, entries };
  const seen = new Set();
  for (const op of operations) {
    const entry = backupEntry({
      sourcePath: op.dest,
      backupRoot,
      safetyRoot,
      reason: `repair:${op.kind}:${op.moduleId}`,
    });
    if (entry && !seen.has(entry.source)) {
      entries.push(entry);
      seen.add(entry.source);
    }
  }
  const stateEntry = backupEntry({
    sourcePath: statePath,
    backupRoot,
    safetyRoot,
    reason: 'install-state',
  });
  if (stateEntry && !seen.has(stateEntry.source)) entries.push(stateEntry);
  return { enabled: true, root: backupRoot, entries };
}

function refreshStateHashes(currentState) {
  return {
    ...currentState,
    operations: currentState.operations.map((op) => {
      if (!op.dest || op.kind === 'skip' || !fs.existsSync(op.dest)) return op;
      if (op.kind === 'copy-file') return { ...op, contentHash: sha256File(op.dest) };
      if (op.kind === 'append-markdown') {
        const block = extractManagedMarkdownBlock(readTextOrEmpty(op.dest), op.markerId);
        return block ? { ...op, contentHash: sha256Text(block) } : op;
      }
      return op;
    }),
  };
}

// Shared analysis for dry-run reporting (and, later, repair writes): read the
// trusted install-state and classify each recorded managed operation by on-disk
// existence and managed-content hash. Pure (no writes). Skip ops and operations
// without a destination are not managed files and are excluded.
export function analyzeRepair(request) {
  const statePath = locateStatePath(request);
  const currentState = readState(statePath);
  if (request.target && currentState.target.target !== request.target) {
    throw new Error(`install-state target mismatch: expected ${request.target}, got ${currentState.target.target}`);
  }

  const managed = currentState.operations.filter((op) => op.dest && op.kind !== 'skip');
  const items = managed.map(classifyManagedOperation);

  return { statePath, currentState, input: inputForRequest(request), items };
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

export function applyRepair(
  request,
  { backup = false, onDrift = 'fail', installedAt = new Date().toISOString() } = {},
) {
  if (!DRIFT_POLICIES.includes(onDrift)) {
    throw new Error(`--on-drift must be one of ${DRIFT_POLICIES.join(', ')} (got ${onDrift})`);
  }

  const { statePath, currentState, input, items } = analyzeRepair(request);
  const adapter = getAdapter(request.target);
  const safetyRoot = adapter.baseRoot(input);
  const managedByDest = new Map(currentState.operations.filter((op) => op.dest && op.kind !== 'skip').map((op) => [op.dest, op]));
  const missingItems = items.filter((item) => item.status === 'missing');
  const driftedItems = items.filter((item) => item.status === 'drifted');

  if (driftedItems.length && onDrift === 'fail') {
    const list = driftedItems.map((item) => item.dest).join(', ');
    throw new Error(
      `repair refused: ${driftedItems.length} managed file(s) drifted from install-state (${list}). `
      + 'Re-run with --on-drift skip (repair only missing files) or overwrite (re-apply managed content, ideally with --backup).',
    );
  }

  const selectedItems = [
    ...missingItems,
    ...(onDrift === 'overwrite' ? driftedItems : []),
  ];
  const operations = selectedItems.map((item) => managedByDest.get(item.dest));

  assertPathInsideRoot(statePath, safetyRoot, 'install-state path');
  assertNoSymlinkEscape(statePath, safetyRoot, 'install-state path');
  for (const op of operations) {
    assertPathInsideRoot(op.dest, safetyRoot, `repair destination for ${op.moduleId}`);
    assertNoSymlinkEscape(op.dest, safetyRoot, `repair destination for ${op.moduleId}`);
    assertRepairableOperation(op);
  }

  const backupRoot = backupRootForPlan({
    scope: currentState.target.scope,
    targetRoot: currentState.target.root,
    baseRoot: safetyRoot,
  }, installedAt);
  const backupRecord = collectRepairBackupEntries({
    statePath,
    operations,
    backupRoot,
    safetyRoot,
    enabled: backup,
  });
  copyBackupEntries(backupRecord);

  for (const op of operations) {
    writeRepairOperation(op, currentState);
  }

  const repairedState = {
    ...refreshStateHashes(currentState),
    installedAt,
    backup: backupRecord,
  };
  writeState(statePath, repairedState);

  return {
    repaired: true,
    operations: operations.length,
    missing: missingItems,
    drifted: driftedItems,
    onDrift,
    statePath,
    backup: backupRecord,
    state: repairedState,
  };
}
