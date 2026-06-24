# Kiro Adapter Design

작성일: 2026-06-24

## Design decision

Kiro project scope maps to `.kiro/` in the workspace root. Official Kiro docs describe workspace steering at `.kiro/steering/`, workspace skills at `.kiro/skills/`, and workspace MCP config at `.kiro/settings/mcp.json`. The adapter therefore uses those native surfaces first, then falls back to explicit Markdown reference files for assets without a confirmed native schema.

## Layout mapping

| Canonical asset | Kiro destination | Strategy |
|---|---|---|
| `assets/rules/**` | `.kiro/steering/<flattened>.md` | Kiro steering, flattened to top-level files |
| baseline root instruction | `.kiro/steering/company-agent-deploy.md` | managed Markdown block |
| `assets/skills/**` | `.kiro/skills/**` | native Agent Skills layout |
| `assets/agents/**` | `.kiro/agents/**` | instruction-backed fallback |
| `assets/commands/**` | `.kiro/commands/**` | instruction-backed command fallback |
| `assets/prompts/**` | `.kiro/prompts/**` | prompt/template reference files |
| `assets/mcp/servers.json` | `.kiro/settings/mcp.json` | allowlist + `DISABLED_MCPS` + JSON merge |
| install-state | `.agent-deploy/install-state.json` | shared project-scope provenance |

## Rule flattening

Kiro docs document steering files under `.kiro/steering/`. To avoid assuming recursive subdirectory loading, canonical rule paths are flattened:

```text
rules/common/security.md                  -> .kiro/steering/common-security.md
rules/developer/spec-driven-development.md -> .kiro/steering/developer-spec-driven-development.md
```

The adapter preserves file contents and relies on Kiro's default always-included steering behavior for core rule files.

## MCP

Kiro MCP uses JSON with a top-level `mcpServers` object. The adapter reuses the shared MCP governance layer and writes the filtered payload into `.kiro/settings/mcp.json`. Existing unrelated server keys remain present via the shared JSON merge behavior.

## Safety

The adapter uses the existing `createAdapter` factory, planner, conflict policy, path-safety, symlink guard, dry-run, backup, update, repair, uninstall, and install-state flows. Kiro-specific choices stay inside `src/targets/kiro.js`.

## Risks

- Kiro-native custom agent or command schemas may evolve. Current implementation treats these as fallback Markdown references instead of inventing a schema.
- Kiro hook/power support is intentionally not generated in this adapter; those should be a separate spec because hooks can execute prompts or shell commands.
