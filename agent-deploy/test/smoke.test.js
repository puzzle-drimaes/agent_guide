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
import { validateInstallState } from '../src/state.js';
import { checkAssetSchemas } from '../scripts/check-asset-schema.js';
import { checkCatalogParity } from '../scripts/check-catalog-parity.js';
import { scanExternals } from '../src/packs/externals-scanner.js';
import { validatePackRoot } from '../src/packs/pack-validator.js';
import { calculatePackDigest } from '../src/packs/digest.js';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/cli.js');
const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

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
  assert.ok(fs.existsSync(path.join(root, 'skills/company-plan/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, 'skills/company-code-review/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, 'skills/spec-writing/SKILL.md')));
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
  const result = applyPlan(plan);

  assertCommonCoreRules(path.join(project, '.agents'));
  assertDeveloperCoreRules(path.join(project, '.agents'));
  assertDeveloperWorkflowSkills(path.join(project, '.agents'));
  assert.ok(fs.existsSync(path.join(project, '.codex/agents/code-reviewer.md')));
  assert.ok(fs.existsSync(path.join(project, '.codex/agents/architecture-reviewer.md')));
  // prompts mirror under the shared .agents/ root (parity with Claude/Gemini)
  assert.ok(fs.existsSync(path.join(project, '.agents/prompts/_universal-template.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/prompts/dev-implementation.md')));

  const toml = fs.readFileSync(path.join(project, '.codex/config.toml'), 'utf8');
  assert.match(toml, /\[mcp_servers\.company-docs\]/);
  assert.match(toml, /url = "https:\/\/mcp\.internal\.example\.com\/docs"/);
  assert.match(toml, /\[mcp_servers\.filesystem\]/);
  assert.match(toml, /command = "npx"/);

  const skipOps = plan.operations.filter((o) => o.kind === 'skip');
  assert.ok(skipOps.some((o) => o.sourceRel === 'commands' && /no native slash-command/.test(o.reason)));
  assert.deepEqual(validateInstallState(result.state), []);
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

test('apply --backup preserves existing files and records backup provenance', () => {
  const project = tmpProject();
  const plan = buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });

  fs.appendFileSync(path.join(project, 'AGENTS.md'), '\nUser note before backup.\n');
  const result = applyPlan(plan, {
    installedAt: '2026-01-01T00:00:01Z',
    backup: true,
  });

  const backupRoot = path.join(project, '.agent-deploy/backups/2026-01-01T00-00-01Z');
  const agentsBackup = path.join(backupRoot, 'AGENTS.md');
  const stateBackup = path.join(backupRoot, '.agent-deploy/install-state.json');
  assert.ok(fs.existsSync(agentsBackup), 'existing AGENTS.md should be backed up');
  assert.ok(fs.existsSync(stateBackup), 'previous install-state should be backed up');
  assert.match(fs.readFileSync(agentsBackup, 'utf8'), /User note before backup/);
  assert.equal(JSON.parse(fs.readFileSync(stateBackup, 'utf8')).schemaVersion, 'agentdeploy.install.v1');
  assert.equal(result.state.backup.enabled, true);
  assert.equal(result.state.backup.root, backupRoot);
  assert.ok(result.state.backup.entries.some((entry) => entry.source.endsWith('AGENTS.md')));
  assert.ok(result.state.backup.entries.some((entry) => entry.reason === 'install-state'));
  assert.deepEqual(validateInstallState(result.state), []);
});

test('conflict policy skip records skipped existing destinations without rewriting them', () => {
  const project = tmpProject();
  const plan = buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });
  fs.appendFileSync(path.join(project, 'AGENTS.md'), '\nUser note that should survive skip policy.\n');

  const result = applyPlan(plan, {
    installedAt: '2026-01-01T00:00:01Z',
    conflictPolicy: 'skip',
  });

  assert.match(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), /User note that should survive skip policy/);
  assert.equal(result.state.conflictPolicy.policy, 'skip');
  assert.ok(result.state.conflictPolicy.decisions.some((decision) => (
    decision.decision === 'skip'
      && decision.kind === 'append-markdown'
      && decision.dest.endsWith('AGENTS.md')
  )));
  assert.ok(result.state.operations.some((op) => (
    op.kind === 'skip'
      && op.strategy.endsWith('+conflict-skip')
      && /conflict policy 'skip'/.test(op.reason)
  )));
  assert.deepEqual(validateInstallState(result.state), []);
});

