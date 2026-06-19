#!/usr/bin/env node
// Asset frontmatter schema guard (TODO 7.1).
// Validates the frontmatter of every shipped asset BEFORE it gets installed, so a
// malformed agent/skill/command/rule is caught here instead of failing silently in
// a target harness (where a bad key is usually just ignored).
//
// Zero-dependency by design: the project ships no YAML library, so frontmatter is
// parsed with a small line parser that covers the shapes our assets actually use
// (`key: scalar` and `key: ["a", "b"]`).
//
// Blocking harness-frontmatter schemas are deliberately closed (unknown keys
// error). Adding a legitimate new harness key means updating SCHEMAS here — that
// is the intended review point.
//
// The draft asset-frontmatter JSON schema is also loaded as a non-blocking
// warning layer for prompt/template/knowhow metadata migration. It should make
// catalog-readiness visible without blocking today's shipped bundle.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..'); // agent-deploy/
const DEFAULT_ASSET_ROOT = path.join(ROOT, 'assets');
const DEFAULT_FRONTMATTER_SCHEMA = path.join(ROOT, 'schemas', 'asset-frontmatter.schema.json');

const SCHEMAS = {
  agent: {
    required: { name: 'string', description: 'string' },
    optional: { tools: 'string[]', model: 'string' },
  },
  skill: {
    required: { name: 'string', description: 'string' },
    optional: { 'allowed-tools': 'string[]', 'argument-hint': 'string', model: 'string' },
  },
  command: {
    required: { description: 'string' },
    optional: { 'argument-hint': 'string', 'allowed-tools': 'string[]', model: 'string' },
  },
  rule: {
    // Rules ship as plain markdown; frontmatter is optional. When present, the only
    // recognized key is `paths` (path-scoping globs, as in rules/python).
    required: {},
    optional: { paths: 'string[]' },
    frontmatterOptional: true,
  },
};

// Minimal frontmatter parser. Returns { present, data, error? }.
export function parseFrontmatter(text) {
  const norm = text.replace(/\r\n/g, '\n');
  if (!norm.startsWith('---\n')) return { present: false, data: {} };
  const end = norm.indexOf('\n---', 4);
  if (end === -1) return { present: true, data: {}, error: 'unterminated frontmatter block' };
  const body = norm.slice(4, end);
  const data = {};
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) return { present: true, data, error: `unparseable frontmatter line: ${raw}` };
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('[')) {
      try {
        val = JSON.parse(val);
      } catch {
        return { present: true, data, error: `invalid array value for '${key}': ${m[2]}` };
      }
    } else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  }
  return { present: true, data };
}

function typeOk(val, type) {
  if (type === 'string') return typeof val === 'string' && val.trim().length > 0;
  if (type === 'string[]')
    return Array.isArray(val) && val.length > 0 && val.every((x) => typeof x === 'string' && x.length > 0);
  return false;
}

function loadJsonSchema(schemaPath = DEFAULT_FRONTMATTER_SCHEMA) {
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

function describeExpected(type) {
  if (typeof type === 'string') return type;
  if (Array.isArray(type)) return type.join(' or ');
  return 'value';
}

function validateJsonSchemaSubset(schema, data, label, pathLabel = 'frontmatter') {
  const warnings = [];

  if (
    schema.type === 'object' ||
    schema.required ||
    schema.properties ||
    schema.additionalProperties !== undefined
  ) {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return [`${label}: ${pathLabel} must be an object`];
    }

    for (const key of schema.required || []) {
      if (!(key in data)) warnings.push(`${label}: missing draft metadata key '${key}'`);
    }

    const properties = schema.properties || {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!(key in properties)) warnings.push(`${label}: unknown draft metadata key '${key}'`);
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (key in properties) {
        warnings.push(...validateJsonSchemaSubset(properties[key], value, label, key));
      }
    }
  }

  if (schema.enum && !schema.enum.includes(data)) {
    warnings.push(`${label}: '${pathLabel}' must be one of ${schema.enum.join(', ')}`);
  }

  if (schema.type === 'string') {
    if (typeof data !== 'string') {
      warnings.push(`${label}: '${pathLabel}' must be a string`);
    } else {
      if (schema.minLength && data.length < schema.minLength)
        warnings.push(`${label}: '${pathLabel}' must be at least ${schema.minLength} character(s)`);
      if (schema.pattern && !new RegExp(schema.pattern).test(data))
        warnings.push(`${label}: '${pathLabel}' must match pattern ${schema.pattern}`);
    }
  }

  if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      warnings.push(`${label}: '${pathLabel}' must be an array`);
    } else {
      if (schema.minItems && data.length < schema.minItems)
        warnings.push(`${label}: '${pathLabel}' must contain at least ${schema.minItems} item(s)`);
      if (schema.items) {
        data.forEach((item, index) => {
          warnings.push(...validateJsonSchemaSubset(schema.items, item, label, `${pathLabel}[${index}]`));
        });
      }
    }
  }

  if (schema.type && !['object', 'string', 'array'].includes(schema.type)) {
    warnings.push(`${label}: '${pathLabel}' uses unsupported schema type ${describeExpected(schema.type)}`);
  }

  for (const clause of schema.allOf || []) {
    const expectedConst = clause.if?.properties?.asset_type?.const;
    if (expectedConst && data?.asset_type === expectedConst && clause.then) {
      warnings.push(...validateJsonSchemaSubset(clause.then, data, label, pathLabel));
    }
  }

  return warnings;
}

