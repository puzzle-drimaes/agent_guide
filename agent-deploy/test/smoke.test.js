// Round-trip smoke test: plan -> apply -> assert files + provenance + merge.
// Run with: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPlan } from '../src/planner.js';
import { applyPlan } from '../src/apply.js';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/cli.js');

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-deploy-'));
}

function assertCommonCoreRules(root) {
  assert.ok(fs.existsSync(path.join(root, 'rules/common/company-ai-principles.md')));
  assert.ok(fs.existsSync(path.join(root, 'rules/common/knowledge-sharing.md')));
  assert.ok(fs.existsSync(path.join(root, 'rules/common/security.md')));
  assert.ok(fs.existsSync(path.join(root, 'rules/common/source-attribution.md')));
}

function assertDeveloperCoreRules(root) {
  assert.ok(fs.existsSync(path.join(root, 'rules/developer/architecture.md')));
  assert.ok(fs.existsSync(path.join(root, 'rules/developer/git-commit-convention.md')));
  assert.ok(fs.existsSync(path.join(root, 'rules/developer/harness-engineering.md')));
  assert.ok(fs.existsSync(path.join(root, 'rules/developer/spec-driven-development.md')));
}

function assertDeveloperWorkflowSkills(root) {
  assert.ok(fs.existsSync(path.join(root, 'skills/architecture-review/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, 'skills/commit-message-writer/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, 'skills/harness-parity-review/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, 'skills/spec-mode-selector/SKILL.md')));
}

test('claude developer profile installs rules, architecture assets, agent, command, mcp', () => {
  const project = tmpProject();
  const plan = buildPlan({ target: 'claude', profile: 'developer', projectRoot: project });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });

  assertCommonCoreRules(path.join(project, '.claude'));
  assert.ok(fs.existsSync(path.join(project, '.claude/rules/python/coding-style.md')));
  // C2: developer core assets, scoped to developer
  assertDeveloperCoreRules(path.join(project, '.claude'));
  assertDeveloperWorkflowSkills(path.join(project, '.claude'));
  assert.ok(fs.existsSync(path.join(project, '.claude/agents/architecture-reviewer.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/agents/code-reviewer.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/commands/plan.md')));

  const mcp = JSON.parse(fs.readFileSync(path.join(project, '.mcp.json'), 'utf8'));
  assert.ok(mcp.mcpServers['company-docs']);

  const state = JSON.parse(fs.readFileSync(path.join(project, '.claude/agent-install-state.json'), 'utf8'));
  assert.equal(state.schemaVersion, 'agentdeploy.install.v1');
  assert.ok(state.resolution.selectedModules.includes('architecture-rules'));
  assert.ok(state.resolution.selectedModules.includes('harness-engineering-rules'));
  assert.ok(state.resolution.selectedModules.includes('spec-driven-development-rules'));
  assert.ok(state.resolution.selectedModules.includes('commit-convention-rules'));
  // C1: every operation carries scope
  assert.ok(state.operations.every((o) => o.scope === 'project'));
});

test('minimal profile installs common core rules but NOT developer assets', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'claude', profile: 'minimal', projectRoot: project }));
  assertCommonCoreRules(path.join(project, '.claude'));
  assert.ok(!fs.existsSync(path.join(project, '.claude/rules/developer/architecture.md')), 'architecture scoped out of minimal');
  assert.ok(!fs.existsSync(path.join(project, '.claude/rules/developer/spec-driven-development.md')), 'SDD scoped out of minimal');
  assert.ok(!fs.existsSync(path.join(project, '.claude/skills')), 'no skills in minimal');
});

test('codex minimal profile installs AGENTS.md, project rules, and shared install-state', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project }));

  assert.ok(fs.existsSync(path.join(project, 'AGENTS.md')));
  assertCommonCoreRules(path.join(project, '.agents'));
  assert.ok(!fs.existsSync(path.join(project, '.agents/rules/developer/architecture.md')), 'architecture scoped out of minimal');
  assert.ok(!fs.existsSync(path.join(project, '.agents/rules/developer/spec-driven-development.md')), 'SDD scoped out of minimal');
  assert.ok(fs.existsSync(path.join(project, '.agent-deploy/install-state.json')));

  const state = JSON.parse(fs.readFileSync(path.join(project, '.agent-deploy/install-state.json'), 'utf8'));
  assert.equal(state.target.target, 'codex');
  assert.ok(state.operations.some((o) => o.kind === 'append-markdown' && o.dest.endsWith('AGENTS.md')));
});

