import fs from 'node:fs';
import path from 'node:path';
import { CONFLICT_DECISIONS } from './conflicts.js';

const DECISIONS = new Set(CONFLICT_DECISIONS);
const ALLOWED_KEYS = new Set([
  'proposed',
  'conflictsWith',
  'decision',
  'decidedBy',
  'decidedAt',
  'reason',
  'packId',
  'packDigest',
]);
const REQUIRED_KEYS = ['proposed', 'conflictsWith', 'decision', 'decidedBy', 'reason'];

function labelFor(index, sourcePath) {
  return `${sourcePath || 'conflictResolutions'}[${index}]`;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateRecord(record, index, sourcePath) {
  const errors = [];
  const label = labelFor(index, sourcePath);
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { errors: [`${label}: entry must be an object`], value: null };
  }

  for (const key of Object.keys(record)) {
    if (!ALLOWED_KEYS.has(key)) errors.push(`${label}: unknown key '${key}'`);
  }
  for (const key of REQUIRED_KEYS) {
    if (!isNonEmptyString(record[key])) errors.push(`${label}: '${key}' must be a non-empty string`);
  }
  if ('decidedAt' in record && !isNonEmptyString(record.decidedAt)) {
    errors.push(`${label}: 'decidedAt' must be a non-empty string when present`);
  }
  if ('packId' in record && !isNonEmptyString(record.packId)) {
    errors.push(`${label}: 'packId' must be a non-empty string when present`);
  }
  if ('packDigest' in record && !/^sha256:[a-f0-9]{64}$/.test(record.packDigest || '')) {
    errors.push(`${label}: 'packDigest' must be sha256:<64-hex> when present`);
  }
  if ('decision' in record && !DECISIONS.has(record.decision)) {
    errors.push(`${label}: decision must be one of ${CONFLICT_DECISIONS.join(', ')}`);
  }

  return {
    errors,
    value: {
      proposed: record.proposed,
      conflictsWith: record.conflictsWith,
      decision: record.decision,
      decidedBy: record.decidedBy,
      ...(record.decidedAt !== undefined ? { decidedAt: record.decidedAt } : {}),
      reason: record.reason,
      ...(record.packId !== undefined ? { packId: record.packId } : {}),
      ...(record.packDigest !== undefined ? { packDigest: record.packDigest } : {}),
    },
  };
}

export function normalizeConflictResolutions(input, { sourcePath } = {}) {
  const list = Array.isArray(input) ? input : input?.conflictResolutions;
  if (list === undefined) return [];
  if (!Array.isArray(list)) {
    throw new Error(`${sourcePath || 'conflictResolutions'}: expected an array or object with conflictResolutions array`);
  }

  const errors = [];
  const values = [];
  for (const [index, record] of list.entries()) {
    const result = validateRecord(record, index, sourcePath);
    errors.push(...result.errors);
    if (result.value) values.push(result.value);
  }
  if (errors.length) throw new Error(`conflict resolution validation failed: ${errors.join('; ')}`);
  return values;
}

export function readConflictResolutionsFile(filePath) {
  const resolved = path.resolve(filePath);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (error) {
    throw new Error(`conflict resolution file '${resolved}' is invalid JSON: ${error.message}`);
  }
  return normalizeConflictResolutions(parsed, { sourcePath: resolved });
}
