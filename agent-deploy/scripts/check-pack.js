#!/usr/bin/env node
// Asset pack validation entry point.
//
// This is intentionally read-only: it validates a pack root or scans
// AI-Knowhow/ into draft candidate metadata without writing files.
import { pathToFileURL } from 'node:url';
import { scanAiKnowhow } from '../src/packs/ai-knowhow-scanner.js';
import { validatePackRoot } from '../src/packs/pack-validator.js';

function usage() {
  return `Usage:
  node scripts/check-pack.js --pack <pack-root> [--json] [--allow-conflicts]
  node scripts/check-pack.js --ai-knowhow <AI-Knowhow-root> [--json]`;
}

function parseArgs(argv) {
  const args = { json: false, allowConflicts: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') args.json = true;
    else if (arg === '--allow-conflicts') args.allowConflicts = true;
    else if (arg === '--pack') args.pack = argv[++index];
    else if (arg === '--ai-knowhow') args.aiKnowhow = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function printHumanPack(result) {
  for (const warning of result.warnings) console.warn(`warning: ${warning}`);
  if (result.conflicts.length) {
    console.warn(`conflicts (${result.conflicts.length}):`);
    for (const item of result.conflicts) {
      console.warn(`  - ${item.message}`);
      console.warn(`    choices: ${item.choices.join(', ')}`);
    }
  }
  if (!result.ok) {
    console.error(`asset pack validation FAILED (${result.errors.length}):`);
    for (const error of result.errors) console.error(`  - ${error}`);
    return;
  }
  console.log(`asset pack validation OK: ${result.packJson.id}@${result.packJson.version}`);
}

function printHumanAiKnowhow(result) {
  for (const warning of result.warnings) console.warn(`warning: ${warning}`);
  if (result.errors.length) {
    console.error(`AI-Knowhow scan FAILED (${result.errors.length}):`);
    for (const error of result.errors) console.error(`  - ${error}`);
    return;
  }
  console.log(`AI-Knowhow scan OK: ${result.assets.length} Markdown candidate(s)`);
  for (const asset of result.assets) {
    console.log(`  - ${asset.assetType}: ${asset.path} -> ${asset.id}`);
  }
}

export function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.pack && args.aiKnowhow) throw new Error('choose either --pack or --ai-knowhow, not both');
  if (!args.pack && !args.aiKnowhow) throw new Error(usage());

  if (args.aiKnowhow) {
    const result = scanAiKnowhow(args.aiKnowhow);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printHumanAiKnowhow(result);
    return result.errors.length ? 1 : 0;
  }

  const result = validatePackRoot(args.pack, { allowConflicts: args.allowConflicts });
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printHumanPack(result);
  return result.ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    process.exitCode = run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
