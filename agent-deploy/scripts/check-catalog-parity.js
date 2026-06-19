#!/usr/bin/env node
// Catalog parity guard.
// Keeps assets/catalog.draft.json aligned with files, module manifests, profile
// manifests, and draft frontmatter when present. The catalog is still draft-stage:
// structural drift is blocking, while missing prompt/template/knowhow frontmatter
// remains a non-blocking warning until the metadata migration is complete.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from './check-asset-schema.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..'); // agent-deploy/

const REQUIRED_ENTRY_KEYS = [
  'id',
  'assetType',
  'title',
  'description',
  'path',
  'moduleIds',
  'profiles',
  'audience',
  'stability',
  'owner',
  'reviewStatus',
];
const FRONTMATTER_PARITY_TYPES = new Set(['prompt', 'template', 'knowhow']);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function normalizeRel(value) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function modulePathCoversAsset(modulePath, assetPath, assetRoot) {
  const moduleRel = normalizeRel(modulePath);
  const assetRel = normalizeRel(assetPath);
  const moduleAbs = path.join(assetRoot, moduleRel);

  if (fs.existsSync(moduleAbs) && fs.statSync(moduleAbs).isDirectory()) {
    return assetRel === moduleRel || assetRel.startsWith(`${moduleRel}/`);
  }
  return assetRel === moduleRel;
}

function collectProfileClosure(seedIds, moduleById) {
  const selected = new Set();
  const visit = (id) => {
    if (selected.has(id)) return;
    selected.add(id);
    const module = moduleById.get(id);
    if (!module) return;
    for (const dep of module.dependencies || []) visit(dep);
  };
  for (const id of seedIds || []) visit(id);
  return selected;
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function sameStringSet(actual, expected) {
  if (actual.size !== expected.size) return false;
  for (const value of actual) {
    if (!expected.has(value)) return false;
  }
  return true;
}

function checkEntryShape(entry, index, errors) {
  const label = entry?.id || `assets[${index}]`;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`catalog assets[${index}]: entry must be an object`);
    return label;
  }

  for (const key of REQUIRED_ENTRY_KEYS) {
    if (!(key in entry)) errors.push(`catalog '${label}': missing required key '${key}'`);
  }

  for (const key of ['id', 'assetType', 'title', 'description', 'path', 'stability', 'owner', 'reviewStatus']) {
    if (key in entry && !isNonEmptyString(entry[key])) {
      errors.push(`catalog '${label}': '${key}' must be a non-empty string`);
    }
  }

  for (const key of ['moduleIds', 'profiles', 'audience']) {
    if (key in entry && !isNonEmptyStringArray(entry[key])) {
      errors.push(`catalog '${label}': '${key}' must be a non-empty string array`);
    }
  }

  if ('tags' in entry && !Array.isArray(entry.tags)) {
    errors.push(`catalog '${label}': 'tags' must be an array when present`);
  }

  return label;
}

function checkFrontmatterParity(entry, label, assetFile, warnings) {
  if (!FRONTMATTER_PARITY_TYPES.has(entry.assetType)) return;

  const fm = parseFrontmatter(fs.readFileSync(assetFile, 'utf8'));
  if (fm.error) {
    warnings.push(`catalog '${label}': frontmatter parity skipped because ${entry.path} is invalid: ${fm.error}`);
    return;
  }
  if (!fm.present) {
    warnings.push(`catalog '${label}': ${entry.path} has no draft frontmatter to compare`);
    return;
  }

  const comparisons = [
    ['id', entry.id],
    ['asset_type', entry.assetType],
    ['title', entry.title],
    ['description', entry.description],
    ['owner', entry.owner],
    ['stability', entry.stability],
  ];
  for (const [key, expected] of comparisons) {
    if (key in fm.data && fm.data[key] !== expected) {
      warnings.push(`catalog '${label}': frontmatter '${key}' (${fm.data[key]}) does not match catalog (${expected})`);
    }
  }

  if ('audience' in fm.data && Array.isArray(fm.data.audience)) {
    const fmAudience = new Set(fm.data.audience);
    const catalogAudience = new Set(entry.audience || []);
    if (!sameStringSet(fmAudience, catalogAudience)) {
      warnings.push(
        `catalog '${label}': frontmatter audience [${sorted(fmAudience).join(', ')}] does not match catalog [${sorted(catalogAudience).join(', ')}]`
      );
    }
  }
}

