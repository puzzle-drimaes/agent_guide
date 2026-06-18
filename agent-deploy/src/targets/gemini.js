// Gemini adapter.
// Project layout follows the rollout plan: GEMINI.md at the repo root,
// Gemini-oriented fallback assets under .gemini/, and install-state under
// .agent-deploy/.
import path from 'node:path';
import {
  appendMarkdownOp,
  createAdapter,
  mirrorOps,
  skipOp,
} from './helpers.js';

function geminiInstructionDest(input, adapter) {
  const base = adapter.baseRoot(input);
  if (adapter.scopeOf(input) === 'home') return path.join(adapter.resolveRoot(input), 'GEMINI.md');
  return path.join(base, 'GEMINI.md');
}

function geminiRootInstructionContent() {
  const prefix = '.gemini';
  return `# Company Gemini Instructions

This managed block was installed by agent-deploy. Follow the company rules and workflow references installed in this project before making changes.

## Installed instruction sources

- Load and follow all Markdown rules under \`${prefix}/rules/\`.
- Use command prompts under \`${prefix}/commands/\` when the user asks for a matching workflow.
- Use agent role prompts under \`${prefix}/agents/\` as specialized review or planning fallbacks.
- Use skills under \`${prefix}/skills/\` as instruction-backed workflow references.

## Operating requirements

- Treat project scope as authoritative for this repository.
- Preserve semantic equivalence with Codex, Claude, and Cursor installations.
- Do not ignore unsupported capabilities silently; rely on install-state skip reasons.
- Keep security, source attribution, and architecture rules active for every implementation task.`;
}

export default createAdapter({
  id: 'gemini',
  target: 'gemini',
  scope: 'project',
  rootSegments: ['.gemini'],
  stateSegments: ['.agent-deploy', 'install-state.json'],
  planOperations(input, adapter) {
    const { assetRoot } = input;
    const root = adapter.resolveRoot(input);
    const ops = [];
    let needsRootInstruction = false;

    for (const module of input.modules) {
      for (const sourceRel of module.paths) {
        const category = sourceRel.split('/')[0];
        switch (category) {
          case 'rules':
            if (module.id === 'baseline-rules') needsRootInstruction = true;
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot, sourceRel, destRoot: root }));
            break;
          case 'commands':
          case 'agents':
          case 'skills':
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot, sourceRel, destRoot: root }));
            break;
          case 'mcp':
            ops.push(skipOp({
              moduleId: module.id,
              sourceRel,
              reason: 'Gemini MCP config policy is not finalized in this MVP; no MCP files were written',
            }));
            break;
          default:
            break;
        }
      }
    }

    if (needsRootInstruction) {
      ops.unshift(appendMarkdownOp({
        moduleId: 'baseline-rules',
        sourceRel: 'gemini/GEMINI.md',
        dest: geminiInstructionDest(input, adapter),
        markerId: 'gemini',
        content: geminiRootInstructionContent(),
      }));
    }

    return ops;
  },
});
