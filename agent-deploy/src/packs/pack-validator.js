import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAssetSchemas } from '../../scripts/check-asset-schema.js';
import { checkCatalogParity } from '../../scripts/check-catalog-parity.js';
import { detectPackConflicts } from './conflicts.js';
import { calculatePackDigest } from './digest.js';
import { assertPackTreeSafe, isSafeRelativePath, normalizeRel } from './path-utils.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PACK_SCHEMA_PATH = path.join(ROOT, 'schemas/asset-pack.schema.json');
const PACK_TYPES = new Set(['shared-approved', 'project-local', 'candidate']);
const REVIEW_STATUSES = new Set(['candidate', 'reviewing', 'approved', 'deprecated']);
const STABILITIES = new Set(['draft', 'beta', 'stable', 'deprecated']);

function readJson(file, errors, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${label}: invalid JSON (${error.message})`);
    return null;
  }
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validatePackJson(packJson, errors) {
  const required = ['schemaVersion', 'id', 'title', 'version', 'owner', 'stability', 'reviewStatus', 'packType'];
  for (const key of required) {
    if (!(key in packJson)) errors.push(`pack.json: missing required key '${key}'`);
  }
  if (packJson.schemaVersion !== 'agentdeploy.assetPack.v1') {
    errors.push(`pack.json: schemaVersion must be 'agentdeploy.assetPack.v1'`);
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(packJson.id || '')) {
    errors.push(`pack.json: id must be kebab-case`);
  }
  for (const key of ['title', 'owner']) {
    if (key in packJson && !nonEmptyString(packJson[key])) errors.push(`pack.json: '${key}' must be a non-empty string`);
  }
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/.test(packJson.version || '')) {
    errors.push(`pack.json: version must be semantic version-like (x.y.z)`);
  }
  if (!PACK_TYPES.has(packJson.packType)) {
    errors.push(`pack.json: packType must be one of ${[...PACK_TYPES].join(', ')}`);
  }
  if (!REVIEW_STATUSES.has(packJson.reviewStatus)) {
    errors.push(`pack.json: reviewStatus must be one of ${[...REVIEW_STATUSES].join(', ')}`);
  }
  if (!STABILITIES.has(packJson.stability)) {
    errors.push(`pack.json: stability must be one of ${[...STABILITIES].join(', ')}`);
  }
  if (packJson.packType === 'candidate' && !['candidate', 'reviewing'].includes(packJson.reviewStatus)) {
    errors.push(`pack.json: candidate packs may only use reviewStatus candidate or reviewing`);
  }
  if (packJson.packType === 'shared-approved' && packJson.reviewStatus !== 'approved') {
    errors.push(`pack.json: shared-approved packs must use reviewStatus approved`);
  }
  if (packJson.packType !== 'shared-approved' && 'defaultProfileExtensions' in packJson) {
    errors.push(`pack.json: defaultProfileExtensions is only allowed for shared-approved packs`);
  }
}

function validateManifestDocs(packRoot, modulesDoc, profilesDoc, errors) {
  const assetsRoot = path.join(packRoot, 'assets');
  const moduleIds = new Set();

  if (!modulesDoc || !Array.isArray(modulesDoc.modules)) {
    errors.push(`manifests/modules.json: 'modules' must be an array`);
  } else {
    for (const module of modulesDoc.modules) {
      if (!module || typeof module !== 'object') {
        errors.push(`manifests/modules.json: module entry must be an object`);
        continue;
      }
      if (!nonEmptyString(module.id)) {
        errors.push(`module '<unknown>': missing non-empty id`);
        continue;
      }
      if (moduleIds.has(module.id)) errors.push(`module '${module.id}': duplicate module id`);
      moduleIds.add(module.id);
      if (!Array.isArray(module.paths) || module.paths.length === 0) {
        errors.push(`module '${module.id}': paths must be a non-empty array`);
      } else {
        for (const rawPath of module.paths) {
          if (!isSafeRelativePath(rawPath)) {
            errors.push(`module '${module.id}': path '${rawPath}' must stay under assets/`);
            continue;
          }
          const rel = normalizeRel(rawPath);
          const abs = path.join(assetsRoot, rel);
          if (!fs.existsSync(abs)) errors.push(`module '${module.id}': source path 'assets/${rel}' does not exist`);
        }
      }
      for (const dep of module.dependencies || []) {
        if (!moduleIds.has(dep) && !(modulesDoc.modules || []).some((candidate) => candidate.id === dep)) {
          errors.push(`module '${module.id}': unknown dependency '${dep}'`);
        }
      }
    }
  }

  if (!profilesDoc || typeof profilesDoc.profiles !== 'object' || Array.isArray(profilesDoc.profiles)) {
    errors.push(`manifests/profiles.json: 'profiles' must be an object`);
  } else {
    for (const [profileId, ids] of Object.entries(profilesDoc.profiles)) {
      if (!Array.isArray(ids)) {
        errors.push(`profile '${profileId}': module list must be an array`);
        continue;
      }
      for (const id of ids) {
        if (!moduleIds.has(id)) errors.push(`profile '${profileId}': unknown module '${id}'`);
      }
    }
  }
}

function validateDefaultExtensions(packJson, modulesDoc, errors) {
  if (!packJson.defaultProfileExtensions) return;
  const moduleIds = new Set((modulesDoc?.modules || []).map((module) => module.id));
  for (const [profileId, ids] of Object.entries(packJson.defaultProfileExtensions)) {
    if (!Array.isArray(ids) || ids.length === 0) {
      errors.push(`pack.json: defaultProfileExtensions.${profileId} must be a non-empty module id array`);
      continue;
    }
    for (const id of ids) {
      if (!moduleIds.has(id)) errors.push(`pack.json: defaultProfileExtensions.${profileId} references unknown module '${id}'`);
    }
  }
}

export function validatePackRoot(packRoot, options = {}) {
  const root = path.resolve(packRoot);
  const errors = [];
  const warnings = [];
  const schemaPath = options.schemaPath || PACK_SCHEMA_PATH;
  const result = {
    ok: false,
    root,
    schemaPath,
    packJson: null,
    digest: null,
    conflicts: [],
    errors,
    warnings,
  };

  assertPackTreeSafe(root, errors, 'pack');
  if (!fs.existsSync(path.join(root, 'pack.json'))) {
    errors.push(`pack: missing pack.json`);
  }
  for (const requiredDir of ['assets', 'manifests']) {
    const dir = path.join(root, requiredDir);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      errors.push(`pack: missing ${requiredDir}/ directory`);
    }
  }
  if (errors.length) return result;

  const packJson = readJson(path.join(root, 'pack.json'), errors, 'pack.json');
  result.packJson = packJson;
  if (packJson) validatePackJson(packJson, errors);
  try {
    result.digest = calculatePackDigest(root).digest;
  } catch (error) {
    errors.push(`pack digest: ${error.message}`);
  }

  const modulesPath = path.join(root, 'manifests/modules.json');
  const profilesPath = path.join(root, 'manifests/profiles.json');
  if (!fs.existsSync(modulesPath)) errors.push(`pack: missing manifests/modules.json`);
  if (!fs.existsSync(profilesPath)) errors.push(`pack: missing manifests/profiles.json`);
  const modulesDoc = fs.existsSync(modulesPath) ? readJson(modulesPath, errors, 'manifests/modules.json') : null;
  const profilesDoc = fs.existsSync(profilesPath) ? readJson(profilesPath, errors, 'manifests/profiles.json') : null;

  validateManifestDocs(root, modulesDoc, profilesDoc, errors);
  if (packJson) validateDefaultExtensions(packJson, modulesDoc, errors);

  const assetSchema = checkAssetSchemas(path.join(root, 'assets'));
  errors.push(...assetSchema.errors.map((error) => `asset schema: ${error}`));
  warnings.push(...assetSchema.warnings.map((warning) => `asset schema: ${warning}`));

  if (fs.existsSync(path.join(root, 'assets/catalog.draft.json'))) {
    const catalog = checkCatalogParity(root);
    errors.push(...catalog.errors.map((error) => `catalog parity: ${error}`));
    warnings.push(...catalog.warnings.map((warning) => `catalog parity: ${warning}`));
  } else {
    warnings.push('pack: assets/catalog.draft.json is missing; catalog parity check skipped');
  }

  result.conflicts = detectPackConflicts(root, { baseRoot: options.baseRoot });
  if (!options.allowConflicts) {
    errors.push(...result.conflicts.map((item) => `conflict: ${item.message}`));
  }

  result.ok = errors.length === 0;
  return result;
}
