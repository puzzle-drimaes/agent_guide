#!/usr/bin/env node
// Secret scan guard (TODO 7.1).
// Scans shipped assets for hardcoded credentials before they get distributed to
// every employee. Company rules/prompts/MCP config are read by all agents and
// land in many repos, so a leaked key here has wide blast radius.
//
// Zero-dependency by design. We match high-signal credential *shapes* (provider
// prefixes, private-key blocks) rather than entropy, so false positives stay near
// zero. `${ENV}`-style placeholders are the approved way to reference secrets and
// never match these patterns. A line may opt out with a `secret-scan:allow`
// marker (for legitimate documentation examples).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_ASSET_ROOT = path.join(ROOT, 'assets');
const TEXT_EXTENSIONS = new Set(['.md', '.mdc', '.json', '.txt', '.toml', '.yml', '.yaml']);
const ALLOW_MARKER = 'secret-scan:allow';

// High-signal credential shapes. Provider-prefixed tokens and key blocks are
// effectively never present in legitimate company rule/prompt text.
const SECRET_PATTERNS = [
  { name: 'private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'AWS secret access key assignment', re: /aws_secret_access_key\s*[:=]\s*['"][A-Za-z0-9/+]{40}['"]/i },
  { name: 'GitHub token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/ },
  { name: 'GitHub fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Slack webhook URL', re: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]{20,}/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'OpenAI API key', re: /\bsk-(?:proj-)?[A-Za-z0-9]{20,}\b/ },
];

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

export function checkSecretScan(assetRoot = DEFAULT_ASSET_ROOT) {
  const errors = [];
  const warnings = [];
  let checked = 0;

  for (const file of walk(assetRoot)) {
    checked += 1;
    const rel = path.relative(assetRoot, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, lineIdx) => {
      if (line.includes(ALLOW_MARKER)) return;
      for (const { name, re } of SECRET_PATTERNS) {
        if (re.test(line)) {
          errors.push(`${rel}:${lineIdx + 1}: possible hardcoded secret (${name})`);
        }
      }
    });
  }

  return { errors, warnings, checked };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { errors, checked } = checkSecretScan();
  if (errors.length) {
    console.error(`secret scan FAILED (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('\nRemove the credential and reference it via a ${ENV_VAR} placeholder. '
      + `If it is a legitimate example, add a ${ALLOW_MARKER} marker on that line.`);
    process.exit(1);
  }
  console.log(`secret scan OK (${checked} text assets, no hardcoded credentials)`);
}
