# Company Core Assets Requirements

## Context

The project canonical rules currently live under `.agents/rules/`. `agent-deploy` already installs starter assets for Codex, Claude, Gemini, and Cursor, but its asset set only contains a subset of the company common/developer rules. The next rollout step is to promote company core rules and related workflow skills into `agent-deploy/assets` so every supported harness receives the same operating method from one deployable asset source.

## SDD mode

SDD-full, because this changes deployable asset structure, module/profile manifests, and cross-harness smoke coverage.

## Scope

In scope:

- Reflect core rules from `.agents/rules/common` and `.agents/rules/developer` into `agent-deploy/assets/rules`.
- Add deployable skills for Spec Driven Development and harness parity/engineering workflows under `agent-deploy/assets/skills`.
- Keep existing architecture and commit convention workflows available to developer installs.
- Update `modules.json` and `profiles.json` so modules are scoped precisely and profiles install the intended core set.
- Add or strengthen Codex, Claude, and Gemini smoke tests for common rules, developer rules, skills, and install-state/skip behavior.
- Update TODO/Finish after verification.

Out of scope:

- Changing adapter file-layout policies.
- Uninstall/rollback lifecycle.
- Finalizing Gemini MCP native config policy.
- Publishing a release bundle.

## Requirements

### R1. Common company rules

`agent-deploy/assets/rules/common` must include the company AI principles, security, source attribution, and knowledge-sharing rules. The `minimal` profile must install these common rules for Codex, Claude, and Gemini.

### R2. Developer core rules

`agent-deploy/assets/rules/developer` must include architecture, Git commit convention, harness engineering, and spec-driven-development rules. Developer/full profiles must install them without accidentally pulling developer rules into the minimal profile.

### R3. Workflow skills

`agent-deploy/assets/skills` must include deployable skills for:

- Spec mode selection / SDD flow execution.
- Harness parity review / harness engineering checks.
- Commit message writing, because the commit convention is part of the developer core rule set.

Existing architecture review skill must remain installable.

### R4. Manifest precision

Modules must point to precise paths so independent rule modules do not collide. Dependency expansion must keep required common rules installed first. Profiles must include the correct modules for `minimal`, `core`, `developer`, and `full`.

### R5. Cross-harness parity

Codex, Claude, and Gemini developer installs must include the same semantic core rule/skill set, using each adapter's native or fallback layout. Unsupported capabilities must still be recorded with skip reasons.

### R6. Safety and provenance

The change must preserve existing path-safety, symlink guard, dry-run, install-state, and non-destructive merge behavior.

## Acceptance criteria

- Manifest validation passes.
- Full smoke tests pass.
- Codex minimal install writes common core rules under `.agents/rules/common`.
- Claude developer install writes developer core rules and workflow skills under `.claude`.
- Codex developer install writes developer core rules and workflow skills under `.agents`.
- Gemini developer install writes developer core rules and fallback workflow skills under `.gemini`.
- Developer installs still record Codex command skip and Gemini MCP skip reasons.
- TODO/Finish and this spec review are updated with the result.
