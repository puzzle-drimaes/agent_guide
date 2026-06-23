// Uninstall lifecycle usecase.
// Reverse-replays the recorded install-state operations and either reports what
// uninstall would do (dry-run) or applies managed teardown writes. Safety
// boundary: only managed artifacts from install-state are touched. Fully managed
// files (copy-file) are deletion candidates; shared files we merged/appended
// into (append-markdown/merge-json/merge-toml) are reverted in place — the
// managed block/keys are removed, but the file (which may hold user-authored
// content) is kept, never deleted. The install-state provenance file is deleted
// after successful write-mode teardown.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getAdapter } from './targets/registry.js';
import { ASSET_ROOT } from './manifest.js';
import { assertNoSymlinkEscape, assertPathInsideRoot } from './path-safety.js';
import { backupRootForPlan, copyBackupEntries } from './backup.js';
import { readState } from './state.js';

export const UNINSTALL_USER_MODIFIED_POLICIES = ['fail', 'skip', 'force'];

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sha256Text(value) {
  return `sha256:${crypto.createHash('sha256').update(String(value), 'utf8').digest('hex')}`;
}

function sha256File(filePath) {
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
}

function readTextOrEmpty(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function readJsonOrEmpty(filePath) {
  const text = readTextOrEmpty(filePath).trim();
  return text ? JSON.parse(text) : {};
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function jsonContainsPatch(current, patch) {
  if (!isPlainObject(patch)) return deepEqual(current, patch);
  if (!isPlainObject(current)) return false;
  return Object.entries(patch).every(([key, value]) => jsonContainsPatch(current[key], value));
}

function removeJsonPatch(current, patch, { force = false } = {}) {
  if (!isPlainObject(current) || !isPlainObject(patch)) return current;
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.prototype.hasOwnProperty.call(next, key)) continue;
    if (isPlainObject(value) && isPlainObject(next[key])) {
      const child = removeJsonPatch(next[key], value, { force });
      if (isPlainObject(child) && Object.keys(child).length === 0) {
        delete next[key];
      } else {
        next[key] = child;
      }
    } else if (force || deepEqual(next[key], value)) {
      delete next[key];
    }
  }
  return next;
}

function extractManagedMarkdownBlock(current, markerId) {
  if (!markerId) return null;
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  return current.match(pattern)?.[0] || null;
}

