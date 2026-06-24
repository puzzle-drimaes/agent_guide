// Adapter registry (ported from ECC scripts/lib/install-targets/registry.js).
// To support another tool (Kiro, OpenCode...), write one adapter
// module and add it to this list.
import claudeProject from './claude.js';
import codexProject from './codex.js';
import cursorProject from './cursor.js';
import geminiProject from './gemini.js';
import kiroProject from './kiro.js';

const ADAPTERS = Object.freeze([codexProject, claudeProject, geminiProject, cursorProject, kiroProject]);

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