test('conflict policy conflict-error fails before backup or writes', () => {
  const project = tmpProject();
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Existing user instructions\n');
  const plan = buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project });

  assert.throws(
    () => applyPlan(plan, {
      installedAt: '2026-01-01T00:00:00Z',
      backup: true,
      conflictPolicy: 'conflict-error',
    }),
    /conflict policy 'conflict-error' rejected/,
  );
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), '# Existing user instructions\n');
  assert.ok(!fs.existsSync(path.join(project, '.agent-deploy')), 'failed conflict policy must not create backup/state');
});

test('conflict policy append allows only append-markdown conflicts', () => {
  const project = tmpProject();
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Existing user instructions\n');
  const appendOnlyPlan = buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project });
  appendOnlyPlan.operations = appendOnlyPlan.operations.filter((op) => op.kind === 'append-markdown');

  const result = applyPlan(appendOnlyPlan, {
    installedAt: '2026-01-01T00:00:00Z',
    conflictPolicy: 'append',
  });
  assert.equal(result.state.conflictPolicy.policy, 'append');
  assert.ok(result.state.conflictPolicy.decisions.every((decision) => decision.kind === 'append-markdown'));

  fs.mkdirSync(path.join(project, '.agents/rules/common'), { recursive: true });
  fs.writeFileSync(path.join(project, '.agents/rules/common/security.md'), '# existing security\n');
  const fullPlan = buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project });
  assert.throws(
    () => applyPlan(fullPlan, { conflictPolicy: 'append' }),
    /append policy does not allow copy-file/,
  );
});

test('conflict policy merge-json and merge-toml allow matching merge conflicts', () => {
  const claudeProject = tmpProject();
  fs.writeFileSync(path.join(claudeProject, '.mcp.json'), JSON.stringify({ mcpServers: { existing: { command: 'x' } } }));
  const jsonResult = applyPlan(
    buildPlan({ target: 'claude', moduleIds: ['mcp-baseline'], projectRoot: claudeProject }),
    { installedAt: '2026-01-01T00:00:00Z', conflictPolicy: 'merge-json' },
  );
  assert.equal(jsonResult.state.conflictPolicy.policy, 'merge-json');
  assert.ok(jsonResult.state.conflictPolicy.decisions.some((decision) => decision.kind === 'merge-json'));

  const codexProject = tmpProject();
  fs.mkdirSync(path.join(codexProject, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(codexProject, '.codex/config.toml'), 'model = "gpt-5"\n');
  const tomlResult = applyPlan(
    buildPlan({ target: 'codex', moduleIds: ['mcp-baseline'], projectRoot: codexProject }),
    { installedAt: '2026-01-01T00:00:00Z', conflictPolicy: 'merge-toml' },
  );
  assert.equal(tomlResult.state.conflictPolicy.policy, 'merge-toml');
  assert.ok(tomlResult.state.conflictPolicy.decisions.some((decision) => decision.kind === 'merge-toml'));
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
  assert.ok(fs.existsSync(path.join(project, '.gemini/prompts/_universal-template.md')));
  assert.ok(fs.existsSync(path.join(project, '.gemini/prompts/dev-implementation.md')));

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
  // prompt-asset is cross-role knowledge capture: present from the core profile up
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/prompt-asset/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/external-doc-asset/SKILL.md')));
  // universal skeleton ships with the skill; starter task templates ship with prompt-library
  assert.ok(fs.existsSync(path.join(project, '.claude/prompts/_universal-template.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/prompts/dev-implementation.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/prompts/research.md')));
});

test('apply --dry-run --json emits valid JSON on stdout (no trailing text)', () => {
  const project = tmpProject();
  const out = execFileSync('node', [
    CLI, 'apply', '--dry-run', '--json', '--backup',
    '--target', 'claude', '--profile', 'core', '--project', project,
  ], { encoding: 'utf8' });
  const parsed = JSON.parse(out); // throws if the dry-run note leaked into stdout
  assert.ok(Array.isArray(parsed));
  assert.ok(!fs.existsSync(path.join(project, '.claude')), 'dry-run wrote nothing');
  assert.ok(!fs.existsSync(path.join(project, '.agent-deploy')), 'dry-run backup wrote nothing');
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

test('update --dry-run --json reads install-state and reports possible user modifications', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project }), {
    installedAt: '2026-01-01T00:00:00Z',
  });
  fs.appendFileSync(path.join(project, '.agents/rules/common/security.md'), '\nUser local security note.\n');

  const out = execFileSync('node', [
    CLI, 'update', '--dry-run', '--json',
    '--target', 'codex', '--project', project,
  ], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.request.profile, 'minimal');
  assert.ok(parsed.summary['possible-user-modified'] >= 1);
  assert.ok(parsed.items.some((item) => (
    item.status === 'possible-user-modified'
      && item.dest.endsWith('.agents/rules/common/security.md')
  )));
  assert.match(fs.readFileSync(path.join(project, '.agents/rules/common/security.md'), 'utf8'), /User local security note/);
});

