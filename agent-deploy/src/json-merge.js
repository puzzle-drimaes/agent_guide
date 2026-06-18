// Non-destructive JSON merge (ported from ECC scripts/lib/install/apply.js).
// Existing user keys are preserved; our payload only adds/overrides leaf keys.
// This is what lets us inject company standards into a developer's existing
// .mcp.json / settings without clobbering their personal config.

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function deepMergeJson(base, patch) {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return cloneJson(patch);
  }
  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = deepMergeJson(merged[key], value);
    } else {
      merged[key] = cloneJson(value);
    }
  }
  return merged;
}
