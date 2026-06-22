import fs from 'node:fs';
import path from 'node:path';
import { ASSET_ROOT } from '../manifest.js';
import { listAdapters } from '../targets/registry.js';

export const CONFLICT_DECISIONS = Object.freeze([
  'keep-existing',
  'add-namespaced',
  'rename-proposed',
  'replace-existing',
]);

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizeRel(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

function conflict(fields) {
  return {
    choices: CONFLICT_DECISIONS,
    ...fields,
  };
}

function collectDestinations(modules, assetRoot) {
  const destinations = new Map();
  for (const adapter of listAdapters()) {
    const ops = adapter.planOperations({
      assetRoot,
      projectRoot: '/tmp/agent-deploy-pack-conflict',
      modules,
    });
    for (const op of ops) {
      if (!op.dest) continue;
      const key = `${adapter.target}:${normalizeRel(path.relative('/tmp/agent-deploy-pack-conflict', op.dest))}`;
      if (!destinations.has(key)) destinations.set(key, []);
      destinations.get(key).push({ target: adapter.target, moduleId: op.moduleId, dest: op.dest });
    }
  }
  return destinations;
}

export function detectPackConflicts(packRoot, options = {}) {
  const baseRoot = options.baseRoot || path.resolve(path.dirname(ASSET_ROOT), '..', 'agent-deploy');
  const conflicts = [];

  const baseModules = readJsonIfExists(path.join(baseRoot, 'manifests/modules.json')) || { modules: [] };
  const baseProfiles = readJsonIfExists(path.join(baseRoot, 'manifests/profiles.json')) || { profiles: {} };
  const baseCatalog = readJsonIfExists(path.join(baseRoot, 'assets/catalog.draft.json')) || { assets: [] };
  const packModules = readJsonIfExists(path.join(packRoot, 'manifests/modules.json')) || { modules: [] };
  const packProfiles = readJsonIfExists(path.join(packRoot, 'manifests/profiles.json')) || { profiles: {} };
  const packCatalog = readJsonIfExists(path.join(packRoot, 'assets/catalog.draft.json')) || { assets: [] };

  const baseModuleIds = new Set((baseModules.modules || []).map((m) => m.id));
  for (const module of packModules.modules || []) {
    if (baseModuleIds.has(module.id)) {
      conflicts.push(conflict({
        type: 'module-id',
        proposed: module.id,
        conflictsWith: module.id,
        message: `module id '${module.id}' already exists in the base bundle`,
      }));
    }
  }

  const baseProfileIds = new Set(Object.keys(baseProfiles.profiles || {}));
  for (const profileId of Object.keys(packProfiles.profiles || {})) {
    if (baseProfileIds.has(profileId)) {
      conflicts.push(conflict({
        type: 'profile-id',
        proposed: profileId,
        conflictsWith: profileId,
        message: `profile '${profileId}' already exists in the base bundle`,
      }));
    }
  }

  const baseAssetIds = new Set((baseCatalog.assets || []).map((asset) => asset.id));
  const baseAssetPaths = new Set((baseCatalog.assets || []).map((asset) => normalizeRel(asset.path)));
  for (const asset of packCatalog.assets || []) {
    if (baseAssetIds.has(asset.id)) {
      conflicts.push(conflict({
        type: 'asset-id',
        proposed: asset.id,
        conflictsWith: asset.id,
        message: `asset id '${asset.id}' already exists in the base catalog`,
      }));
    }
    if (baseAssetPaths.has(normalizeRel(asset.path))) {
      conflicts.push(conflict({
        type: 'asset-path',
        proposed: asset.path,
        conflictsWith: asset.path,
        message: `asset path '${asset.path}' already exists in the base catalog`,
      }));
    }
  }

  const baseDestinations = collectDestinations(baseModules.modules || [], path.join(baseRoot, 'assets'));
  const packDestinations = collectDestinations(packModules.modules || [], path.join(packRoot, 'assets'));
  for (const [key, proposedOps] of packDestinations) {
    const existingOps = baseDestinations.get(key);
    if (!existingOps) continue;
    for (const proposed of proposedOps) {
      for (const existing of existingOps) {
        if (proposed.moduleId === existing.moduleId) continue;
        conflicts.push(conflict({
          type: 'target-destination',
          proposed: `${proposed.target}:${proposed.moduleId}`,
          conflictsWith: `${existing.target}:${existing.moduleId}`,
          target: proposed.target,
          proposedModuleId: proposed.moduleId,
          conflictsWithModuleId: existing.moduleId,
          destRel: normalizeRel(path.relative('/tmp/agent-deploy-pack-conflict', proposed.dest)),
          message: `target '${proposed.target}' destination collision at ${normalizeRel(path.relative('/tmp/agent-deploy-pack-conflict', proposed.dest))}`,
        }));
      }
    }
  }

  return conflicts;
}
