#!/usr/bin/env node
// agent-deploy CLI — install AI coding agent configs into a project.
//
//   agent-deploy list
//   agent-deploy plan  --target cursor --profile core --project ./myrepo
//   agent-deploy apply --target claude --profile full  --project ./myrepo [--dry-run]
//
// plan/apply are separate; apply --dry-run prints the plan without writing.
import path from 'node:path';
import { listTargets } from './targets/registry.js';
import { loadManifests } from './manifest.js';
import { buildPlan } from './planner.js';
import { applyPlan } from './apply.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(tok);
    }
  }
  return args;
}

function buildRequest(args) {
  // Project-scope by default (per-repo settings). The user-global install is an
  // opt-in: --global (or --scope home), normally invoked via the bundle scripts.
  const scope = args.scope || (args.global ? 'home' : 'project');
  return {
    target: args.target,
    profile: args.profile || null,
    moduleIds: args.modules ? String(args.modules).split(',').map((s) => s.trim()).filter(Boolean) : [],
    packPaths: args.pack ? String(args.pack).split(',').map((s) => path.resolve(s.trim())).filter(Boolean) : [],
    enablePackExtensions: Boolean(args['enable-pack-extensions']),
    scope,
    projectRoot: path.resolve(args.project || process.cwd()),
    homeDir: args.home ? path.resolve(args.home) : undefined,
  };
}

function printPlan(plan, asJson) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(plan.operations, null, 2)}\n`);
    return;
  }
  console.log(`target:   ${plan.adapter.target} (${plan.adapter.id})`);
  console.log(`scope:    ${plan.scope}`);
  console.log(`root:     ${plan.targetRoot}`);
  if (plan.packs.length) {
    console.log(`packs:    ${plan.packs.map((p) => `${p.id}@${p.version}`).join(', ')}`);
    if (plan.request.enablePackExtensions) console.log('pack extensions: enabled');
  }
  console.log(`modules:  ${plan.resolution.selected.map((m) => m.id).join(', ') || '(none)'}`);
  if (plan.resolution.skipped.length) {
    console.log(`skipped:  ${plan.resolution.skipped.map((s) => `${s.id} (${s.reason})`).join(', ')}`);
  }
  console.log(`\n${plan.operations.length} operation(s):`);
  for (const op of plan.operations) {
    if (op.kind === 'skip') {
      console.log(`  ${'skip'.padEnd(10)} ${op.sourceRel}   [${op.moduleId}] — ${op.reason}`);
      continue;
    }
    const rel = path.relative(plan.baseRoot, op.dest);
    console.log(`  ${op.kind.padEnd(10)} ${rel}   [${op.moduleId}]`);
  }
}

function cmdList() {
  const { modulesDoc, profilesDoc } = loadManifests();
  console.log(`targets:  ${listTargets().join(', ')}\n`);
  console.log('profiles:');
  for (const [name, ids] of Object.entries(profilesDoc.profiles)) {
    console.log(`  ${name.padEnd(10)} -> ${ids.join(', ')}`);
  }
  console.log('\nmodules:');
  for (const m of modulesDoc.modules) {
    console.log(`  ${m.id.padEnd(18)} [${m.stability}] targets=${m.targets.join('/')}  ${m.description}`);
  }
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);

  try {
    if (!cmd || cmd === 'help' || args.help) {
      console.log('usage: agent-deploy <list|plan|apply> [--target T] [--profile P] [--modules a,b]\n'
        + '       [--pack DIR[,DIR]] [--enable-pack-extensions] [--scope project|home] [--global] [--home DIR] [--project DIR] [--dry-run] [--json]\n'
        + '  scope project (default): install into a repo (.claude, .cursor … under --project)\n'
        + '  --global / --scope home: install into the user-global config dir (~/.claude, ~/.codex …)\n'
        + '  --pack: compose validated asset pack manifests into the plan; modules/profiles remain explicit\n'
        + '  --enable-pack-extensions: opt in to shared-approved pack defaultProfileExtensions');
      return;
    }
    if (cmd === 'list') return cmdList();

    if (cmd === 'plan') {
      const plan = buildPlan(buildRequest(args));
      return printPlan(plan, Boolean(args.json));
    }

    if (cmd === 'apply') {
      const plan = buildPlan(buildRequest(args));
      if (args['dry-run']) {
        printPlan(plan, Boolean(args.json));
        // Human note goes to stderr so `--json` keeps stdout valid JSON.
        console.error('\n(dry-run: nothing written)');
        return;
      }
      const result = applyPlan(plan);
      if (args.json) {
        process.stdout.write(`${JSON.stringify({
          applied: true,
          operations: result.operations,
          statePath: result.statePath,
        }, null, 2)}\n`);
      } else {
        console.log(`applied ${result.operations} operation(s) (scope: ${plan.scope}).`);
        console.log(`state:  ${path.relative(plan.baseRoot, result.statePath)}`);
      }
      return;
    }

    console.error(`unknown command: ${cmd}`);
    process.exitCode = 1;
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
