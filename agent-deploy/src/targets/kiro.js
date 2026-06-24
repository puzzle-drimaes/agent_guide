// Kiro adapter.
// Native project surfaces used here are workspace steering files under
// .kiro/steering/, Agent Skills under .kiro/skills/, and MCP config under
// .kiro/settings/mcp.json. Commands and agents are installed as explicit
// fallback reference files when no stable native command/agent schema is used.
import path from 'node:path';
import { buildGovernedMcpConfig } from '../mcp-governance.js';
import {
  appendMarkdownOp,
  createAdapter,
  fileOp,
  mirrorOps,
} from './helpers.js';

function flattenMarkdownName(sourceRel) {
  const underCategory = sourceRel.replace(/^[^/]+\//, '');
  const flattened = underCategory.replace(/\//g, '-');
  return flattened.endsWith('.md') ? flattened : `${flattened}.md`;
}

function kiroSteeringOps({ moduleId, assetRoot, sourceRel, root }) {
  return mirrorOps({
    moduleId,
    assetRoot,
    sourceRel,
    destRoot: path.join(root, 'steering'),
    rename(fullRel) {
      if (path.basename(fullRel).toLowerCase() === 'readme.md') return null;
      return flattenMarkdownName(fullRel);
    },
  }).map((op) => ({ ...op, strategy: 'flatten-copy-to-kiro-steering' }));
}

function kiroCommandOps({ moduleId, assetRoot, sourceRel, root }) {
  return mirrorOps({
    moduleId,
    assetRoot,
    sourceRel,
    destRoot: root,
  }).map((op) => ({
    ...op,
    strategy: 'instruction-backed-command-fallback',
  }));
}

function kiroRootInstructionContent() {
  return `# Company Kiro Instructions

This managed steering file was installed by agent-deploy. Follow the company rules and workflow references installed in this workspace before making changes.

## Installed instruction sources

- Load and follow always-on Kiro steering files under \`.kiro/steering/\`.
- Use installed Agent Skills under \`.kiro/skills/\` when their descriptions match the task.
- Use agent role prompts under \`.kiro/agents/\` as specialized review or planning fallbacks.
- Use command prompts under \`.kiro/commands/\` when the user asks for a matching workflow.

## Operating requirements

- Treat workspace/project scope as authoritative for this repository.
- Preserve semantic equivalence with Codex, Claude, Gemini, and Cursor installations.
- Do not ignore unsupported capabilities silently; rely on install-state skip reasons.
- Keep security, source attribution, and architecture rules active for every implementation task.`;
}

export default createAdapter({
  id: 'kiro',
  target: 'kiro',
  scope: 'project',
  rootSegments: ['.kiro'],
  stateSegments: ['.agent-deploy', 'install-state.json'],
  sharedRoot(input, adapter) {
    return path.join(adapter.resolveRoot(input), 'shared');
  },
  planOperations(input, adapter) {
    const { assetRoot } = input;
    const root = adapter.resolveRoot(input);
    const ops = [];
    let needsRootInstruction = false;

    for (const module of input.modules) {
      const moduleAssetRoot = module.assetRoot || assetRoot;
      for (const sourceRel of module.paths) {
        const category = sourceRel.split('/')[0];
        switch (category) {
          case 'rules':
            if (module.id === 'baseline-rules') needsRootInstruction = true;
            ops.push(...kiroSteeringOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, root }));
            break;
          case 'skills':
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, destRoot: root }));
            break;
          case 'agents':
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, destRoot: root }));
            break;
          case 'prompts':
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, destRoot: root }));
            break;
          case 'commands':
            ops.push(...kiroCommandOps({ moduleId: module.id, assetRoot: moduleAssetRoot, sourceRel, root }));
            break;
          case 'mcp': {
            const governed = buildGovernedMcpConfig({ assetRoot: moduleAssetRoot });
            if (Object.keys(governed.mergePayload.mcpServers).length) ops.push(fileOp({
              kind: 'merge-json',
              moduleId: module.id,
              sourceRel: governed.sourceRel,
              sourcePath: governed.sourcePath,
              dest: path.join(root, 'settings', 'mcp.json'),
              strategy: 'merge-json+mcp-governance',
              mergePayload: governed.mergePayload,
            }));
            for (const skipped of governed.skipped) {
              ops.push(fileOp({
                kind: 'skip',
                moduleId: module.id,
                sourceRel: skipped.sourceRel,
                dest: null,
                strategy: 'skip',
                reason: skipped.reason,
              }));
            }
            break;
          }
          default:
            break;
        }
      }
    }

    if (needsRootInstruction) {
      ops.unshift(appendMarkdownOp({
        moduleId: 'baseline-rules',
        sourceRel: 'kiro/steering/company-agent-deploy.md',
        dest: path.join(root, 'steering', 'company-agent-deploy.md'),
        markerId: 'kiro',
        content: kiroRootInstructionContent(),
      }));
    }

    return ops;
  },
});
