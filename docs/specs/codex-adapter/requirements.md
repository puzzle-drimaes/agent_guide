# Codex Adapter Requirements

## Context

`agent-deploy` already supports Claude and Cursor adapters. The company rollout plan defines Codex as a first-priority target, with project scope as the default install scope and semantic equivalence across harnesses.

## Scope

Implement the first Codex target adapter for `agent-deploy`.

In scope:

- Register `codex` as an install target.
- Install project-scoped Codex instructions into `AGENTS.md` without destructively replacing user-authored content.
- Copy canonical rules into `.agents/rules/`.
- Copy canonical skills into `.agents/skills/`.
- Copy canonical subagents into `.codex/agents/`.
- Merge approved MCP servers into `.codex/config.toml` with add-only TOML behavior.
- Record unsupported capabilities, especially slash commands, as visible skip operations with reasons.
- Write Codex install state to `.agent-deploy/install-state.json`.
- Add smoke coverage for Codex plan/apply behavior.

Out of scope:

- Gemini adapter implementation.
- Full uninstall/rollback lifecycle.
- Complete TOML parser support for every TOML feature.
- Network validation of MCP servers.

## Requirements

### R1. Target registration

`agent-deploy list`, `plan`, and `apply` must accept `--target codex`.

### R2. Project layout

For project scope, applying the `developer` profile to Codex must create this effective layout:

```text
project/
  AGENTS.md
  .agents/
    rules/
    skills/
  .codex/
    agents/
    config.toml
  .agent-deploy/
    install-state.json
```

### R3. Non-destructive root instruction

`AGENTS.md` must be updated by a managed block so existing content is preserved. Re-running apply should replace the managed block rather than appending duplicates.

### R4. Rules and skills

Canonical `rules/**` and `skills/**` assets must preserve their relative layout under `.agents/` for project scope.

### R5. Agents

Canonical `agents/*.md` assets must be copied under `.codex/agents/`.

### R6. MCP TOML merge

Canonical `mcp/servers.json` must be converted to Codex TOML sections under `[mcp_servers.<name>]` and merged into `.codex/config.toml` add-only:

- Existing unrelated TOML content is preserved.
- Existing MCP server keys are not overwritten.
- Missing MCP server sections and missing keys are added.

### R7. Unsupported command capability

Canonical `commands/**` must not be silently dropped. The Codex adapter must emit skip operations with explicit reasons.

### R8. Safety and provenance

Codex operations must use the existing path-safety, symlink guard, dry-run, and install-state flow. State must include selected modules, skipped modules, operations, scope, and skip reasons.

## Acceptance criteria

- Manifest validation passes.
- Codex `minimal` profile writes `AGENTS.md`, `.agents/rules/common/security.md`, and `.agent-deploy/install-state.json`.
- Codex `developer` profile writes rules, skill, agents, `.codex/config.toml`, and a command skip reason.
- Existing `.codex/config.toml` keys survive MCP merge.
- Existing `AGENTS.md` content survives and managed block is idempotent.