test('update rejects missing state and non-dry-run execution', () => {
  const project = tmpProject();

  assert.throws(
    () => execFileSync('node', [
      CLI, 'update', '--dry-run',
      '--target', 'codex', '--profile', 'minimal', '--project', project,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
    /install-state not found/,
  );

  applyPlan(buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project }));
  assert.throws(
    () => execFileSync('node', [
      CLI, 'update',
      '--target', 'codex', '--profile', 'minimal', '--project', project,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
    /update currently supports --dry-run only/,
  );
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

test('apply validates install-state before writing files', () => {
  const project = tmpProject();
  const plan = buildPlan({ target: 'codex', profile: 'minimal', projectRoot: project });
  plan.operations[0].scope = 'workspace';

  assert.throws(() => applyPlan(plan), /install-state validation failed/);
  assert.ok(!fs.existsSync(path.join(project, 'AGENTS.md')), 'invalid state must fail before file writes');
  assert.ok(!fs.existsSync(path.join(project, '.agent-deploy/install-state.json')), 'invalid state must not be written');
});

test('claude business profile installs non-developer skills, no developer-only assets', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'claude', profile: 'business', projectRoot: project }));

  assertCommonCoreRules(path.join(project, '.claude'));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/meeting-summary/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/customer-response/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/prompts/_universal-template.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/prompts/business/faq.md')));
  // business gets business-prompts, not product-prompts
  assert.ok(!fs.existsSync(path.join(project, '.claude/prompts/product/prd.md')));
  // business is non-developer: no architecture rules / dev workflow skills
  assert.ok(!fs.existsSync(path.join(project, '.claude/rules/developer/architecture.md')));
  assert.ok(!fs.existsSync(path.join(project, '.claude/skills/spec-writing/SKILL.md')));
});

test('claude product profile installs product skills, no business-only assets', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'claude', profile: 'product', projectRoot: project }));

  assertCommonCoreRules(path.join(project, '.claude'));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/product-spec/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/meeting-summary/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.claude/skills/customer-response/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/prompts/product/prd.md')));
  assert.ok(!fs.existsSync(path.join(project, '.claude/prompts/business/faq.md')));
  assert.ok(!fs.existsSync(path.join(project, '.claude/rules/developer/architecture.md')));
});

test('codex product profile installs product-spec + meeting-summary under shared root', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'codex', profile: 'product', projectRoot: project }));

  assertCommonCoreRules(path.join(project, '.agents'));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/product-spec/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/meeting-summary/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.agents/skills/customer-response/SKILL.md')));
  // product-prompts mirror under the shared .agents/ root
  assert.ok(fs.existsSync(path.join(project, '.agents/prompts/product/prd.md')));
  assert.ok(!fs.existsSync(path.join(project, '.agents/prompts/business/faq.md')));
});

test('codex business profile installs business skills under shared root', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'codex', profile: 'business', projectRoot: project }));

  assertCommonCoreRules(path.join(project, '.agents'));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/meeting-summary/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/customer-response/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.agents/skills/product-spec/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/prompts/business/faq.md')));
  assert.ok(!fs.existsSync(path.join(project, '.agents/prompts/product/prd.md')));
});

test('gemini product profile installs product skills and prompts', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'gemini', profile: 'product', projectRoot: project }));

  assertCommonCoreRules(path.join(project, '.gemini'));
  assert.ok(fs.existsSync(path.join(project, '.gemini/skills/product-spec/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.gemini/skills/meeting-summary/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.gemini/skills/customer-response/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.gemini/prompts/product/prd.md')));
  assert.ok(!fs.existsSync(path.join(project, '.gemini/prompts/business/faq.md')));
});

test('gemini business profile installs business skills and prompts', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'gemini', profile: 'business', projectRoot: project }));

  assertCommonCoreRules(path.join(project, '.gemini'));
  assert.ok(fs.existsSync(path.join(project, '.gemini/skills/meeting-summary/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.gemini/skills/customer-response/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.gemini/skills/product-spec/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.gemini/prompts/business/faq.md')));
  assert.ok(!fs.existsSync(path.join(project, '.gemini/prompts/product/prd.md')));
});

