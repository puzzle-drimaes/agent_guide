// Minimal add-only TOML merge support for installer-managed config snippets.
// This intentionally handles the TOML shape we generate for Codex MCP servers:
// tables, scalar keys, arrays, and nested object tables. It is not a full TOML
// parser; it preserves unrelated content and never overwrites existing keys.

function quoteTomlString(value) {
  return JSON.stringify(String(value));
}

function quoteTablePart(part) {
  return /^[A-Za-z0-9_-]+$/.test(part) ? part : quoteTomlString(part);
}

function actualTableHeader(pathParts) {
  return `[${pathParts.map(quoteTablePart).join('.')}]`;
}

function encodeTomlValue(value) {
  if (typeof value === 'string') return quoteTomlString(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) return `[${value.map(encodeTomlValue).join(', ')}]`;
  return quoteTomlString(value);
}

function splitLines(text) {
  return text ? text.split(/\r?\n/) : [];
}

function findTable(lines, pathParts) {
  const header = actualTableHeader(pathParts);
  const start = lines.findIndex((line) => line.trim() === header);
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s*\[[^\]]+\]\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function hasKey(lines, range, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^\\s*${escaped}\\s*=`);
  for (let i = range.start + 1; i < range.end; i += 1) {
    if (pattern.test(lines[i])) return true;
  }
  return false;
}

function appendTable(lines, pathParts, entries) {
  if (lines.length && lines[lines.length - 1] !== '') lines.push('');
  lines.push(actualTableHeader(pathParts));
  for (const [key, value] of entries) {
    lines.push(`${key} = ${encodeTomlValue(value)}`);
  }
}

function upsertTable(lines, pathParts, entries) {
  if (!entries.length) return;
  const range = findTable(lines, pathParts);
  if (!range) {
    appendTable(lines, pathParts, entries);
    return;
  }

  const missing = entries.filter(([key]) => !hasKey(lines, range, key));
  if (!missing.length) return;
  const insertAt = range.end;
  lines.splice(insertAt, 0, ...missing.map(([key, value]) => `${key} = ${encodeTomlValue(value)}`));
}

function flattenTables(prefix, object, out) {
  const entries = [];
  const nested = [];
  for (const [key, value] of Object.entries(object || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      nested.push([key, value]);
    } else if (value !== undefined && value !== null) {
      entries.push([key, value]);
    }
  }
  out.push({ pathParts: prefix, entries });
  for (const [key, value] of nested) {
    flattenTables([...prefix, key], value, out);
  }
}

export function mergeTomlAddOnly(currentText, payload) {
  const lines = splitLines(currentText).filter((line, index, arr) => !(index === arr.length - 1 && line === ''));
  const tables = [];
  flattenTables([], payload, tables);

  for (const table of tables) {
    if (!table.pathParts.length) continue;
    upsertTable(lines, table.pathParts, table.entries);
  }

  return `${lines.join('\n').replace(/\s+$/u, '')}\n`;
}
