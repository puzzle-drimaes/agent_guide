import fs from 'node:fs';
import path from 'node:path';
import { ASSET_ROOT, loadManifests } from '../manifest.js';
import { listAdapters } from '../targets/registry.js';
import { validatePackRoot } from './pack-validator.js';

const PACK_ORDER = {
  'shared-approved': 0,
  'project-local': 1,
  candidate: 2,
};

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizePackPaths(packPaths = []) {
  const paths = Array.isArray(packPaths) ? packPaths : [packPaths];
  return paths
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => path.resolve(value));
}

function annotateBaseModule(module, assetRoot = ASSET_ROOT) {
  return {
    ...module,
    assetRoot,
    sourcePack: null,
  };
}

function annotatePackModule(module, pack) {
  return {
    ...module,
    assetRoot: path.join(pack.root, 'assets'),
    sourcePack: {
      id: pack.packJson.id,
      version: pack.packJson.version,
      packType: pack.packJson.packType,
    },
  };
}

function loadPack(packRoot, options = {}) {
  const validation = validatePackRoot(packRoot, { ...options, allowConflicts: true });
  if (!validation.ok) {
    throw new Error(`pack validation failed for ${packRoot}: ${validation.errors.join('; ')}`);
  }
  if (validation.conflicts.length) {
    throw new Error(
      `pack conflict failed for ${packRoot}: ${validation.conflicts.map((item) => item.message).join('; ')}`
    );
  }

  const modulesDoc = readJson(path.join(packRoot, 'manifests/modules.json'));
  const profilesDoc = readJson(path.join(packRoot, 'manifests/profiles.json'));
  return {
    root: packRoot,
    packJson: validation.packJson,
    modulesDoc,
    profilesDoc,
  };
}

function sortPacks(packs) {
  return packs.slice().sort((a, b) => {
    const orderDelta = PACK_ORDER[a.packJson.packType] - PACK_ORDER[b.packJson.packType];
    if (orderDelta !== 0) return orderDelta;
    return a.packJson.id.localeCompare(b.packJson.id);
  });
}

function assertUniqueId(id, seen, label, owner) {
  const previous = seen.get(id);
  if (previous) throw new Error(`${label} '${id}' from ${owner} conflicts with ${previous}`);
  seen.set(id, owner);
}

function assertNoDestinationCollisions(modules) {
  const projectRoot = '/tmp/agent-deploy-pack-compose';
  for (const adapter of listAdapters()) {
    const seen = new Map();
    const ops = adapter.planOperations({
      assetRoot: ASSET_ROOT,
      projectRoot,
      modules: modules.filter((module) => adapter.supportsModule(module)),
    });
    for (const op of ops) {
      if (!op.dest) continue;
      const key = path.relative(projectRoot, op.dest).replace(/\\/g, '/');
      const previous = seen.get(key);
      if (previous && previous !== op.moduleId) {
        throw new Error(
          `target '${adapter.target}' destination '${key}' from module '${op.moduleId}' conflicts with '${previous}'`
        );
      }
      seen.set(key, op.moduleId);
    }
  }
}

export function loadComposedManifests({ root, packPaths = [] } = {}) {
  const base = loadManifests(root);
  const baseAssetRoot = root ? path.join(root, 'assets') : ASSET_ROOT;
  const normalizedPackPaths = normalizePackPaths(packPaths);
  if (normalizedPackPaths.length === 0) {
    return {
      ...base,
      modulesDoc: {
        ...base.modulesDoc,
        modules: base.modulesDoc.modules.map((module) => annotateBaseModule(module, baseAssetRoot)),
      },
      packs: [],
    };
  }

  const loadedPacks = sortPacks(normalizedPackPaths.map((packRoot) => loadPack(packRoot, { baseRoot: root })));
  const modules = base.modulesDoc.modules.map((module) => annotateBaseModule(module, baseAssetRoot));
  const profiles = cloneJson(base.profilesDoc.profiles);
  const moduleOwners = new Map(modules.map((module) => [module.id, 'base bundle']));
  const profileOwners = new Map(Object.keys(profiles).map((profileId) => [profileId, 'base bundle']));

  for (const pack of loadedPacks) {
    const owner = `pack ${pack.packJson.id}`;
    for (const module of pack.modulesDoc.modules || []) {
      assertUniqueId(module.id, moduleOwners, 'module', owner);
      modules.push(annotatePackModule(module, pack));
    }
    for (const [profileId, moduleIds] of Object.entries(pack.profilesDoc.profiles || {})) {
      assertUniqueId(profileId, profileOwners, 'profile', owner);
      profiles[profileId] = moduleIds;
    }
  }

  assertNoDestinationCollisions(modules);

  const byId = new Map(modules.map((module) => [module.id, module]));
  const packs = loadedPacks.map((pack) => ({
    id: pack.packJson.id,
    version: pack.packJson.version,
    packType: pack.packJson.packType,
    source: pack.packJson.source || null,
    root: pack.root,
  }));

  return {
    modulesDoc: {
      ...base.modulesDoc,
      modules,
    },
    profilesDoc: {
      ...base.profilesDoc,
      profiles,
    },
    byId,
    packs,
  };
}
