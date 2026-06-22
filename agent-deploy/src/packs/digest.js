import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeRel } from './path-utils.js';

const DIGEST_VERSION = 'agentdeploy.assetPackDigest.v1';
const IGNORED_DIRECTORIES = new Set(['.git', '.hg', '.svn']);
const IGNORED_FILENAMES = new Set([
  '.DS_Store',
  'Thumbs.db',
  'thumbs.db',
  'Desktop.ini',
  'desktop.ini',
  'ehthumbs.db',
]);
const TEXT_EXTENSIONS = new Set([
  '.bat',
  '.cmd',
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.sh',
  '.toml',
  '.ts',
  '.txt',
  '.yaml',
  '.yml',
]);

function shouldIgnoreEntry(entryName) {
  return IGNORED_FILENAMES.has(entryName)
    || entryName.startsWith('._')
    || entryName.endsWith('~')
    || entryName.endsWith('.swp')
    || entryName.endsWith('.swo')
    || entryName.endsWith('.tmp');
}

function normalizeFileBytes(filePath, bytes) {
  if (!TEXT_EXTENSIONS.has(path.extname(filePath))) return bytes;
  return Buffer.from(bytes.toString('utf8').replace(/\r\n?/g, '\n'), 'utf8');
}

function fileDigest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function listPackDigestEntries(packRoot) {
  const root = path.resolve(packRoot);
  const entries = [];

  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
      if (shouldIgnoreEntry(entry.name)) continue;

      const abs = path.join(dir, entry.name);
      const rel = normalizeRel(path.relative(root, abs));
      if (entry.isDirectory()) {
        visit(abs);
      } else if (entry.isFile()) {
        const normalizedBytes = normalizeFileBytes(abs, fs.readFileSync(abs));
        entries.push({
          type: 'file',
          rel,
          digest: fileDigest(normalizedBytes),
          size: normalizedBytes.length,
        });
      } else if (entry.isSymbolicLink()) {
        entries.push({
          type: 'symlink',
          rel,
          target: normalizeRel(fs.readlinkSync(abs)),
        });
      }
    }
  };

  visit(root);
  return entries;
}

export function calculatePackDigest(packRoot) {
  const hash = crypto.createHash('sha256');
  const entries = listPackDigestEntries(packRoot);

  hash.update(`${DIGEST_VERSION}\n`);
  for (const entry of entries) {
    if (entry.type === 'file') {
      hash.update(`file\0${entry.rel}\0${entry.size}\0${entry.digest}\n`);
    } else if (entry.type === 'symlink') {
      hash.update(`symlink\0${entry.rel}\0${entry.target}\n`);
    }
  }

  return {
    algorithm: 'sha256',
    digest: `sha256:${hash.digest('hex')}`,
    files: entries.filter((entry) => entry.type === 'file').length,
  };
}
