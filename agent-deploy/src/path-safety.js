// Path-safety guards (ported from k-sdd src/utils/pathSafety.ts).
// Every file we write into a user's project MUST stay inside the resolved
// target root, and no path component may be a symlink that escapes it.
import path from 'node:path';
import fs from 'node:fs';

export function isPathInsideRoot(targetPath, rootPath) {
  const root = path.resolve(rootPath);
  const target = path.resolve(targetPath);
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

export function assertPathInsideRoot(targetPath, rootPath, label = 'path') {
  const root = path.resolve(rootPath);
  const target = path.resolve(targetPath);
  if (!isPathInsideRoot(target, root)) {
    throw new Error(`${label} must stay within ${root} (got ${target})`);
  }
  return target;
}

// Reject any existing symlink on the way to `targetPath` whose real location
// escapes `rootPath`. Blocks symlink-escape attacks when writing into a repo
// we do not fully trust.
export function assertNoSymlinkEscape(targetPath, rootPath, label = 'path') {
  const root = path.resolve(rootPath);
  let current = path.resolve(targetPath);
  while (current !== root && current !== path.dirname(current)) {
    if (fs.existsSync(current)) {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) {
        const real = fs.realpathSync(current);
        if (!isPathInsideRoot(real, root)) {
          throw new Error(`${label} traverses a symlink that escapes ${root}: ${current} -> ${real}`);
        }
      }
    }
    current = path.dirname(current);
  }
}
