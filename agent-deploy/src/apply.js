// Apply: execute a plan's operations, then write the provenance record.
// copy-file  -> straight copy
// merge-json -> deep-merge into existing JSON (non-destructive)
// Every destination is path-safety checked before any write.
import fs from 'node:fs';
import path from 'node:path';
import { deepMergeJson } from './json-merge.js';
import { assertPathInsideRoot, assertNoSymlinkEscape } from './path-safety.js';
import { buildState, writeState } from './state.js';

function readJsonOrEmpty(p) {
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function applyPlan(plan, { installedAt = new Date().toISOString() } = {}) {
  // The safety boundary is the scope's base root: the user-global home dir for
  // home scope, or the project root for project scope. Every write — including
  // sibling files like ~/.claude.json — must stay inside it.
  const safetyRoot = plan.baseRoot;

  for (const op of plan.operations) {
    if (op.kind === 'skip') continue; // unsupported capability: recorded only, nothing written

    assertPathInsideRoot(op.dest, safetyRoot, `destination for ${op.moduleId}`);
    assertNoSymlinkEscape(op.dest, safetyRoot, `destination for ${op.moduleId}`);
    fs.mkdirSync(path.dirname(op.dest), { recursive: true });

    if (op.kind === 'merge-json') {
      const current = readJsonOrEmpty(op.dest);
      const merged = deepMergeJson(current, op.mergePayload);
      fs.writeFileSync(op.dest, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    } else {
      fs.copyFileSync(op.sourcePath, op.dest);
    }
  }

  // The install-state file must also stay inside the safety boundary.
  assertPathInsideRoot(plan.statePath, safetyRoot, 'install-state path');
  assertNoSymlinkEscape(plan.statePath, safetyRoot, 'install-state path');

  const state = buildState({
    adapter: plan.adapter,
    input: plan.input,
    request: plan.request,
    resolution: plan.resolution,
    manifestVersion: plan.manifestVersion,
    operations: plan.operations,
    installedAt,
  });
  writeState(plan.statePath, state);

  return { applied: true, operations: plan.operations.length, statePath: plan.statePath, state };
}
