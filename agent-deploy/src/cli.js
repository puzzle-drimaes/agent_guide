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
import { readConflictResolutionsFile } from './packs/conflict-resolutions.js';
import { resolveConflictPolicy } from './conflict-policy.js';
import { buildUpdateDryRun, applyUpdate } from './update.js';

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
    conflictResolutions: args['conflict-resolution']
      ? readConflictResolutionsFile(args['conflict-resolution'])
      : [],
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
  if (plan.conflictResolutions.length) {
    console.log(`conflict resolutions: ${plan.conflictResolutions.length} recorded`);
  }
  if (plan.conflictPolicy) {
    console.log(`conflict policy: ${plan.conflictPolicy.policy}`);
    if (plan.conflictPolicy.decisions.length) {
      console.log(`conflicts: ${plan.conflictPolicy.decisions.length} decision(s)`);
    }
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

function printUpdateReport(report, asJson) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  console.log(`update dry-run: ${report.target.target} (${report.target.scope})`);
  console.log(`state: ${report.statePath}`);
  console.log(`profile: ${report.request.profile || '(none)'}`);
  console.log('summary:');
  for (const [status, count] of Object.entries(report.summary)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log('\nmanaged operation diff:');
  for (const item of report.items) {
    const rel = item.dest ? path.relative(report.target.root, item.dest) : '(none)';
    console.log(`  ${item.status.padEnd(22)} ${item.kind.padEnd(15)} ${rel} [${item.moduleId}]`);
  }
}

function printUpdateResult(result, asJson) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify({
      updated: true,
      operations: result.operations,
      statePath: result.statePath,
      onUserModified: result.onUserModified,
      userModified: result.userModified.map((item) => item.dest),
      backup: {
        enabled: result.backup.enabled,
        root: result.backup.root,
        entries: result.backup.entries.length,
      },
      conflictPolicy: {
        policy: result.conflictPolicy.policy,
        decisions: result.conflictPolicy.decisions.length,
      },
    }, null, 2)}\n`);
    return;
  }

  const root = result.baseRoot;
  console.log(`updated ${result.operations} operation(s) (scope: ${result.state.target.scope}).`);
  console.log(`state:  ${path.relative(root, result.statePath)}`);
  console.log(`conflict policy: ${result.conflictPolicy.policy} (${result.conflictPolicy.decisions.length} decision(s))`);
  if (result.userModified.length) {
    console.log(`user-modified (${result.onUserModified}): ${result.userModified.length} file(s)`);
  }
  if (result.backup.enabled) {
    console.log(`backup: ${path.relative(root, result.backup.root)} (${result.backup.entries.length} file(s))`);
  }
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);

  try {
    if (!cmd || cmd === 'help' || args.help) {
      console.log('usage: agent-deploy <list|plan|apply|update> [--target T] [--profile P] [--modules a,b]\n'
        + '       [--pack DIR[,DIR]] [--enable-pack-extensions] [--conflict-resolution FILE]\n'
        + '       [--scope project|home] [--global] [--home DIR] [--project DIR]\n'
        + '       [--backup] [--conflict-policy POLICY] [--dry-run] [--json]\n'
        + '  scope project (default): install into a repo (.claude, .cursor … under --project)\n'
        + '  --global / --scope home: install into the user-global config dir (~/.claude, ~/.codex …)\n'
        + '  --pack: compose validated asset pack manifests into the plan; modules/profiles remain explicit\n'
        + '  --enable-pack-extensions: opt in to shared-approved pack defaultProfileExtensions\n'
        + '  --conflict-resolution: JSON file of reviewed conflict decisions to record in install-state\n'
        + '  --backup: copy existing write targets into a timestamped backup directory before apply\n'
        + '  --conflict-policy: managed-overwrite (default), skip, append, merge-json, merge-toml, conflict-error\n'
        + '  --on-user-modified: fail (default), skip, overwrite — how update treats drifted managed files\n'
        + '  update --dry-run: reads install-state and prints a managed-file diff (no writes)\n'
        + '  update: refreshes managed files from install-state; fail-closed on user-modified drift');
      return;
    }
    if (cmd === 'list') return cmdList();

    if (cmd === 'plan') {
      const plan = buildPlan(buildRequest(args));
      return printPlan(plan, Boolean(args.json));
    }

    if (cmd === 'apply') {
      const plan = buildPlan(buildRequest(args));
      const conflictPolicy = args['conflict-policy'] || 'managed-overwrite';
      if (args['dry-run']) {
        const conflictPreview = resolveConflictPolicy(plan.operations, { policy: conflictPolicy });
        printPlan({
          ...plan,
          operations: conflictPreview.operations,
          conflictPolicy: conflictPreview.record,
        }, Boolean(args.json));
        // Human note goes to stderr so `--json` keeps stdout valid JSON.
        console.error('\n(dry-run: nothing written)');
        return;
      }
      const result = applyPlan(plan, { backup: Boolean(args.backup), conflictPolicy });
      if (args.json) {
        process.stdout.write(`${JSON.stringify({
          applied: true,
          operations: result.operations,
          statePath: result.statePath,
          backup: {
            enabled: result.backup.enabled,
            root: result.backup.root,
            entries: result.backup.entries.length,
          },
          conflictPolicy: {
            policy: result.conflictPolicy.policy,
            decisions: result.conflictPolicy.decisions.length,
          },
        }, null, 2)}\n`);
      } else {
        console.log(`applied ${result.operations} operation(s) (scope: ${plan.scope}).`);
        console.log(`state:  ${path.relative(plan.baseRoot, result.statePath)}`);
        console.log(`conflict policy: ${result.conflictPolicy.policy} (${result.conflictPolicy.decisions.length} decision(s))`);
        if (result.backup.enabled) {
          console.log(`backup: ${path.relative(plan.baseRoot, result.backup.root)} (${result.backup.entries.length} file(s))`);
        }
      }
      return;
    }

    if (cmd === 'update') {
      if (args['dry-run']) {
        const report = buildUpdateDryRun(buildRequest(args));
        printUpdateReport(report, Boolean(args.json));
        return;
      }
      const result = applyUpdate(buildRequest(args), {
        backup: Boolean(args.backup),
        conflictPolicy: args['conflict-policy'] || 'managed-overwrite',
        onUserModified: args['on-user-modified'] || 'fail',
      });
      printUpdateResult(result, Boolean(args.json));
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
