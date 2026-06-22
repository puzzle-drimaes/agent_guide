// Claude Code adapter.
// Native layout: <root>/.claude/{rules,agents,commands,skills} mirrored from the
// canonical source; MCP at <projectRoot>/.mcp.json (project) or ~/.claude.json
// (home). Structure is preserved, so module paths may be whole categories
// ('rules') or subpaths ('rules/developer') or single files ('agents/x.md').
import path from 'node:path';
import { createAdapter, mirrorOps, mergeJsonOp } from './helpers.js';

export default createAdapter({
  id: 'claude',
  target: 'claude',
  scope: 'project', // default; overridable per-install (CLI defaults to home only via --global)
  rootSegments: ['.claude'],
  stateFile: 'agent-install-state.json',
  planOperations(input, adapter) {
    const { assetRoot } = input;
    const root = adapter.resolveRoot(input);
    const base = adapter.baseRoot(input);
    const mcpDest = adapter.scopeOf(input) === 'home'
      ? path.join(base, '.claude.json')
      : path.join(base, '.mcp.json');
    const ops = [];

    for (const module of input.modules) {
      const moduleAssetRoot = module.assetRoot || assetRoot;
      for (const sourceRel of module.paths) {
        const category = sourceRel.split('/')[0];
        if (category === 'mcp') {
          const op = mergeJsonOp({
            moduleId: module.id, assetRoot: moduleAssetRoot,
            sourceRel: 'mcp/servers.json',
            dest: mcpDest,
          });
          if (op) ops.push(op);
        } else {
          // rules / agents / commands / skills -> mirror under .claude/
          ops.push(...mirrorOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, destRoot: root }));
        }
      }
    }
    return ops;
  },
});
