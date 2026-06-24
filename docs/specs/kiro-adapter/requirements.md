# Kiro Adapter Requirements

작성일: 2026-06-24

## Background

`agent-deploy` supports Codex, Claude, Gemini, and Cursor. The rollout now needs Kiro as a first-class target so the setup wizard can recommend/install company Markdown assets for Kiro workspaces.

Sources used:

- Kiro Steering docs, checked 2026-06-24: https://kiro.dev/docs/steering/
- Kiro Agent Skills docs, checked 2026-06-24: https://kiro.dev/docs/skills/
- Kiro MCP configuration docs, checked 2026-06-24: https://kiro.dev/docs/mcp/configuration/
- Local reference: `references/ECC/.kiro/` installer and docs, checked 2026-06-24.

## Goal

Add a `kiro` target adapter that installs the same company rules, skills, prompts, agents, commands, and governed MCP baseline with Kiro-appropriate project-scope layout.

## In scope

- Register `kiro` in the adapter registry and module target matrix.
- Install common/developer rules as Kiro workspace steering files under `.kiro/steering/`.
- Install Agent Skills under `.kiro/skills/`.
- Install agents, prompts, and commands as instruction-backed fallback files under `.kiro/`.
- Merge governed MCP config into `.kiro/settings/mcp.json`.
- Write install state to `.agent-deploy/install-state.json`.
- Add smoke coverage for minimal/developer/idempotent Kiro installs.
- Update setup wizard and user-facing support docs to include Kiro.

## Out of scope

- Creating Kiro hooks or powers.
- Guessing a Kiro-native custom agent schema beyond instruction-backed fallback files.
- Changing the global project-scope default.
- Rebuilding/publishing the release zip unless requested separately.

## Acceptance criteria

- `node src/cli.js list` includes `kiro`.
- `kiro` + `minimal` installs `.kiro/steering/company-agent-deploy.md`, flattened common steering files, feedback skill, and shared install-state.
- `kiro` + `developer` installs developer steering, skills, agent/command/prompt fallbacks, and governed MCP JSON.
- Unsupported or non-native capabilities are not silently dropped.
- `npm --prefix agent-deploy run validate` passes.
- `npm --prefix agent-deploy test` passes.
