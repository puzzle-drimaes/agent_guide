#!/usr/bin/env node
// CI guard (modeled on ECC scripts/ci/validate-install-manifests.js).
// Catches drift between the manifests and reality BEFORE it ships:
//   1. every module source path exists under assets/
//   2. every module target is a known adapter
//   3. dependencies reference known modules; no cycles
//   4. every profile references known modules
//   5. no two modules write to the same destination for the same target
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifests, ASSET_ROOT } from '../src/manifest.js';
import { listAdapters, getAdapter, listTargets } from '../src/targets/registry.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const errors = [];

const { modulesDoc, profilesDoc, byId } = loadManifests(ROOT);
const knownTargets = new Set(listTargets());

// 1 + 2: paths exist, targets known
for (const m of modulesDoc.modules) {
  for (const p of m.paths) {
    if (!fs.existsSync(path.join(ASSET_ROOT, p))) {
      errors.push(`module '${m.id}': source path 'assets/${p}' does not exist`);
    }
  }
  for (const t of m.targets) {
    if (!knownTargets.has(t)) errors.push(`module '${m.id}': unknown target '${t}'`);
  }
}

// 3: deps known + acyclic
for (const m of modulesDoc.modules) {
  for (const dep of m.dependencies || []) {
    if (!byId.has(dep)) errors.push(`module '${m.id}': unknown dependency '${dep}'`);
  }
}
(function detectCycles() {
  const state = new Map(); // 0=visiting, 1=done
  const visit = (id, trail) => {
    if (state.get(id) === 1) return;
    if (state.get(id) === 0) {
      errors.push(`dependency cycle: ${[...trail, id].join(' -> ')}`);
      return;
    }
    const m = byId.get(id);
    if (!m) return;
    state.set(id, 0);
    for (const dep of m.dependencies || []) visit(dep, [...trail, id]);
    state.set(id, 1);
  };
  for (const m of modulesDoc.modules) visit(m.id, []);
})();

// 4: profiles reference known modules
for (const [name, ids] of Object.entries(profilesDoc.profiles)) {
  for (const id of ids) {
    if (!byId.has(id)) errors.push(`profile '${name}': unknown module '${id}'`);
  }
}

// 5: destination collisions across modules, per target
for (const adapter of listAdapters()) {
  const claimed = new Map(); // dest -> moduleId
  for (const m of modulesDoc.modules) {
    if (!adapter.supportsModule(m)) continue;
    const ops = adapter.planOperations({
      assetRoot: ASSET_ROOT,
      projectRoot: '/tmp/agent-deploy-validate',
      modules: [m],
    });
    for (const op of ops) {
      if (!op.dest) continue; // skip ops (unsupported capability) have no destination
      const prev = claimed.get(op.dest);
      if (prev && prev !== m.id) {
        errors.push(`target '${adapter.target}': '${m.id}' and '${prev}' both write ${op.dest}`);
      }
      claimed.set(op.dest, m.id);
    }
  }
}

if (errors.length) {
  console.error(`manifest validation FAILED (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('manifest validation OK');