test('claude governance profile installs governance skills + prompt/external document curation', () => {
  const project = tmpProject();
  applyPlan(buildPlan({ target: 'claude', profile: 'governance', projectRoot: project }));

  assertCommonCoreRules(path.join(project, '.claude'));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/quarterly-review/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/kpi-report/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/prompt-db-curation/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/external-doc-asset/SKILL.md')));
  // prompt-db-curation depends on prompt-asset, so the capture skill is pulled in too
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/prompt-asset/SKILL.md')));
  // governance is non-developer: no architecture rules
  assert.ok(!fs.existsSync(path.join(project, '.claude/rules/developer/architecture.md')));
});

test('asset schema guard passes for all shipped assets', () => {
  const { errors, checked } = checkAssetSchemas();
  assert.deepEqual(errors, [], `unexpected asset schema errors:\n${errors.join('\n')}`);
  assert.ok(checked >= 14, `expected to check shipped assets, got ${checked}`);
});

test('asset schema guard catches malformed frontmatter', () => {
  const root = tmpProject();
  // agent: missing required `description`, an unknown key, and a name that
  // does not match the filename -> three distinct violations.
  fs.mkdirSync(path.join(root, 'agents'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'agents/bad-agent.md'),
    '---\nname: wrong-name\ntools: ["Read"]\ncolor: blue\n---\n\n# x\n'
  );
  // skill dir with no SKILL.md, plus a skill whose array key is malformed.
  fs.mkdirSync(path.join(root, 'skills/no-file'), { recursive: true });
  fs.mkdirSync(path.join(root, 'skills/good'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'skills/good/SKILL.md'),
    '---\nname: good\ndescription:\n---\n\n# y\n'
  );
  // rule with no frontmatter is valid; rule with an unknown key is not.
  fs.mkdirSync(path.join(root, 'rules/common'), { recursive: true });
  fs.writeFileSync(path.join(root, 'rules/common/plain.md'), '# plain rule, no frontmatter\n');
  fs.writeFileSync(path.join(root, 'rules/common/bad.md'), '---\nscope: project\n---\n\n# z\n');

  const { errors } = checkAssetSchemas(root);
  const joined = errors.join('\n');
  assert.match(joined, /bad-agent\.md: missing required key 'description'/);
  assert.match(joined, /bad-agent\.md: unknown frontmatter key 'color'/);
  assert.match(joined, /bad-agent\.md: name 'wrong-name' must match 'bad-agent'/);
  assert.match(joined, /skills\/no-file: missing SKILL\.md/);
  assert.match(joined, /good\/SKILL\.md: 'description' must be a non-empty string/);
  assert.match(joined, /common\/bad\.md: unknown frontmatter key 'scope'/);
  // the plain frontmatter-less rule must NOT produce an error
  assert.ok(!/plain\.md/.test(joined), `plain rule should pass:\n${joined}`);
});

test('asset schema guard reports draft metadata schema warnings without blocking', () => {
  const root = tmpProject();
  fs.mkdirSync(path.join(root, 'prompts/product'), { recursive: true });
  fs.writeFileSync(path.join(root, 'prompts/product/no-frontmatter.md'), '# prompt without metadata\n');
  fs.writeFileSync(
    path.join(root, 'prompts/product/partial.md'),
    '---\nid: Bad ID\nasset_type: template\ntitle: Partial\ndescription: Partial prompt\naudience: ["product"]\nowner: product-team\nstability: stable\n---\n\n# prompt\n'
  );

  const { errors, warnings } = checkAssetSchemas(root);
  const joined = warnings.join('\n');
  assert.deepEqual(errors, []);
  assert.match(joined, /no-frontmatter\.md: missing draft asset metadata frontmatter/);
  assert.match(joined, /partial\.md: 'id' must match pattern/);
  assert.match(joined, /partial\.md: asset_type 'template' should match 'prompt'/);
});

