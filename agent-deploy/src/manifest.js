// Manifest layer (modeled on ECC's components/modules/profiles, condensed to
// modules + profiles). Resolves a user request (profile and/or module ids)
// into an ordered, dependency-expanded, target-filtered module list.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

export const ASSET_ROOT = path.join(ROOT, 'assets');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadManifests(root = ROOT) {
  const modulesDoc = readJson(path.join(root, 'manifests', 'modules.json'));
  const profilesDoc = readJson(path.join(root, 'manifests', 'profiles.json'));
  const byId = new Map(modulesDoc.modules.map((m) => [m.id, m]));
  return { modulesDoc, profilesDoc, byId };
}

// Expand a set of seed module ids, pulling in dependencies, detecting unknown
// ids and cycles. Returns ids in dependency-first order.
function expandWithDeps(seedIds, byId) {
  const ordered = [];
  const visited = new Set();
  const onStack = new Set();

  const visit = (id, trail) => {
    if (visited.has(id)) return;
    if (onStack.has(id)) {
      throw new Error(`dependency cycle: ${[...trail, id].join(' -> ')}`);
    }
    const mod = byId.get(id);
    if (!mod) throw new Error(`unknown module: ${id}`);
    onStack.add(id);
    for (const dep of mod.dependencies || []) visit(dep, [...trail, id]);
    onStack.delete(id);
    visited.add(id);
    ordered.push(id);
  };

  for (const id of seedIds) visit(id, []);
  return ordered;
}

// request: { profile?, moduleIds?, target }
// returns: { selected: module[], skipped: { id, reason }[] , seedIds }
export function resolveRequest(request, manifests, adapter) {
  const { byId, profilesDoc } = manifests;
  const seeds = [];

  if (request.profile) {
    const list = profilesDoc.profiles[request.profile];
    if (!list) {
      throw new Error(
        `unknown profile: ${request.profile} (known: ${Object.keys(profilesDoc.profiles).join(', ')})`,
      );
    }
    seeds.push(...list);
  }
  for (const id of request.moduleIds || []) seeds.push(id);
  if (seeds.length === 0) throw new Error('no profile or modules requested');

  const orderedIds = expandWithDeps([...new Set(seeds)], byId);

  const selected = [];
  const skipped = [];
  for (const id of orderedIds) {
    const mod = byId.get(id);
    if (adapter.supportsModule(mod)) selected.push(mod);
    else skipped.push({ id, reason: `target '${adapter.target}' not in module.targets` });
  }
  return { selected, skipped, seedIds: [...new Set(seeds)] };
}
