import fs from 'node:fs';
import path from 'node:path';
import { isPathInsideRoot } from '../path-safety.js';

export function normalizeRel(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

export function isSafeRelativePath(value) {
  const rel = normalizeRel(value);
  if (!rel || path.isAbsolute(value) || path.isAbsolute(rel)) return false;
  return !rel.split('/').includes('..');
}

export function assertPackTreeSafe(root, errors, label = 'pack') {
  const resolvedRoot = path.resolve(root);
  if (!fs.existsSync(resolvedRoot)) {
    errors.push(`${label}: root does not exist: ${resolvedRoot}`);
    return;
  }
  if (!fs.statSync(resolvedRoot).isDirectory()) {
    errors.push(`${label}: root must be a directory: ${resolvedRoot}`);
    return;
  }

  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = normalizeRel(path.relative(resolvedRoot, abs));
      if (entry.isSymbolicLink()) {
        const real = fs.realpathSync(abs);
        if (!isPathInsideRoot(real, resolvedRoot)) {
          errors.push(`${label}: symlink '${rel}' escapes root (${real})`);
        }
        continue;
      }
      if (entry.isDirectory()) visit(abs);
    }
  };

  visit(resolvedRoot);
}

export function walkMarkdown(root) {
  const files = [];
  const resolvedRoot = path.resolve(root);
  if (!fs.existsSync(resolvedRoot)) return files;

  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(abs);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(abs);
    }
  };

  visit(resolvedRoot);
  return files;
}

export function slugify(value, fallback = 'asset') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/\/skill$/, '')
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}