test('codex developer profile installs skills, agents, mcp toml, and command skip reason', () => {
  const project = tmpProject();
  const plan = buildPlan({ target: 'codex', profile: 'developer', projectRoot: project });
  applyPlan(plan);

  assertCommonCoreRules(path.join(project, '.agents'));
  assertDeveloperCoreRules(path.join(project, '.agents'));
  assertDeveloperWorkflowSkills(path.join(project, '.agents'));
  assert.ok(fs.existsSync(path.join(project, '.codex/agents/code-reviewer.md')));
  assert.ok(fs.existsSync(path.join(project, '.codex/agents/architecture-reviewer.md')));

  const toml = fs.readFileSync(path.join(project, '.codex/config.toml'), 'utf8');
  assert.match(toml, /\[mcp_servers\.company-docs\]/);
  assert.match(toml, /url = "https:\/\/mcp\.internal\.example\.com\/docs"/);
  assert.match(toml, /\[mcp_servers\.filesystem\]/);
  assert.match(toml, /command = "npx"/);

  const skipOps = plan.operations.filter((o) => o.kind === 'skip');
  assert.ok(skipOps.some((o) => o.sourceRel === 'commands' && /no native slash-command/.test(o.reason)));
});

test('codex AGENTS.md managed block and TOML merge are add-only/idempotent', () => {
  const project = tmpProject();
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Existing instructions\n\nKeep this.\n');
  fs.mkdirSync(path.join(project, '.codex'), { recursive: true });
  fs.writeFileSync(
    path.join(project, '.codex/config.toml'),
    'model = "gpt-5"\n\n[mcp_servers.company-docs]\nurl = "https://custom.example"\n',
  );

  const plan = buildPlan({ target: 'codex', profile: 'developer', projectRoot: project });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:01Z' });

  const agents = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.match(agents, /# Existing instructions/);
  assert.equal((agents.match(/agent-deploy:codex:start/g) || []).length, 1);

  const toml = fs.readFileSync(path.join(project, '.codex/config.toml'), 'utf8');
  assert.match(toml, /model = "gpt-5"/);
  assert.match(toml, /url = "https:\/\/custom\.example"/);
  assert.equal((toml.match(/\[mcp_servers\.company-docs\]/g) || []).length, 1);
  assert.match(toml, /\[mcp_servers\.filesystem\]/);
});

test('gemini minimal profile installs GEMINI.md, project rules, and shared install-state', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'gemini', profile: 'minimal', projectRoot: project }));

  assert.ok(fs.existsSync(path.join(project, 'GEMINI.md')));
  assertCommonCoreRules(path.join(project, '.gemini'));
  assert.ok(!fs.existsSync(path.join(project, '.gemini/rules/developer/architecture.md')), 'architecture scoped out of minimal');
  assert.ok(!fs.existsSync(path.join(project, '.gemini/rules/developer/spec-driven-development.md')), 'SDD scoped out of minimal');
  assert.ok(fs.existsSync(path.join(project, '.agent-deploy/install-state.json')));

  const state = JSON.parse(fs.readFileSync(path.join(project, '.agent-deploy/install-state.json'), 'utf8'));
  assert.equal(state.target.target, 'gemini');
  assert.ok(state.operations.some((o) => o.kind === 'append-markdown' && o.dest.endsWith('GEMINI.md')));
});

test('gemini developer profile installs commands, fallback agents/skills, and mcp skip reason', () => {
  const project = tmpProject();
  const plan = buildPlan({ target: 'gemini', profile: 'developer', projectRoot: project });
  applyPlan(plan);

  assertCommonCoreRules(path.join(project, '.gemini'));
  assertDeveloperCoreRules(path.join(project, '.gemini'));
  assert.ok(fs.existsSync(path.join(project, '.gemini/commands/plan.md')));
  assert.ok(fs.existsSync(path.join(project, '.gemini/agents/code-reviewer.md')));
  assert.ok(fs.existsSync(path.join(project, '.gemini/agents/architecture-reviewer.md')));
  assertDeveloperWorkflowSkills(path.join(project, '.gemini'));

  const skipOps = plan.operations.filter((o) => o.kind === 'skip');
  assert.ok(skipOps.some((o) => o.sourceRel === 'mcp' && /MCP config policy/.test(o.reason)));
});

