// Target-adapter factory (ported/simplified from ECC
// scripts/lib/install-targets/helpers.js).
//
// An adapter maps the CANONICAL source layout (assets/) into ONE tool's native
// config layout. Adding support for a new AI coding tool = writing one adapter,
// nothing else. This is the core "1 definition -> N tools" lever.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function normalizeRel(p) {
  return String(p || '')
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/\/+$/, '');
}

function resolveBaseRoot(scope, input) {
  if (scope === 'home') return input.homeDir || os.homedir();
  if (scope === 'project') {
    const root = input.projectRoot || input.repoRoot;
    if (!root) throw new Error('projectRoot is required for a project-scoped target');
    return root;
  }
  throw new Error(`unsupported target scope: ${scope}`);
}

// One operation in an install plan. Kinds:
//   copy-file  -> copy sourcePath to dest
//   merge-json -> deep-merge mergePayload into the JSON already at dest
//   merge-toml -> add-only merge of mergePayload into the TOML already at dest
//   append-markdown -> upsert a managed markdown block into dest
//   skip       -> capability unsupported by this target; nothing written, but
//                 recorded (with `reason`) in the plan + install-state
export function fileOp(fields) {
  return {
    kind: fields.kind || 'copy-file',
    moduleId: fields.moduleId,
    sourceRel: fields.sourceRel ? normalizeRel(fields.sourceRel) : null,
    sourcePath: fields.sourcePath || null,
    dest: fields.dest || null,
    strategy: fields.strategy || 'preserve-relative-path',
    ownership: 'managed',
    ...(fields.scope !== undefined ? { scope: fields.scope } : {}),
    ...(fields.reason !== undefined ? { reason: fields.reason } : {}),
    ...(fields.mergePayload !== undefined ? { mergePayload: fields.mergePayload } : {}),
    ...(fields.content !== undefined ? { content: fields.content } : {}),
    ...(fields.markerId !== undefined ? { markerId: fields.markerId } : {}),
  };
}

// Record an unsupported capability as a visible skip (no write).
export function skipOp({ moduleId, sourceRel, reason }) {
  return fileOp({ kind: 'skip', moduleId, sourceRel, dest: null, strategy: 'skip', reason });
}