test('catalog parity guard accepts matching file, frontmatter, module, and profile data', () => {
  const root = tmpProject();
  fs.mkdirSync(path.join(root, 'assets/prompts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'manifests'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'assets/prompts/a.md'),
    '---\nid: prompt-a\nasset_type: prompt\ntitle: Prompt A\ndescription: Example prompt\naudience: ["product"]\nowner: product-team\nstability: stable\n---\n\n# Prompt A\n'
  );
  fs.writeFileSync(
    path.join(root, 'assets/catalog.draft.json'),
    JSON.stringify({
      schemaVersion: 'agentdeploy.assetCatalog.v1',
      generatedAt: null,
      assets: [
        {
          id: 'prompt-a',
          assetType: 'prompt',
          title: 'Prompt A',
          description: 'Example prompt',
          path: 'prompts/a.md',
          moduleIds: ['prompt-module'],
          profiles: ['product'],
          audience: ['product'],
          stability: 'stable',
          owner: 'product-team',
          tags: ['example'],
          reviewStatus: 'approved',
        },
      ],
    })
  );
  fs.writeFileSync(
    path.join(root, 'manifests/modules.json'),
    JSON.stringify({ version: 1, modules: [{ id: 'prompt-module', paths: ['prompts/a.md'], dependencies: [] }] })
  );
  fs.writeFileSync(path.join(root, 'manifests/profiles.json'), JSON.stringify({ version: 1, profiles: { product: ['prompt-module'] } }));

  const { errors, warnings, checked } = checkCatalogParity(root);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(checked, 1);
});

test('catalog parity guard catches catalog/module/profile drift', () => {
  const root = tmpProject();
  fs.mkdirSync(path.join(root, 'assets/prompts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'manifests'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets/prompts/a.md'), '# prompt without metadata\n');
  fs.writeFileSync(
    path.join(root, 'assets/catalog.draft.json'),
    JSON.stringify({
      schemaVersion: 'agentdeploy.assetCatalog.v1',
      generatedAt: null,
      assets: [
        {
          id: 'prompt-a',
          assetType: 'prompt',
          title: 'Prompt A',
          description: 'Example prompt',
          path: 'prompts/a.md',
          moduleIds: ['wrong-module'],
          profiles: ['ghost'],
          audience: ['product'],
          stability: 'stable',
          owner: 'product-team',
          reviewStatus: 'approved',
        },
      ],
    })
  );
  fs.writeFileSync(
    path.join(root, 'manifests/modules.json'),
    JSON.stringify({ version: 1, modules: [{ id: 'prompt-module', paths: ['prompts/a.md'], dependencies: [] }] })
  );
  fs.writeFileSync(path.join(root, 'manifests/profiles.json'), JSON.stringify({ version: 1, profiles: { product: ['prompt-module'] } }));

  const { errors, warnings } = checkCatalogParity(root);
  const errorText = errors.join('\n');
  assert.match(errorText, /unknown module 'wrong-module'/);
  assert.match(errorText, /unknown profile 'ghost'/);
  assert.match(warnings.join('\n'), /has no draft frontmatter to compare/);
});

test('asset pack validator accepts a normal project-local pack', () => {
  const packRoot = path.join(FIXTURES, 'packs/valid-pack');
  const result = validatePackRoot(packRoot);
  assert.equal(result.ok, true, `unexpected pack errors:\n${result.errors.join('\n')}`);
  assert.equal(result.packJson.id, 'team-valid-pack');
  assert.match(result.digest, /^sha256:[a-f0-9]{64}$/);
});

test('asset pack digest is stable and ignores VCS/OS temporary files', () => {
  const packRoot = path.join(FIXTURES, 'packs/valid-pack');
  const copiedPackRoot = path.join(tmpProject(), 'valid-pack-copy');
  fs.cpSync(packRoot, copiedPackRoot, { recursive: true });
  fs.mkdirSync(path.join(copiedPackRoot, '.git'), { recursive: true });
  fs.writeFileSync(path.join(copiedPackRoot, '.git/config'), '[core]\nrepositoryformatversion = 0\n');
  fs.writeFileSync(path.join(copiedPackRoot, '.DS_Store'), 'macOS finder metadata');
  fs.writeFileSync(path.join(copiedPackRoot, 'assets/prompts/team-note.md~'), 'editor backup');

  assert.equal(
    calculatePackDigest(copiedPackRoot).digest,
    calculatePackDigest(packRoot).digest,
  );
});

test('asset pack validator rejects missing pack.json', () => {
  const packRoot = path.join(FIXTURES, 'packs/missing-pack-json');
  const result = validatePackRoot(packRoot);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /missing pack\.json/);
});

test('asset pack validator rejects module path escape', () => {
  const packRoot = path.join(FIXTURES, 'packs/path-escape');
  const result = validatePackRoot(packRoot);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /path '\.\.\/escape\.md' must stay under assets\//);
});

test('asset pack validator rejects non-shared default profile extensions', () => {
  const packRoot = path.join(FIXTURES, 'packs/project-local-extension');
  const result = validatePackRoot(packRoot);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /defaultProfileExtensions is only allowed for shared-approved packs/);

  const candidateRoot = path.join(tmpProject(), 'candidate-extension');
  fs.cpSync(packRoot, candidateRoot, { recursive: true });
  const candidatePackJson = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'pack.json'), 'utf8'));
  candidatePackJson.packType = 'candidate';
  candidatePackJson.reviewStatus = 'candidate';
  fs.writeFileSync(path.join(candidateRoot, 'pack.json'), `${JSON.stringify(candidatePackJson, null, 2)}\n`);

  const candidateResult = validatePackRoot(candidateRoot);
  assert.equal(candidateResult.ok, false);
  assert.match(candidateResult.errors.join('\n'), /defaultProfileExtensions is only allowed for shared-approved packs/);
});

