import fs from 'node:fs';
import path from 'node:path';
import { assertPackTreeSafe, normalizeRel, slugify, walkMarkdown } from './path-utils.js';

const TARGETS = ['claude', 'cursor', 'codex', 'gemini'];

function classifyExternal(rel) {
  const [category] = rel.split('/');
  if (category === 'skills') return 'skill';
  if (category === 'docs') return 'doc';
  if (category === 'prompts') return 'prompt';
  return null;
}

function titleFromMarkdown(text, rel) {
  const h1 = text.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return slugify(path.basename(rel, '.md'), 'Untitled').replace(/-/g, ' ');
}

function externalAssetPath(type, rel) {
  const normalized = normalizeRel(rel);
  if (type === 'skill' && normalized.endsWith('/SKILL.md')) {
    return normalized;
  }
  return normalized;
}

export function scanExternals(externalsRoot, options = {}) {
  const root = path.resolve(externalsRoot);
  const packId = options.packId || 'externals-candidate';
  const errors = [];
  const warnings = [];
  const assets = [];

  assertPackTreeSafe(root, errors, 'externals');
  if (errors.length) return { errors, warnings, pack: null, assets: [] };

  for (const abs of walkMarkdown(root)) {
    const rel = normalizeRel(path.relative(root, abs));
    const assetType = classifyExternal(rel);
    if (!assetType) {
      warnings.push(`externals/${rel}: ignored because it is not under skills/, docs/, or prompts/`);
      continue;
    }

    const text = fs.readFileSync(abs, 'utf8');
    const assetPath = externalAssetPath(assetType, rel);
    const assetId = `${packId}-${slugify(assetPath)}`;
    assets.push({
      id: assetId,
      assetType,
      title: titleFromMarkdown(text, rel),
      description: `Candidate ${assetType} generated from externals/${rel}`,
      path: assetPath,
      sourcePath: abs,
      moduleId: `${assetId}-module`,
      profiles: ['candidate'],
      audience: ['project'],
      stability: 'draft',
      owner: options.owner || 'unknown',
      reviewStatus: 'candidate',
    });
  }

  const pack = {
    packJson: {
      schemaVersion: 'agentdeploy.assetPack.v1',
      id: packId,
      title: options.title || 'External Markdown Candidate Pack',
      version: '0.0.0',
      owner: options.owner || 'unknown',
      stability: 'draft',
      reviewStatus: 'candidate',
      packType: 'candidate',
    },
    catalog: {
      schemaVersion: 'agentdeploy.assetCatalog.v1',
      generatedAt: null,
      assets: assets.map(({ sourcePath, moduleId, ...asset }) => ({
        ...asset,
        moduleIds: [moduleId],
        tags: ['externals', 'candidate'],
      })),
    },
    modulesDoc: {
      version: 1,
      modules: assets.map((asset) => ({
        id: asset.moduleId,
        description: `Candidate module for ${asset.path}`,
        paths: [asset.path],
        targets: TARGETS,
        dependencies: [],
        cost: 'light',
        stability: 'draft',
      })),
    },
    profilesDoc: {
      version: 1,
      profiles: {
        candidate: assets.map((asset) => asset.moduleId),
      },
    },
  };

  return { errors, warnings, pack, assets };
}
