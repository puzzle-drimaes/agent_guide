#!/usr/bin/env node
// Rule drift guard.
// Ensures the project canonical rules under <repo>/.agents/rules stay content-equal
// to their promoted deploy copies under agent-deploy/assets/rules, so a rule edited
// in only one location is caught before it ships.
//
// The canonical source lives OUTSIDE the agent-deploy bundle. When this runs from a
// standalone bundle (no .agents/rules present), it skips with a notice so a published
// package's `npm run validate` does not fail.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..'); // agent-deploy/
const REPO_ROOT = path.resolve(ROOT, '..'); // project root
const CANON_RULES = path.join(REPO_ROOT, '.agents', 'rules');
const ASSET_RULES = path.join(ROOT, 'assets', 'rules');

function walkMd(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(abs));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(abs);
  }
  return out;
}

// Compare rule *content*, not bytes: ignore trailing whitespace and final newlines.
const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n+$/, '');

if (!fs.existsSync(CANON_RULES)) {
  console.log('rule drift check skipped (no canonical .agents/rules; bundle mode)');
  process.exit(0);
}

const errors = [];

// 1. Every canonical rule must have a matching asset copy with equal content.
const canonFiles = walkMd(CANON_RULES);
const canonRel = new Set();
const canonTopDirs = new Set();
for (const abs of canonFiles) {
  const rel = path.relative(CANON_RULES, abs);
  canonRel.add(rel);
  canonTopDirs.add(rel.split(path.sep)[0]);
  const assetAbs = path.join(ASSET_RULES, rel);
  if (!fs.existsSync(assetAbs)) {
    errors.push(`missing in assets: assets/rules/${rel} (canonical: .agents/rules/${rel})`);
    continue;
  }
  if (normalize(fs.readFileSync(abs, 'utf8')) !== normalize(fs.readFileSync(assetAbs, 'utf8'))) {
    errors.push(`content drift: .agents/rules/${rel} != assets/rules/${rel}`);
  }
}

// 2. In mirrored subtrees, assets must not carry rule files with no canonical source.
//    Asset-only categories (e.g. rules/python) are intentionally ignored.
for (const abs of walkMd(ASSET_RULES)) {
  const rel = path.relative(ASSET_RULES, abs);
  const top = rel.split(path.sep)[0];
  if (canonTopDirs.has(top) && !canonRel.has(rel)) {
    errors.push(`asset-only rule with no canonical source: assets/rules/${rel}`);
  }
}

if (errors.length) {
  console.error('rule drift check FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nFix .agents/rules first, then re-promote the same content into agent-deploy/assets/rules.');
  process.exit(1);
}

console.log(`rule drift check OK (${canonFiles.length} canonical rules in sync with assets)`);