test('asset pack validator reports id and destination collision options', () => {
  const packRoot = path.join(FIXTURES, 'packs/id-collision');
  const result = validatePackRoot(packRoot);
  const errors = result.errors.join('\n');
  assert.equal(result.ok, false);
  assert.match(errors, /module id 'baseline-rules' already exists/);
  assert.ok(result.conflicts.some((item) => item.type === 'module-id'));
  assert.ok(result.conflicts.some((item) => item.type === 'asset-id'));
  assert.ok(result.conflicts.some((item) => item.choices.includes('keep-existing')));
  assert.ok(result.conflicts.some((item) => item.choices.includes('add-namespaced')));
  assert.ok(result.conflicts.some((item) => item.choices.includes('rename-proposed')));
  assert.ok(result.conflicts.some((item) => item.choices.includes('replace-existing')));
});

test('externals scanner classifies Markdown and drafts candidate metadata', () => {
  const result = scanExternals(path.join(FIXTURES, 'externals'), { packId: 'team-externals' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.assets.length, 3);
  assert.deepEqual(new Set(result.assets.map((asset) => asset.assetType)), new Set(['skill', 'doc', 'prompt']));
  assert.equal(result.pack.packJson.packType, 'candidate');
  assert.equal(result.pack.packJson.reviewStatus, 'candidate');
  assert.ok(result.pack.modulesDoc.modules.every((module) => module.id.startsWith('team-externals-')));
  assert.ok(result.pack.profilesDoc.profiles.candidate.length === 3);
});

test('check-pack CLI emits JSON for valid packs and externals scans', () => {
  const packOut = execFileSync('node', [
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scripts/check-pack.js'),
    '--pack', path.join(FIXTURES, 'packs/valid-pack'),
    '--json',
  ], { encoding: 'utf8' });
  assert.equal(JSON.parse(packOut).ok, true);

  const externalsOut = execFileSync('node', [
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scripts/check-pack.js'),
    '--externals', path.join(FIXTURES, 'externals'),
    '--json',
  ], { encoding: 'utf8' });
  assert.equal(JSON.parse(externalsOut).assets.length, 3);
});

test('planner composes explicit pack modules into the install plan', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/valid-pack');
  const plan = buildPlan({
    target: 'codex',
    moduleIds: ['team-valid-pack-team-note-module'],
    packPaths: [packRoot],
    projectRoot: project,
  });

  assert.equal(plan.packs.length, 1);
  assert.equal(plan.packs[0].id, 'team-valid-pack');
  assert.deepEqual(plan.resolution.selected.map((module) => module.id), ['team-valid-pack-team-note-module']);
  assert.ok(plan.operations.some((op) => op.dest.endsWith('.agents/prompts/team-note.md')));
});

test('shared-approved pack extensions are opt-in for builtin profiles', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/shared-approved-extension');

  const withoutExtensions = buildPlan({
    target: 'codex',
    profile: 'developer',
    packPaths: [packRoot],
    projectRoot: project,
  });
  assert.ok(!withoutExtensions.resolution.selected.some((module) => module.id === 'approved-dev-pack-review-prompt-module'));

  const withExtensions = buildPlan({
    target: 'codex',
    profile: 'developer',
    packPaths: [packRoot],
    enablePackExtensions: true,
    projectRoot: project,
  });
  assert.ok(withExtensions.resolution.selected.some((module) => module.id === 'approved-dev-pack-review-prompt-module'));
  assert.ok(withExtensions.operations.some((op) => op.dest?.endsWith('.agents/prompts/review-prompt.md')));
});

test('planner composes pack-local profiles and apply records pack provenance', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/valid-pack');
  const plan = buildPlan({
    target: 'claude',
    profile: 'team-valid',
    packPaths: [packRoot],
    projectRoot: project,
  });
  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });

  assert.ok(fs.existsSync(path.join(project, '.claude/prompts/team-note.md')));
  const state = JSON.parse(fs.readFileSync(path.join(project, '.claude/agent-install-state.json'), 'utf8'));
  assert.equal(state.source.packs[0].id, 'team-valid-pack');
  assert.equal(state.source.packs[0].packType, 'project-local');
  assert.equal(state.source.packs[0].digest, calculatePackDigest(packRoot).digest);
  assert.equal(state.source.packs[0].root, packRoot);
  assert.equal(state.source.packs[0].source, null);
});

