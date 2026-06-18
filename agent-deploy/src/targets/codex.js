// Codex adapter.
// Project layout follows the rollout plan: AGENTS.md at the repo root,
// shared rules/skills under .agents/, Codex-specific agents/config under
// .codex/, and install-state under .agent-deploy/.
import path from 'node:path';
import {
  appendMarkdownOp,
  createAdapter,
  mergeTomlOp,
  mirrorOps,
  skipOp,
} from './helpers.js';

function codexInstructionDest(input, adapter) {
  const base = adapter.baseRoot(input);
  if (adapter.scopeOf(input) === 'home') return path.join(adapter.resolveRoot(input), 'AGENTS.md');
  return path.join(base, 'AGENTS.md');
}

function codexAgentsRoot(input, adapter) {
  return adapter.resolveRoot(input);
}

function codexSharedRoot(input, adapter) {
  if (adapter.scopeOf(input) === 'home') return adapter.resolveRoot(input);
  return path.join(adapter.baseRoot(input), '.agents');
}

function codexRootInstructionContent(input, adapter) {
  const ruleRoot = adapter.scopeOf(input) === 'home' ? '.codex/rules' : '.agents/rules';
  const skillRoot = adapter.scopeOf(input) === 'home' ? '.codex/skills' : '.agents/skills';
  const agentRoot = '.codex/agents';
  return `# Company Codex Instructions

This managed block was installed by agent-deploy. Follow the company rules and workflows installed in this project before making changes.

## Installed rule sources

- Load and follow all Markdown rules under \`${ruleRoot}/\`.
- Use installed skills under \`${skillRoot}/\` when their descriptions match the task.
- Use Codex subagent definitions under \`${agentRoot}/\` when a task calls for a specialized reviewer or planner.

## Operating requirements

- Treat project scope as authoritative for this repository.
- Preserve semantic equivalence with other supported harnesses.
- Do not ignore unsupported capabilities silently; rely on install-state skip reasons.
- Keep security, source attribution, and architecture rules active for every implementation task.`;
}

function codexMcpPayload(source) {
  const servers = {};
  for (const [name, server] of Object.entries(source.mcpServers || {})) {
    const next = { enabled: true };
    if (server.url) next.url = server.url;
    if (server.command) next.command = server.command;
    if (server.args) next.args = server.args;
    if (server.env) next.env = server.env;
    servers[name] = next;
  }
  return { mcp_servers: servers };
}

export default createAdapter({
  id: 'codex',
  target: 'codex',
  scope: 'project',
  rootSegments: ['.codex'],
  stateSegments: ['.agent-deploy', 'install-state.json'],
  planOperations(input, adapter) {
    const { assetRoot } = input;
    const sharedRoot = codexSharedRoot(input, adapter);
    const codexRoot = codexAgentsRoot(input, adapter);
    const ops = [];
    let needsRootInstruction = false;

    for (const module of input.modules) {
      for (const sourceRel of module.paths) {
        const category = sourceRel.split('/')[0];
        switch (category) {
          case 'rules':
            if (module.id === 'baseline-rules') needsRootInstruction = true;
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot, sourceRel, destRoot: sharedRoot }));
            break;
          case 'skills':
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot, sourceRel, destRoot: sharedRoot }));
            break;
          case 'agents':
            ops.push(...mirrorOps({ moduleId: module.id, assetRoot, sourceRel, destRoot: codexRoot }));
            break;
          case 'commands':
            ops.push(skipOp({
              moduleId: module.id,
              sourceRel,
              reason: 'Codex adapter has no native slash-command install surface; use AGENTS.md and installed skills instead',
            }));
            break;
          case 'mcp': {
            const op = mergeTomlOp({
              moduleId: module.id,
              assetRoot,
              sourceRel: 'mcp/servers.json',
              dest: path.join(codexRoot, 'config.toml'),
              convert: codexMcpPayload,
            });
            if (op) ops.push(op);
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
        sourceRel: 'codex/AGENTS.md',
        dest: codexInstructionDest(input, adapter),
        markerId: 'codex',
        content: codexRootInstructionContent(input, adapter),
      }));
    }

    return ops;
  },
});
