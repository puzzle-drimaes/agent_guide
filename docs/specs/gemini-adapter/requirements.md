# Gemini Adapter Requirements

## Context

`agent-deploy` now supports Codex, Claude, and Cursor. The rollout plan identifies Gemini as the next first-wave target after Codex/Claude. Gemini support must preserve the same company method while using Gemini-oriented project files and capability-aware fallbacks.

## Scope

Implement the first Gemini target adapter for `agent-deploy`.

In scope:

- Register `gemini` as an install target.
- Install project-scoped Gemini root instructions into `GEMINI.md` without destructively replacing user content.
- Copy canonical rules into `.gemini/rules/` as instruction-backed rule references.
- Copy canonical commands into `.gemini/commands/`.
- Copy canonical agents into `.gemini/agents/` as role prompt fallbacks.
- Copy canonical skills into `.gemini/skills/` as instruction-backed workflow fallbacks.
- Record unsupported MCP capability as visible skip operations with reasons for the MVP.
- Write Gemini install state to `.agent-deploy/install-state.json`.
- Add smoke coverage for Gemini plan/apply behavior.

Out of scope:

- Native Gemini extension packaging beyond project files.
- Network validation of MCP servers.
- Full uninstall/rollback lifecycle.
- Converting Markdown commands into a future Gemini-specific TOML schema.

## Requirements

### R1. Target registration

`agent-deploy list`, `plan`, and `apply` must accept `--target gemini`.

### R2. Project layout

Applying the `developer` profile to Gemini must create this effective layout:

```text
project/
  GEMINI.md
  .gemini/
    rules/
    commands/
    agents/
    skills/
  .agent-deploy/
    install-state.json
```

### R3. Non-destructive root instruction

`GEMINI.md` must be updated by a managed block so existing content is preserved. Re-running apply should replace the managed block rather than appending duplicates.

### R4. Rules

Canonical `rules/**` assets must preserve their relative layout under `.gemini/rules/` and be referenced by the managed root instruction block.

### R5. Commands

Canonical `commands/**` assets must be installed under `.gemini/commands/` for instruction-backed command use.

### R6. Agents and skills fallback

Canonical `agents/**` and `skills/**` assets must be installed under `.gemini/agents/` and `.gemini/skills/` respectively as fallback prompt/workflow references.

### R7. MCP skip reason

Canonical `mcp/**` must not be silently dropped. The Gemini adapter must emit skip operations with explicit reasons until the Gemini MCP config policy is finalized.

### R8. Safety and provenance

Gemini operations must use the existing path-safety, symlink guard, dry-run, and install-state flow. State must include selected modules, skipped modules, operations, scope, and skip reasons.

## Acceptance criteria

- Manifest validation passes.
- Gemini `minimal` profile writes `GEMINI.md`, `.gemini/rules/common/security.md`, and `.agent-deploy/install-state.json`.
- Gemini `developer` profile writes rules, commands, agents, skills, and an MCP skip reason.
- Existing `GEMINI.md` content survives and the managed block is idempotent.
- Full smoke test passes.