test('conflict resolution file is recorded in install-state provenance', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/valid-pack');
  const packDigest = calculatePackDigest(packRoot).digest;
  const resolutionFile = path.join(tmpProject(), 'conflicts.reviewed.json');
  fs.writeFileSync(
    resolutionFile,
    JSON.stringify({
      conflictResolutions: [
        {
          proposed: '.agent-packs/externals/docs/onboarding-checklist.md',
          conflictsWith: '.agents/shared/team/onboarding-checklist.md',
          decision: 'add-namespaced',
          decidedBy: 'platform-team',
          decidedAt: '2026-06-22',
          reason: 'Keep the existing guide and add a team-specific variant.',
          packId: 'team-valid-pack',
          packDigest,
        },
      ],
    }),
  );

  const out = execFileSync('node', [
    CLI, 'apply',
    '--target', 'claude',
    '--profile', 'team-valid',
    '--pack', packRoot,
    '--conflict-resolution', resolutionFile,
    '--project', project,
  ], { encoding: 'utf8' });
  assert.match(out, /applied/);

  const state = JSON.parse(fs.readFileSync(path.join(project, '.claude/agent-install-state.json'), 'utf8'));
  assert.deepEqual(state.source.conflictResolutions, [
    {
      proposed: '.agent-packs/externals/docs/onboarding-checklist.md',
      conflictsWith: '.agents/shared/team/onboarding-checklist.md',
      decision: 'add-namespaced',
      decidedBy: 'platform-team',
      decidedAt: '2026-06-22',
      reason: 'Keep the existing guide and add a team-specific variant.',
      packId: 'team-valid-pack',
      packDigest,
    },
  ]);
});

test('conflict resolution file rejects invalid decisions before apply', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/valid-pack');
  const resolutionFile = path.join(tmpProject(), 'conflicts.invalid.json');
  fs.writeFileSync(
    resolutionFile,
    JSON.stringify({
      conflictResolutions: [
        {
          proposed: 'a',
          conflictsWith: 'b',
          decision: 'silently-overwrite',
          decidedBy: 'platform-team',
          reason: 'Invalid decision should fail validation.',
        },
      ],
    }),
  );

  let error = null;
  try {
    execFileSync('node', [
      CLI, 'apply',
      '--target', 'claude',
      '--profile', 'team-valid',
      '--pack', packRoot,
      '--conflict-resolution', resolutionFile,
      '--project', project,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error, 'invalid conflict resolution should fail');
  assert.match(error.stderr, /decision must be one of keep-existing, add-namespaced, rename-proposed, replace-existing/);
  assert.ok(!fs.existsSync(path.join(project, '.claude/agent-install-state.json')));
});

test('destination collisions remain fail-closed without an add-namespaced decision', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/destination-collision');

  assert.throws(
    () => buildPlan({
      target: 'codex',
      profile: 'developer',
      moduleIds: ['team-conflict-pack-dev-prompt-module'],
      packPaths: [packRoot],
      projectRoot: project,
    }),
    /destination collision/,
  );
});

test('add-namespaced decision installs colliding pack assets under shared namespace', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/destination-collision');
  const packDigest = calculatePackDigest(packRoot).digest;
  const plan = buildPlan({
    target: 'codex',
    profile: 'developer',
    moduleIds: ['team-conflict-pack-dev-prompt-module'],
    packPaths: [packRoot],
    conflictResolutions: [
      {
        proposed: 'codex:team-conflict-pack-dev-prompt-module',
        conflictsWith: 'codex:prompt-library',
        decision: 'add-namespaced',
        decidedBy: 'platform-team',
        decidedAt: '2026-06-22',
        reason: 'Keep the base implementation prompt and add the team variant under shared namespace.',
        packId: 'team-conflict-pack',
        packDigest,
      },
    ],
    projectRoot: project,
  });

  assert.ok(plan.operations.some((op) => (
    op.moduleId === 'team-conflict-pack-dev-prompt-module'
      && op.dest.endsWith('.agents/shared/team-conflict-pack/prompts/dev-implementation.md')
      && op.strategy.endsWith('+add-namespaced')
  )));

  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });
  assert.ok(fs.existsSync(path.join(project, '.agents/prompts/dev-implementation.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/shared/team-conflict-pack/prompts/dev-implementation.md')));

  const state = JSON.parse(fs.readFileSync(path.join(project, '.agent-deploy/install-state.json'), 'utf8'));
  assert.ok(state.operations.some((op) => (
    op.moduleId === 'team-conflict-pack-dev-prompt-module'
      && op.dest.endsWith('.agents/shared/team-conflict-pack/prompts/dev-implementation.md')
      && op.strategy.endsWith('+add-namespaced')
  )));
  assert.equal(state.source.conflictResolutions[0].decision, 'add-namespaced');
});

