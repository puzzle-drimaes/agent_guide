#!/usr/bin/env node
// Entry-pointer parity guard.
// Policy: see .agents/rules/developer/harness-engineering.md, "Entry pointer parity".
// AGENTS.md / CLAUDE.md / GEMINI.md are pointers to one canonical rule source under
// .agents/rules/. Parity is "single source + no contradiction", not file identity.
// This guard enforces the mechanical, automatable part of that policy:
//   1. each entry file references the canonical source .agents/rules/,
//   2. every canonical rule is covered by each entry file (its path or its parent dir),
//   3. no entry file points to a .agents/rules/*.md path that does not exist.
// The canonical source lives outside the agent-deploy bundle, so this skips with a
// notice when run from a standalone bundle (no .agents/rules present).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..'); // agent-deploy/
const REPO_ROOT = path.resolve(ROOT, '..'); // project root
const CANON_RULES = path.join(REPO_ROOT, '.agents', 'rules');
const ENTRY_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];

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

if (!fs.existsSync(CANON_RULES)) {
  console.log('entry parity check skipped (no canonical .agents/rules; bundle mode)');
  process.exit(0);
}

// Repo-root-relative, forward-slash canonical rule paths (e.g. .agents/rules/common/security.md).
const canonRel = walkMd(CANON_RULES).map((a) => path.relative(REPO_ROOT, a).split(path.sep).join('/'));

const errors = [];
for (const entry of ENTRY_FILES) {
  const entryAbs = path.join(REPO_ROOT, entry);
  if (!fs.existsSync(entryAbs)) {
    errors.push(`${entry}: entry file is missing`);
    continue;
  }
  const text = fs.readFileSync(entryAbs, 'utf8');

  // 1. canonical-source designation
  if (!text.includes('.agents/rules/')) {
    errors.push(`${entry}: does not reference the canonical source .agents/rules/`);
  }

  // 2. coverage: the rule path itself, or its parent directory, must appear.
  for (const rel of canonRel) {
    const parentDir = rel.slice(0, rel.lastIndexOf('/') + 1);
    if (!text.includes(rel) && !text.includes(parentDir)) {
      errors.push(`${entry}: canonical rule not covered: ${rel}`);
    }
  }

  // 3. no dangling reference to a non-existent rule file.
  const refs = text.match(/\.agents\/rules\/[A-Za-z0-9._/-]+\.md/g) || [];
  for (const ref of refs) {
    if (!fs.existsSync(path.join(REPO_ROOT, ref))) {
      errors.push(`${entry}: references a missing rule file: ${ref}`);
    }
  }
}

if (errors.length) {
  console.error('entry parity check FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nKeep AGENTS.md / CLAUDE.md / GEMINI.md pointing at the same canonical rules in .agents/rules/.');
  process.exit(1);
}

console.log(`entry parity check OK (${ENTRY_FILES.length} entry files cover ${canonRel.length} canonical rules)`);
