// Planner: turn a request into a concrete, inspectable install plan.
// Plan and apply are deliberately separate so `--dry-run` can show exactly
// what would change before anything is written.
import { getAdapter } from './targets/registry.js';
import { loadManifests, resolveRequest, ASSET_ROOT } from './manifest.js';

// request: { target, profile?, moduleIds?, scope?, projectRoot?, homeDir? }
//   scope: 'home' (user-global config dir) | 'project' (a repo). Library default
//   is 'project' for safety; the CLI defaults to 'home'.
export function buildPlan(request) {
  const adapter = getAdapter(request.target);
  const manifests = loadManifests();
  const input = {
    assetRoot: ASSET_ROOT,
    scope: request.scope || 'project',
    projectRoot: request.projectRoot,
    homeDir: request.homeDir,
  };

  const issues = adapter.validate(input).filter((i) => i.severity === 'error');
  if (issues.length) throw new Error(issues.map((i) => i.message).join('; '));

  const resolution = resolveRequest(request, manifests, adapter);
  const operations = adapter.planOperations({ ...input, modules: resolution.selected });

  return {
    adapter,
    input,
    request,
    resolution,
    scope: adapter.scopeOf(input),
    manifestVersion: manifests.modulesDoc.version,
    baseRoot: adapter.baseRoot(input), // safety boundary for apply
    targetRoot: adapter.resolveRoot(input),
    statePath: adapter.statePath(input),
    operations,
  };
}