function removeManagedMarkdownBlock(current, markerId) {
  if (!markerId) return current;
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  const pattern = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`);
  return current.replace(pattern, (match) => (match.startsWith('\n') && match.endsWith('\n') ? '\n' : '')).trimEnd();
}

function quoteTomlString(value) {
  return JSON.stringify(String(value));
}

function quoteTablePart(part) {
  return /^[A-Za-z0-9_-]+$/.test(part) ? part : quoteTomlString(part);
}

function actualTableHeader(pathParts) {
  return `[${pathParts.map(quoteTablePart).join('.')}]`;
}

function encodeTomlValue(value) {
  if (typeof value === 'string') return quoteTomlString(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) return `[${value.map(encodeTomlValue).join(', ')}]`;
  return quoteTomlString(value);
}

function splitLines(text) {
  return text ? text.split(/\r?\n/) : [];
}

function findTable(lines, pathParts) {
  const header = actualTableHeader(pathParts);
  const start = lines.findIndex((line) => line.trim() === header);
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s*\[[^\]]+\]\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function flattenTables(prefix, object, out) {
  const entries = [];
  const nested = [];
  for (const [key, value] of Object.entries(object || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      nested.push([key, value]);
    } else if (value !== undefined && value !== null) {
      entries.push([key, value]);
    }
  }
  out.push({ pathParts: prefix, entries });
  for (const [key, value] of nested) {
    flattenTables([...prefix, key], value, out);
  }
}

function tomlPayloadTables(payload) {
  const tables = [];
  flattenTables([], payload, tables);
  return tables.filter((table) => table.pathParts.length && table.entries.length);
}

function tomlContainsPayload(currentText, payload) {
  const lines = splitLines(currentText);
  for (const table of tomlPayloadTables(payload)) {
    const range = findTable(lines, table.pathParts);
    if (!range) return false;
    for (const [key, value] of table.entries) {
      const expected = `${key} = ${encodeTomlValue(value)}`;
      let found = false;
      for (let i = range.start + 1; i < range.end; i += 1) {
        if (lines[i].trim() === expected) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
  }
  return true;
}

function removeTomlPayload(currentText, payload, { force = false } = {}) {
  const lines = splitLines(currentText).filter((line, index, arr) => !(index === arr.length - 1 && line === ''));
  const tables = tomlPayloadTables(payload).sort((a, b) => b.pathParts.length - a.pathParts.length);

  for (const table of tables) {
    const range = findTable(lines, table.pathParts);
    if (!range) continue;
    const keys = new Map(table.entries.map(([key, value]) => [key, `${key} = ${encodeTomlValue(value)}`]));
    for (let i = range.end - 1; i > range.start; i -= 1) {
      const trimmed = lines[i].trim();
      for (const [key, expected] of keys.entries()) {
        const keyPattern = new RegExp(`^${escapeRegExp(key)}\\s*=`);
        if ((force && keyPattern.test(trimmed)) || trimmed === expected) {
          lines.splice(i, 1);
          break;
        }
      }
    }
    const nextRange = findTable(lines, table.pathParts);
    if (nextRange) {
      const body = lines.slice(nextRange.start + 1, nextRange.end).filter((line) => line.trim() !== '');
      if (!body.length) {
        lines.splice(nextRange.start, nextRange.end - nextRange.start);
        if (lines[nextRange.start] === '') lines.splice(nextRange.start, 1);
      }
    }
  }

  const text = lines.join('\n').replace(/\s+$/u, '');
  return text ? `${text}\n` : '';
}

function currentManagedHash(op) {
  if (!fs.existsSync(op.dest)) return null;
  if (op.kind === 'copy-file') return sha256File(op.dest);
  if (op.kind === 'append-markdown') {
    const block = extractManagedMarkdownBlock(readTextOrEmpty(op.dest), op.markerId);
    return block ? sha256Text(block) : null;
  }
  return null;
}

function hasManagedContent(op) {
  if (op.kind === 'copy-file') {
    return Boolean(op.contentHash) && currentManagedHash(op) === op.contentHash;
  }
  if (op.kind === 'append-markdown') {
    const block = extractManagedMarkdownBlock(readTextOrEmpty(op.dest), op.markerId);
    if (!block) return false;
    if (!op.contentHash) return true;
    return sha256Text(block) === op.contentHash;
  }
  if (op.kind === 'merge-json') {
    if (op.mergePayload === undefined) return false;
    try {
      return jsonContainsPatch(readJsonOrEmpty(op.dest), op.mergePayload);
    } catch {
      return false;
    }
  }
  if (op.kind === 'merge-toml') {
    if (op.mergePayload === undefined) return false;
    try {
      return tomlContainsPayload(readTextOrEmpty(op.dest), op.mergePayload);
    } catch {
      return false;
    }
  }
  return true;
}

function classifyManagedOperation(op) {
  const base = {
    moduleId: op.moduleId,
    kind: op.kind,
    sourceRel: op.sourceRel,
    dest: op.dest,
    expectedHash: op.contentHash || null,
    actualHash: fs.existsSync(op.dest) ? currentManagedHash(op) : null,
  };

  if (!fs.existsSync(op.dest)) {
    return {
      ...base,
      status: 'already-absent',
      reason: 'managed destination recorded in install-state is already absent',
    };
  }

  if (!hasManagedContent(op)) {
    return {
      ...base,
      status: 'possible-user-modified',
      reason: 'managed content differs from install-state or is no longer detectable',
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

function backupEntry({ sourcePath, backupRoot, safetyRoot, reason }) {
  assertPathInsideRoot(sourcePath, safetyRoot, `backup source for ${reason}`);
  assertNoSymlinkEscape(sourcePath, safetyRoot, `backup source for ${reason}`);
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) return null;
  const backupPath = path.join(backupRoot, path.relative(safetyRoot, sourcePath));
  assertPathInsideRoot(backupPath, safetyRoot, `backup destination for ${reason}`);
  assertNoSymlinkEscape(backupPath, safetyRoot, `backup destination for ${reason}`);
  return { source: sourcePath, backupPath, reason };
}

function collectUninstallBackupEntries({ statePath, items, backupRoot, safetyRoot, enabled }) {
  const entries = [];
  if (!enabled) return { enabled: false, root: null, entries };
  const seen = new Set();
  for (const item of items) {
    if (!item.dest || item.status === 'already-absent') continue;
    const entry = backupEntry({
      sourcePath: item.dest,
      backupRoot,
      safetyRoot,
      reason: `uninstall:${item.kind}:${item.moduleId}`,
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

function writeRevertOperation(op, { force = false } = {}) {
  if (op.kind === 'append-markdown') {
    fs.writeFileSync(op.dest, removeManagedMarkdownBlock(readTextOrEmpty(op.dest), op.markerId), 'utf8');
  } else if (op.kind === 'merge-json') {
    const next = removeJsonPatch(readJsonOrEmpty(op.dest), op.mergePayload, { force });
    fs.writeFileSync(op.dest, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  } else if (op.kind === 'merge-toml') {
    fs.writeFileSync(op.dest, removeTomlPayload(readTextOrEmpty(op.dest), op.mergePayload, { force }), 'utf8');
  }
}

function removeEmptyParents(startDir, safetyRoot) {
  const removed = [];
  let current = path.resolve(startDir);
  const root = path.resolve(safetyRoot);
  while (current !== root && current !== path.dirname(current)) {
    assertPathInsideRoot(current, root, 'empty directory cleanup path');
    assertNoSymlinkEscape(current, root, 'empty directory cleanup path');
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
      current = path.dirname(current);
      continue;
    }
    if (fs.readdirSync(current).length > 0) break;
    fs.rmdirSync(current);
    removed.push(current);
    current = path.dirname(current);
  }
  return removed;
}

// Shared analysis for dry-run reporting and uninstall writes: read the trusted
// install-state and reverse-replay the recorded managed operations into
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

  return { statePath, currentState, input: inputForRequest(request), items, stateFile };
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

export function applyUninstall(
  request,
  { backup = false, onUserModified = 'fail', installedAt = new Date().toISOString() } = {},
) {
  if (!UNINSTALL_USER_MODIFIED_POLICIES.includes(onUserModified)) {
    throw new Error(`--on-user-modified for uninstall must be one of ${UNINSTALL_USER_MODIFIED_POLICIES.join(', ')} (got ${onUserModified})`);
  }

  const { statePath, currentState, input, items } = analyzeUninstall(request);
  const adapter = getAdapter(request.target);
  const safetyRoot = adapter.baseRoot(input);
  const operationByDest = new Map(currentState.operations.filter((op) => op.dest && op.kind !== 'skip').map((op) => [op.dest, op]));
  const userModified = items.filter((item) => item.status === 'possible-user-modified');

  if (userModified.length && onUserModified === 'fail') {
    const list = userModified.map((item) => item.dest).join(', ');
    throw new Error(
      `uninstall refused: ${userModified.length} managed file(s) look user-modified (${list}). `
      + 'Re-run with --on-user-modified skip (keep those files) or force (remove/revert anyway, ideally with --backup).',
    );
  }

  const selectedItems = items.filter((item) => {
    if (item.status === 'already-absent') return false;
    if (item.status === 'possible-user-modified') return onUserModified === 'force';
    return item.status === 'would-delete' || item.status === 'would-revert';
  });
  const skipped = onUserModified === 'skip' ? userModified : [];

  assertPathInsideRoot(statePath, safetyRoot, 'install-state path');
  assertNoSymlinkEscape(statePath, safetyRoot, 'install-state path');
  for (const item of selectedItems) {
    assertPathInsideRoot(item.dest, safetyRoot, `uninstall destination for ${item.moduleId}`);
    assertNoSymlinkEscape(item.dest, safetyRoot, `uninstall destination for ${item.moduleId}`);
  }

  const backupRoot = backupRootForPlan({
    scope: currentState.target.scope,
    targetRoot: currentState.target.root,
    baseRoot: safetyRoot,
  }, installedAt);
  const backupRecord = collectUninstallBackupEntries({
    statePath,
    items: selectedItems,
    backupRoot,
    safetyRoot,
    enabled: backup,
  });
  copyBackupEntries(backupRecord);

  const cleanupStarts = [];
  let deleted = 0;
  let reverted = 0;
  for (const item of selectedItems) {
    if (!fs.existsSync(item.dest)) continue;
    const op = operationByDest.get(item.dest);
    if (item.kind === 'copy-file') {
      fs.rmSync(item.dest, { force: true });
      cleanupStarts.push(path.dirname(item.dest));
      deleted += 1;
    } else if (REVERT_KINDS.has(item.kind)) {
      writeRevertOperation(op, { force: item.status === 'possible-user-modified' });
      reverted += 1;
    }
  }

  if (fs.existsSync(statePath)) {
    fs.rmSync(statePath, { force: true });
    cleanupStarts.push(path.dirname(statePath));
  }

  const removedDirectories = [];
  for (const dir of cleanupStarts.sort((a, b) => b.length - a.length)) {
    for (const removed of removeEmptyParents(dir, safetyRoot)) {
      if (!removedDirectories.includes(removed)) removedDirectories.push(removed);
    }
  }

  return {
    uninstalled: true,
    statePath,
    target: currentState.target,
    request: {
      profile: currentState.request.profile ?? null,
      modules: currentState.request.modules || [],
    },
    summary: summarize(items),
    deleted,
    reverted,
    skipped,
    userModified,
    onUserModified,
    stateFile: {
      dest: statePath,
      status: 'deleted',
      reason: 'install-state provenance file was deleted',
    },
    backup: backupRecord,
    removedDirectories,
  };
}
