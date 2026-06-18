// Adapter registry (ported from ECC scripts/lib/install-targets/registry.js).
// To support a 3rd tool (Gemini CLI, Codex, OpenCode...), write one adapter
// module and add it to this list.
import claudeProject from './claude.js';
import codexProject from './codex.js';
import cursorProject from './cursor.js';

const ADAPTERS = Object.freeze([codexProject, claudeProject, cursorProject]);

export function listAdapters() {
  return ADAPTERS.slice();
}

export function listTargets() {
  return ADAPTERS.map((a) => a.target);
}

export function getAdapter(targetOrId) {
  const adapter = ADAPTERS.find((a) => a.supports(targetOrId));
  if (!adapter) {
    throw new Error(
      `unknown target: ${targetOrId} (known: ${listTargets().join(', ')})`,
    );
  }
  return adapter;
}
