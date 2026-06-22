// Backup helpers for apply-time lifecycle safety.
// Backups are intentionally implemented outside target adapters: adapters map
// canonical assets to harness-specific destinations, while apply owns file
// system mutation and rollback foundations.
import fs from 'node:fs';
import path from 'node:path';
import { assertPathInsideRoot, assertNoSymlinkEscape } from './path-safety.js';

function safeRunId(installedAt) {
  return String(installedAt || new Date().toISOString()).replace(/[^0-9A-Za-z._-]/g, '-');
}

export function backupRootForPlan(plan, installedAt) {
  const runId = safeRunId(installedAt);
  if (plan.scope === 'home') return path.join(plan.targetRoot, 'backups', runId);
  return path.join(plan.baseRoot, '.agent-deploy', 'backups', runId);
}

function backupPathForSource(sourcePath, backupRoot, safetyRoot) {
  const rel = path.relative(safetyRoot, sourcePath);
  return path.join(backupRoot, rel);
}

function backupEntry({ sourcePath, backupRoot, safetyRoot, reason }) {
  assertPathInsideRoot(sourcePath, safetyRoot, `backup source for ${reason}`);
  assertNoSymlinkEscape(sourcePath, safetyRoot, `backup source for ${reason}`);
  if (!fs.existsSync(sourcePath)) return null;
  const stat = fs.statSync(sourcePath);
  if (!stat.isFile()) return null;

  const backupPath = backupPathForSource(sourcePath, backupRoot, safetyRoot);
  assertPathInsideRoot(backupPath, safetyRoot, `backup destination for ${reason}`);
  assertNoSymlinkEscape(backupPath, safetyRoot, `backup destination for ${reason}`);

  return { source: sourcePath, backupPath, reason };
}

export function collectBackupEntries(plan, { enabled, installedAt }) {
  const backupRoot = enabled ? backupRootForPlan(plan, installedAt) : null;
  const entries = [];
  if (!enabled) return { enabled: false, root: null, entries };

  const seen = new Set();
  for (const op of plan.operations) {
    if (op.kind === 'skip' || !op.dest) continue;
    const entry = backupEntry({
      sourcePath: op.dest,
      backupRoot,
      safetyRoot: plan.baseRoot,
      reason: `${op.kind}:${op.moduleId}`,
    });
    if (entry && !seen.has(entry.source)) {
      seen.add(entry.source);
      entries.push(entry);
    }
  }

  const stateEntry = backupEntry({
    sourcePath: plan.statePath,
    backupRoot,
    safetyRoot: plan.baseRoot,
    reason: 'install-state',
  });
  if (stateEntry && !seen.has(stateEntry.source)) entries.push(stateEntry);

  return { enabled: true, root: backupRoot, entries };
}

export function copyBackupEntries(backup) {
  if (!backup?.enabled) return;
  for (const entry of backup.entries || []) {
    fs.mkdirSync(path.dirname(entry.backupPath), { recursive: true });
    fs.copyFileSync(entry.source, entry.backupPath);
  }
}
