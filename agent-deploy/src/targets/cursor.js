// Cursor adapter.
// Diverges from Claude: rules become FLAT .mdc files under .cursor/rules,
// agents/skills mirror under .cursor/, slash-commands have no Cursor surface
// (recorded as a skip+reason), MCP merges into .cursor/mcp.json.
// Same canonical source, different shape -> this is the adapter's whole job.
import fs from 'node:fs';
import path from 'node:path';
import { buildGovernedMcpConfig } from '../mcp-governance.js';
import {
  createAdapter, mirrorOps, skipOp, fileOp, walkFiles,
} from './helpers.js';

// Flatten each rules file relative to the `rules/` root:
//   rules/common/security.md        -> .cursor/rules/common-security.mdc
//   rules/developer/architecture.md -> .cursor/rules/developer-architecture.mdc
// README files are dropped. Works whether sourceRel is the whole `rules` dir,
// a subdir, or a single file.
function cursorRuleOps({ moduleId, assetRoot, sourceRel, root }) {
  const abs = path.join(assetRoot, sourceRel);
  const rels = fs.statSync(abs).isFile() ? [''] : walkFiles(abs); // '' = sourceRel is itself a file
  const ops = [];
  for (const rel of rels) {
    const fullRel = rel ? `${sourceRel}/${rel}` : sourceRel;
    if (path.basename(fullRel).toLowerCase() === 'readme.md') continue;
    const underRules = fullRel.replace(/^rules\//, '');
    let flat = underRules.replace(/\//g, '-');
    flat = flat.endsWith('.md') ? `${flat.slice(0, -3)}.mdc` : flat;
    ops.push(fileOp({
      kind: 'copy-file',
      moduleId,
      sourceRel: fullRel,
      sourcePath: path.join(assetRoot, fullRel),
      dest: path.join(root, 'rules', flat),
      strategy: 'flatten-copy',
    }));
  }
  return ops;
}

export default createAdapter({
  id: 'cursor',
  target: 'cursor',
  scope: 'project',
  rootSegments: ['.cursor'],
  stateFile: 'agent-install-state.json',
  planOperations(input, adapter) {
    const { assetRoot } = input;
    const root = adapter.resolveRoot(input);
    const ops = [];

    for (const module of input.modules) {
      const moduleAssetRoot = module.assetRoot || assetRoot;
      for (const sourceRel of module.paths) {
        const category = sourceRel.split('/')[0];
        switch (category) {
          case 'rules':
            ops.push(...cursorRuleOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, root }));
            break;
          case 'agents':
          case 'skills':
          case 'prompts':
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, destRoot: root }));
            break;
          case 'commands':
            // Cursor has no slash-command surface -> record the skip, don't write.
            ops.push(skipOp({
              moduleId: module.id, sourceRel,
              reason: 'Cursor has no slash-command surface',
            }));
            break;
          case 'mcp': {
            const governed = buildGovernedMcpConfig({ assetRoot: moduleAssetRoot });
            if (Object.keys(governed.mergePayload.mcpServers).length) ops.push(fileOp({
              kind: 'merge-json',
              moduleId: module.id,
              sourceRel: governed.sourceRel,
              sourcePath: governed.sourcePath,
              dest: path.join(root, 'mcp.json'),
              strategy: 'merge-json+mcp-governance',
              mergePayload: governed.mergePayload,
            }));
            for (const skipped of governed.skipped) {
              ops.push(skipOp({ moduleId: module.id, sourceRel: skipped.sourceRel, reason: skipped.reason }));
            }
            break;
          }
          default:
            break;
        }
      }
    }
    return ops;
  },
});
