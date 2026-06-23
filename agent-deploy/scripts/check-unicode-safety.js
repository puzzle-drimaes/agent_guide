#!/usr/bin/env node
// Unicode safety guard (TODO 7.1).
// Scans shipped assets for dangerous *invisible* / *bidirectional* Unicode that
// has no place in legitimate Markdown/JSON and is a known prompt-injection and
// supply-chain vector: zero-width characters, bidi overrides, Unicode Tag block
// (ASCII smuggling), variation selectors, and zero-width fillers. Catching these
// before they ship means a hidden instruction can't ride along in a company rule
// or prompt that every agent reads.
//
// Zero-dependency by design. We only flag codepoints that never occur in real
// source text, so visible content (incl. CJK, accents, emoji) is left alone and
// false positives stay near zero. A single leading BOM is allowed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_ASSET_ROOT = path.join(ROOT, 'assets');
const TEXT_EXTENSIONS = new Set(['.md', '.mdc', '.json', '.txt', '.toml', '.yml', '.yaml']);

// Each entry: human label + an inclusive [from, to] codepoint range.
const DANGEROUS_RANGES = [
  ['zero-width space/joiner', 0x200b, 0x200d],
  ['word joiner', 0x2060, 0x2060],
  ['zero-width no-break space (mid-file BOM)', 0xfeff, 0xfeff],
  ['invisible math operator', 0x2061, 0x2064],
  ['bidi embedding/override', 0x202a, 0x202e],
  ['bidi isolate', 0x2066, 0x2069],
  ['Mongolian vowel separator', 0x180e, 0x180e],
  ['Hangul filler (zero-width)', 0x115f, 0x1160],
  ['Hangul filler (zero-width)', 0x3164, 0x3164],
  ['variation selector', 0xfe00, 0xfe0f],
  ['variation selector supplement', 0xe0100, 0xe01ef],
  ['Unicode Tag block (ASCII smuggling)', 0xe0000, 0xe007f],
];

function classifyCodePoint(cp) {
  for (const [label, from, to] of DANGEROUS_RANGES) {
    if (cp >= from && cp <= to) return label;
  }
  return null;
}

function hex(cp) {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) walk(abs, out);
    else if (stat.isFile() && TEXT_EXTENSIONS.has(path.extname(name))) out.push(abs);
  }
  return out;
}

export function checkUnicodeSafety(assetRoot = DEFAULT_ASSET_ROOT) {
  const errors = [];
  const warnings = [];
  let checked = 0;

  for (const file of walk(assetRoot)) {
    checked += 1;
    const rel = path.relative(assetRoot, file);
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');

    lines.forEach((line, lineIdx) => {
      let col = 0;
      for (const ch of line) {
        col += 1;
        const cp = ch.codePointAt(0);
        // Allow a single leading BOM at the very start of the file.
        if (cp === 0xfeff && lineIdx === 0 && col === 1) continue;
        const label = classifyCodePoint(cp);
        if (label) {
          errors.push(`${rel}:${lineIdx + 1}:${col}: dangerous Unicode ${hex(cp)} (${label})`);
        }
      }
    });
  }

  return { errors, warnings, checked };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { errors, checked } = checkUnicodeSafety();
  if (errors.length) {
    console.error(`unicode safety scan FAILED (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('\nRemove the invisible/bidi character, or paste the text fresh. '
      + 'These codepoints never belong in legitimate Markdown/JSON assets.');
    process.exit(1);
  }
  console.log(`unicode safety scan OK (${checked} text assets, no invisible/bidi characters)`);
}