function validateAsset(kind, label, text, expectedName) {
  const errors = [];
  const schema = SCHEMAS[kind];
  const fm = parseFrontmatter(text);
  if (fm.error) {
    errors.push(`${label}: ${fm.error}`);
    return errors;
  }
  if (!fm.present) {
    if (!schema.frontmatterOptional) errors.push(`${label}: missing frontmatter block`);
    return errors;
  }
  const data = fm.data;
  const allowed = { ...schema.required, ...schema.optional };
  for (const [key, type] of Object.entries(schema.required)) {
    if (!(key in data)) errors.push(`${label}: missing required key '${key}'`);
    else if (!typeOk(data[key], type)) errors.push(`${label}: '${key}' must be a non-empty ${type}`);
  }
  for (const [key, val] of Object.entries(data)) {
    if (!(key in allowed)) {
      errors.push(`${label}: unknown frontmatter key '${key}'`);
      continue;
    }
    if (key in schema.optional && !typeOk(val, allowed[key]))
      errors.push(`${label}: '${key}' must be a non-empty ${allowed[key]}`);
  }
  if (expectedName && typeof data.name === 'string' && data.name !== expectedName)
    errors.push(`${label}: name '${data.name}' must match '${expectedName}'`);
  return errors;
}

function validateDraftAssetMetadata(kind, label, text, draftSchema) {
  const warnings = [];
  const fm = parseFrontmatter(text);
  if (fm.error) {
    warnings.push(`${label}: draft metadata schema skipped because frontmatter is invalid: ${fm.error}`);
    return warnings;
  }
  if (!fm.present) {
    warnings.push(`${label}: missing draft asset metadata frontmatter for asset_type '${kind}'`);
    return warnings;
  }

  warnings.push(...validateJsonSchemaSubset(draftSchema, fm.data, label));
  if (typeof fm.data.asset_type === 'string' && fm.data.asset_type !== kind) {
    warnings.push(`${label}: asset_type '${fm.data.asset_type}' should match '${kind}'`);
  }
  return warnings;
}

const read = (p) => fs.readFileSync(p, 'utf8');

function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join(dir, e.name));
}

function walkMd(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(abs));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(abs);
  }
  return out;
}

export function checkAssetSchemas(assetRoot = DEFAULT_ASSET_ROOT) {
  const errors = [];
  const warnings = [];
  let checked = 0;
  const label = (p) => `assets/${path.relative(assetRoot, p)}`;
  const draftSchema = loadJsonSchema();

  for (const f of listMd(path.join(assetRoot, 'agents'))) {
    checked++;
    errors.push(...validateAsset('agent', label(f), read(f), path.basename(f, '.md')));
  }

  for (const f of listMd(path.join(assetRoot, 'commands'))) {
    checked++;
    errors.push(...validateAsset('command', label(f), read(f), null));
  }

  const skillsDir = path.join(assetRoot, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        errors.push(`assets/skills/${entry.name}: missing SKILL.md`);
        continue;
      }
      checked++;
      errors.push(
        ...validateAsset('skill', `assets/skills/${entry.name}/SKILL.md`, read(skillFile), entry.name)
      );
    }
  }

  for (const f of walkMd(path.join(assetRoot, 'rules'))) {
    checked++;
    errors.push(...validateAsset('rule', label(f), read(f), null));
  }

  for (const [dirName, assetType] of [
    ['prompts', 'prompt'],
    ['templates', 'template'],
    ['knowhow', 'knowhow'],
  ]) {
    for (const f of walkMd(path.join(assetRoot, dirName))) {
      warnings.push(...validateDraftAssetMetadata(assetType, label(f), read(f), draftSchema));
    }
  }

  return { errors, warnings, checked };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { errors, warnings, checked } = checkAssetSchemas();
  if (warnings.length) {
    console.warn(`asset draft metadata warnings (${warnings.length}, non-blocking):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  if (errors.length) {
    console.error(`asset schema validation FAILED (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('\nFix the asset frontmatter, or update SCHEMAS in scripts/check-asset-schema.js if a new key is intended.');
    process.exit(1);
  }
  console.log(`asset schema validation OK (${checked} assets: agents, commands, skills, rules)`);
}