test('gemini GEMINI.md managed block is add-only/idempotent', () => {
  const project = tmpProject();
  fs.writeFileSync(path.join(project, 'GEMINI.md'), '# Existing Gemini instructions\n\nKeep this.\n');

  const plan = buildPlan({ target: 'gemini', profile: 'developer', projectRoot: project });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:01Z' });

  const gemini = fs.readFileSync(path.join(project, 'GEMINI.md'), 'utf8');
  assert.match(gemini, /# Existing Gemini instructions/);
  assert.equal((gemini.match(/agent-deploy:gemini:start/g) || []).length, 1);
  assert.match(gemini, /\.gemini\/commands\//);
  assert.match(gemini, /\.gemini\/skills\//);
});

test('cursor flattens rules to .mdc and records a skip+reason for slash commands', () => {
  const project = tmpProject();
  const plan = buildPlan({ target: 'cursor', profile: 'developer', projectRoot: project });
  applyPlan(plan);

  assert.ok(fs.existsSync(path.join(project, '.cursor/rules/common-security.mdc')));
  assert.ok(fs.existsSync(path.join(project, '.cursor/rules/developer-architecture.mdc')));
  assert.ok(fs.existsSync(path.join(project, '.cursor/rules/developer-harness-engineering.mdc')));
  assert.ok(fs.existsSync(path.join(project, '.cursor/rules/developer-spec-driven-development.mdc')));
  assert.ok(fs.existsSync(path.join(project, '.cursor/mcp.json')));
  assert.ok(!fs.existsSync(path.join(project, '.cursor/commands')), 'nothing written for commands');

  // C1: planning-command is selected for cursor but its capability is unsupported
  // -> recorded as a visible skip op with a reason (not silently dropped).
  const skipOps = plan.operations.filter((o) => o.kind === 'skip');
  assert.ok(skipOps.some((o) => o.sourceRel === 'commands' && o.reason), 'commands recorded as skip+reason');
});

test('merge-json preserves pre-existing user keys', () => {
  const project = tmpProject();
  fs.writeFileSync(
    path.join(project, '.mcp.json'),
    JSON.stringify({ mcpServers: { 'my-personal': { type: 'stdio', command: 'x' } } }),
  );
  applyPlan(buildPlan({ target: 'claude', profile: 'core', projectRoot: project }));

  const mcp = JSON.parse(fs.readFileSync(path.join(project, '.mcp.json'), 'utf8'));
  assert.ok(mcp.mcpServers['my-personal'], 'user key preserved');
  assert.ok(mcp.mcpServers['company-docs'], 'company key added');
});

test('apply --dry-run --json emits valid JSON on stdout (no trailing text)', () => {
  const project = tmpProject();
  const out = execFileSync('node', [
    CLI, 'apply', '--dry-run', '--json',
    '--target', 'claude', '--profile', 'core', '--project', project,
  ], { encoding: 'utf8' });
  const parsed = JSON.parse(out); // throws if the dry-run note leaked into stdout
  assert.ok(Array.isArray(parsed));
  assert.ok(!fs.existsSync(path.join(project, '.claude')), 'dry-run wrote nothing');
});

test('apply --json emits a valid JSON result on stdout', () => {
  const project = tmpProject();
  const out = execFileSync('node', [
    CLI, 'apply', '--json',
    '--target', 'claude', '--profile', 'minimal', '--project', project,
  ], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert.equal(parsed.applied, true);
  assert.ok(parsed.operations >= 1);
});

test('home scope installs into the user-global config dir (fake home)', () => {
  const home = tmpProject(); // a throwaway dir standing in for ~ — never the real home
  const plan = buildPlan({ target: 'claude', profile: 'core', scope: 'home', homeDir: home });
  assert.equal(plan.scope, 'home');
  assert.equal(plan.baseRoot, home);
  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });

  // global config dir, not a project .claude
  assert.ok(fs.existsSync(path.join(home, '.claude/rules/common/security.md')));
  assert.ok(fs.existsSync(path.join(home, '.claude/agents/code-reviewer.md')));
  // home-scope MCP lands in ~/.claude.json (not .mcp.json)
  const mcp = JSON.parse(fs.readFileSync(path.join(home, '.claude.json'), 'utf8'));
  assert.ok(mcp.mcpServers['company-docs']);
  assert.ok(fs.existsSync(path.join(home, '.claude/agent-install-state.json')));
});

test('home scope refuses to escape the home base root', () => {
  const home = tmpProject();
  const plan = buildPlan({ target: 'claude', profile: 'minimal', scope: 'home', homeDir: home });
  // tamper: redirect an op outside the home root
  plan.operations[0].dest = path.join(home, '..', 'escape.md');
  assert.throws(() => applyPlan(plan), /must stay within/);
});
