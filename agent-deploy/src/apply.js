// Apply: execute a plan's operations, then write the provenance record.
// copy-file  -> straight copy
// merge-json -> deep-merge into existing JSON (non-destructive)
// merge-toml -> add-only merge into existing TOML (non-destructive)
// append-markdown -> upsert a managed Markdown block
// Every destination is path-safety checked before any write.
import fs from 'node:fs';
import path from 'node:path';
import { deepMergeJson } from './json-merge.js';
import { mergeTomlAddOnly } from './toml-merge.js';
import { assertPathInsideRoot, assertNoSymlinkEscape } from './path-safety.js';
import { assertValidInstallState, buildState, writeState } from './state.js';
import { collectBackupEntries, copyBackupEntries } from './backup.js';
import { resolveConflictPolicy } from './conflict-policy.js';

function readJsonOrEmpty(p) {
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readTextOrEmpty(p) {
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

function upsertManagedMarkdownBlock(current, markerId, content) {
  const start = `<!-- agent-deploy:${markerId}:start -->`;
  const end = `<!-- agent-deploy:${markerId}:end -->`;
  const block = `${start}\n${content.trim()}\n${end}`;
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

  if (pattern.test(current)) {
    return `${current.replace(pattern, block).replace(/\s+$/u, '')}\n`;
  }
  const prefix = current.trimEnd();
  return `${prefix ? `${prefix}\n\n` : ''}${block}\n`;
}

export function applyPlan(
  plan,
  { installedAt = new Date().toISOString(), backup = false, conflictPolicy = 'managed-overwrite' } = {},
) {
  // The safety boundary is the scope's base root: the user-global home dir for
  // home scope, or the project root for project scope. Every write — including
  // sibling files like ~/.claude.json — must stay inside it.
  const safetyRoot = plan.baseRoot;
  const conflictPolicyResult = resolveConflictPolicy(plan.operations, { policy: conflictPolicy });
  const effectivePlan = { ...plan, operations: conflictPolicyResult.operations };
  const backupRecord = collectBackupEntries(effectivePlan, { enabled: backup, installedAt });

  const state = buildState({
    adapter: plan.adapter,
    input: plan.input,
    request: plan.request,
    resolution: plan.resolution,
    manifestVersion: plan.manifestVersion,
    packs: plan.packs || [],
    conflictResolutions: plan.conflictResolutions || [],
    backup: backupRecord,
    conflictPolicy: conflictPolicyResult.record,
    operations: effectivePlan.operations,
    installedAt,
  });
  assertValidInstallState(state);

  // The install-state file must also stay inside the safety boundary. Check it
  // before applying operations so a bad state destination fails without partial
  // writes.
  assertPathInsideRoot(plan.statePath, safetyRoot, 'install-state path');
  assertNoSymlinkEscape(plan.statePath, safetyRoot, 'install-state path');
  for (const op of effectivePlan.operations) {
    if (op.kind === 'skip') continue;
    assertPathInsideRoot(op.dest, safetyRoot, `destination for ${op.moduleId}`);
    assertNoSymlinkEscape(op.dest, safetyRoot, `destination for ${op.moduleId}`);
  }

  copyBackupEntries(backupRecord);

  for (const op of effectivePlan.operations) {
    if (op.kind === 'skip') continue; // unsupported capability: recorded only, nothing written

    assertPathInsideRoot(op.dest, safetyRoot, `destination for ${op.moduleId}`);
    assertNoSymlinkEscape(op.dest, safetyRoot, `destination for ${op.moduleId}`);
    fs.mkdirSync(path.dirname(op.dest), { recursive: true });

    if (op.kind === 'merge-json') {
      const current = readJsonOrEmpty(op.dest);
      const merged = deepMergeJson(current, op.mergePayload);
      fs.writeFileSync(op.dest, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    } else if (op.kind === 'merge-toml') {
      const merged = mergeTomlAddOnly(readTextOrEmpty(op.dest), op.mergePayload);
      fs.writeFileSync(op.dest, merged, 'utf8');
    } else if (op.kind === 'append-markdown') {
      const next = upsertManagedMarkdownBlock(readTextOrEmpty(op.dest), op.markerId, op.content);
      fs.writeFileSync(op.dest, next, 'utf8');
    } else {
      fs.copyFileSync(op.sourcePath, op.dest);
    }
  }

  writeState(plan.statePath, state);

  return {
    applied: true,
    operations: effectivePlan.operations.length,
    statePath: plan.statePath,
    backup: backupRecord,
    conflictPolicy: conflictPolicyResult.record,
    state,
  };
}