// Recursively list files under a directory, returning POSIX-style relative paths.
export function walkFiles(absDir, prefix = '') {
  if (!fs.existsSync(absDir)) return [];
  const out = [];
  const entries = fs
    .readdirSync(absDir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs, rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

// Copy a source path (FILE or DIR, possibly a subpath like 'rules/developer')
// mirroring its layout under destRoot: assets/<sourceRel> -> <destRoot>/<sourceRel>.
// This is what lets modules scope to a subdir or a single file.
export function mirrorOps({ moduleId, assetRoot, sourceRel, destRoot, rename }) {
  const abs = path.join(assetRoot, sourceRel);
  if (!fs.existsSync(abs)) return [];
  const isFile = fs.statSync(abs).isFile();
  const rels = isFile ? [''] : walkFiles(abs);
  const ops = [];
  for (const rel of rels) {
    const fullRel = rel ? `${sourceRel}/${rel}` : sourceRel; // mirrored path
    const sourcePath = rel ? path.join(abs, rel) : abs;
    let destRel = fullRel;
    if (typeof rename === 'function') {
      destRel = rename(fullRel);
      if (!destRel) continue;
    }
    ops.push(fileOp({
      kind: 'copy-file',
      moduleId,
      sourceRel: fullRel,
      sourcePath,
      dest: path.join(destRoot, destRel),
      strategy: 'preserve-relative-path',
    }));
  }
  return ops;
}

// Read a canonical JSON asset and produce a merge-json op against `dest`.
export function mergeJsonOp({ moduleId, assetRoot, sourceRel, dest }) {
  const srcAbs = path.join(assetRoot, sourceRel);
  if (!fs.existsSync(srcAbs)) return null;
  const payload = JSON.parse(fs.readFileSync(srcAbs, 'utf8'));
  return fileOp({
    kind: 'merge-json',
    moduleId,
    sourceRel,
    sourcePath: srcAbs,
    dest,
    strategy: 'merge-json',
    mergePayload: payload,
  });
}

// Read a canonical JSON asset and produce an add-only merge-toml op against `dest`.
export function mergeTomlOp({ moduleId, assetRoot, sourceRel, dest, convert }) {
  const srcAbs = path.join(assetRoot, sourceRel);
  if (!fs.existsSync(srcAbs)) return null;
  const payload = JSON.parse(fs.readFileSync(srcAbs, 'utf8'));
  return fileOp({
    kind: 'merge-toml',
    moduleId,
    sourceRel,
    sourcePath: srcAbs,
    dest,
    strategy: 'merge-toml-add-only',
    mergePayload: typeof convert === 'function' ? convert(payload) : payload,
  });
}

// Upsert a managed Markdown block into a root instruction file.
export function appendMarkdownOp({
  moduleId, sourceRel, dest, markerId, content, strategy = 'managed-markdown-block',
}) {
  return fileOp({
    kind: 'append-markdown',
    moduleId,
    sourceRel,
    dest,
    strategy,
    markerId,
    content,
  });
}

export function createAdapter(config) {
  const adapter = {
    id: config.id,
    target: config.target,
    scope: config.scope, // default scope; overridable per-install via input.scope
    // 'home'  -> install into the user-global config dir (~/.claude, ~/.codex …)
    // 'project' -> install into a repo (.claude, .cursor … under projectRoot)
    scopeOf(input = {}) {
      return input.scope || config.scope;
    },
    // The safety boundary: every write must stay inside this.
    baseRoot(input = {}) {
      return resolveBaseRoot(adapter.scopeOf(input), input);
    },
    supports(targetOrId) {
      return targetOrId === config.target || targetOrId === config.id;
    },
    resolveRoot(input = {}) {
      return path.join(adapter.baseRoot(input), ...config.rootSegments);
    },
    statePath(input = {}) {
      if (typeof config.statePath === 'function') return config.statePath(input, adapter);
      if (Array.isArray(config.stateSegments)) {
        return path.join(adapter.baseRoot(input), ...config.stateSegments);
      }
      return path.join(adapter.resolveRoot(input), config.stateFile || 'agent-install-state.json');
    },
    supportsModule(module) {
      return Array.isArray(module.targets) ? module.targets.includes(config.target) : true;
    },
    validate(input = {}) {
      if (typeof config.validate === 'function') return config.validate(input, adapter);
      return [];
    },
    planOperations(input = {}) {
      const moduleById = new Map((input.modules || []).map((module) => [module.id, module]));
      const sharedRoot = typeof config.sharedRoot === 'function'
        ? config.sharedRoot(input, adapter)
        : path.join(adapter.resolveRoot(input), 'shared');
      const ops = config.planOperations(input, adapter).map((op) => {
        if (!op || op.kind !== 'copy-file' || !op.dest || !op.sourceRel) return op;
        const module = moduleById.get(op.moduleId);
        if (!module?.installNamespace) return op;
        return {
          ...op,
          dest: path.join(sharedRoot, module.installNamespace, normalizeRel(op.sourceRel)),
          strategy: `${op.strategy}+add-namespaced`,
        };
      });
      const scope = adapter.scopeOf(input);
      // Stamp scope on every op; dedup writes by destination (skip ops have no
      // dest and are always kept so the unsupported-capability record survives).
      const seen = new Set();
      const unique = [];
      for (const o of ops) {
        if (!o) continue;
        if (o.scope === undefined) o.scope = scope;
        if (o.dest) {
          if (seen.has(o.dest)) continue;
          seen.add(o.dest);
        }
        unique.push(o);
      }
      return unique;
    },
  };
  return Object.freeze(adapter);
}