test('keep-existing decision skips colliding pack operations and records the reason', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/destination-collision');
  const packDigest = calculatePackDigest(packRoot).digest;
  const keepExistingReason = 'The company dev implementation prompt remains canonical for this project.';
  const plan = buildPlan({
    target: 'codex',
    profile: 'developer',
    moduleIds: ['team-conflict-pack-dev-prompt-module'],
    packPaths: [packRoot],
    conflictResolutions: ['claude', 'cursor', 'codex', 'gemini'].map((target) => ({
      proposed: `${target}:team-conflict-pack-dev-prompt-module`,
      conflictsWith: `${target}:prompt-library`,
      decision: 'keep-existing',
      decidedBy: 'platform-team',
      decidedAt: '2026-06-22',
      reason: keepExistingReason,
      packId: 'team-conflict-pack',
      packDigest,
    })),
    projectRoot: project,
  });

  const skipOp = plan.operations.find((op) => (
    op.kind === 'skip'
      && op.moduleId === 'team-conflict-pack-dev-prompt-module'
      && op.strategy === 'skip+keep-existing'
  ));
  assert.ok(skipOp, 'colliding pack operation should become a skip op');
  assert.match(skipOp.reason, /Skipped by keep-existing conflict decision/);
  assert.match(skipOp.reason, new RegExp(keepExistingReason));
  assert.ok(!plan.operations.some((op) => (
    op.moduleId === 'team-conflict-pack-dev-prompt-module'
      && op.kind === 'copy-file'
      && op.dest?.endsWith('.agents/prompts/dev-implementation.md')
  )));

  applyPlan(plan, { installedAt: '2026-01-01T00:00:00Z' });
  assert.ok(fs.existsSync(path.join(project, '.agents/prompts/dev-implementation.md')));
  assert.ok(!fs.existsSync(path.join(project, '.agents/shared/team-conflict-pack/prompts/dev-implementation.md')));

  const state = JSON.parse(fs.readFileSync(path.join(project, '.agent-deploy/install-state.json'), 'utf8'));
  const stateSkip = state.operations.find((op) => (
    op.kind === 'skip'
      && op.moduleId === 'team-conflict-pack-dev-prompt-module'
      && op.strategy === 'skip+keep-existing'
  ));
  assert.ok(stateSkip, 'install-state should record the keep-existing skip');
  assert.equal(stateSkip.dest, null);
  assert.match(stateSkip.reason, /Skipped by keep-existing conflict decision/);
  assert.match(stateSkip.reason, new RegExp(keepExistingReason));
  assert.equal(state.source.conflictResolutions[0].decision, 'keep-existing');
  assert.equal(state.source.conflictResolutions[0].reason, keepExistingReason);
});

test('CLI dry-run applies shared-approved extensions only with explicit opt-in', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/shared-approved-extension');
  const out = execFileSync('node', [
    CLI, 'apply', '--dry-run',
    '--target', 'codex',
    '--profile', 'developer',
    '--pack', packRoot,
    '--enable-pack-extensions',
    '--project', project,
  ], { encoding: 'utf8' });

  assert.match(out, /pack extensions: enabled/);
  assert.match(out, /approved-dev-pack-review-prompt-module/);
  assert.match(out, /\.agents\/prompts\/review-prompt\.md/);
  assert.ok(!fs.existsSync(path.join(project, '.agents/prompts/review-prompt.md')), 'dry-run wrote nothing');
});

test('CLI dry-run accepts --pack and prints pack operations', () => {
  const project = tmpProject();
  const packRoot = path.join(FIXTURES, 'packs/valid-pack');
  const out = execFileSync('node', [
    CLI, 'apply', '--dry-run',
    '--target', 'codex',
    '--modules', 'team-valid-pack-team-note-module',
    '--pack', packRoot,
    '--project', project,
  ], { encoding: 'utf8' });

  assert.match(out, /packs:\s+team-valid-pack@0\.1\.0/);
  assert.match(out, /team-valid-pack-team-note-module/);
  assert.match(out, /\.agents\/prompts\/team-note\.md/);
  assert.ok(!fs.existsSync(path.join(project, '.agents/prompts/team-note.md')), 'dry-run wrote nothing');
});