export function checkCatalogParity(root = ROOT) {
  const errors = [];
  const warnings = [];
  const assetRoot = path.join(root, 'assets');
  const catalogPath = path.join(assetRoot, 'catalog.draft.json');
  const modulesPath = path.join(root, 'manifests', 'modules.json');
  const profilesPath = path.join(root, 'manifests', 'profiles.json');

  const catalog = readJson(catalogPath);
  const modulesDoc = readJson(modulesPath);
  const profilesDoc = readJson(profilesPath);

  if (catalog.schemaVersion !== 'agentdeploy.assetCatalog.v1') {
    errors.push(`catalog: schemaVersion must be 'agentdeploy.assetCatalog.v1'`);
  }
  if (!Array.isArray(catalog.assets)) {
    errors.push(`catalog: assets must be an array`);
    return { errors, warnings, checked: 0 };
  }

  const moduleById = new Map((modulesDoc.modules || []).map((module) => [module.id, module]));
  const profileNames = new Set(Object.keys(profilesDoc.profiles || {}));
  const ids = new Map();
  const paths = new Map();

  for (const [index, entry] of catalog.assets.entries()) {
    const label = checkEntryShape(entry, index, errors);
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;

    if (ids.has(entry.id)) errors.push(`catalog '${label}': duplicate id also used by '${ids.get(entry.id)}'`);
    else ids.set(entry.id, entry.path);

    if (paths.has(entry.path)) errors.push(`catalog '${label}': duplicate path also used by '${paths.get(entry.path)}'`);
    else paths.set(entry.path, entry.id);

    const assetFile = path.join(assetRoot, entry.path || '');
    if (!entry.path || !fs.existsSync(assetFile)) {
      errors.push(`catalog '${label}': path 'assets/${entry.path}' does not exist`);
      continue;
    }
    if (!fs.statSync(assetFile).isFile()) {
      errors.push(`catalog '${label}': path 'assets/${entry.path}' must point to a file`);
      continue;
    }

    const coveringModules = new Set();
    for (const module of modulesDoc.modules || []) {
      if ((module.paths || []).some((modulePath) => modulePathCoversAsset(modulePath, entry.path, assetRoot))) {
        coveringModules.add(module.id);
      }
    }

    for (const moduleId of entry.moduleIds || []) {
      const module = moduleById.get(moduleId);
      if (!module) {
        errors.push(`catalog '${label}': unknown module '${moduleId}'`);
        continue;
      }
      if (!coveringModules.has(moduleId)) {
        errors.push(`catalog '${label}': module '${moduleId}' does not include assets/${entry.path}`);
      }
    }

    const declaredModules = new Set(entry.moduleIds || []);
    if (!sameStringSet(declaredModules, coveringModules)) {
      warnings.push(
        `catalog '${label}': moduleIds [${sorted(declaredModules).join(', ')}] differ from file-covering modules [${sorted(coveringModules).join(', ')}]`
      );
    }

    const expectedProfiles = new Set();
    for (const [profileName, moduleIds] of Object.entries(profilesDoc.profiles || {})) {
      const closure = collectProfileClosure(moduleIds, moduleById);
      if ([...declaredModules].some((moduleId) => closure.has(moduleId))) {
        expectedProfiles.add(profileName);
      }
    }

    for (const profile of entry.profiles || []) {
      if (!profileNames.has(profile)) {
        errors.push(`catalog '${label}': unknown profile '${profile}'`);
        continue;
      }
      if (!expectedProfiles.has(profile)) {
        errors.push(`catalog '${label}': profile '${profile}' does not install any catalog module for this asset`);
      }
    }

    const declaredProfiles = new Set(entry.profiles || []);
    if (!sameStringSet(declaredProfiles, expectedProfiles)) {
      warnings.push(
        `catalog '${label}': profiles [${sorted(declaredProfiles).join(', ')}] differ from module/profile resolution [${sorted(expectedProfiles).join(', ')}]`
      );
    }

    checkFrontmatterParity(entry, label, assetFile, warnings);
  }

  return { errors, warnings, checked: catalog.assets.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { errors, warnings, checked } = checkCatalogParity();
  if (warnings.length) {
    console.warn(`catalog parity warnings (${warnings.length}, non-blocking):`);
    for (const warning of warnings) console.warn(`  - ${warning}`);
  }
  if (errors.length) {
    console.error(`catalog parity check FAILED (${errors.length}):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(`catalog parity check OK (${checked} catalog assets)`);
}
