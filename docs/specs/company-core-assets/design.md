# Company Core Assets Design

## Asset promotion strategy

`.agents/rules/` remains the project canonical rule source during this repository phase. The promoted deployable copy lives under `agent-deploy/assets/rules/` and preserves the same category layout:

```text
agent-deploy/assets/rules/
  common/
    company-ai-principles.md
    knowledge-sharing.md
    security.md
    source-attribution.md
  developer/
    architecture.md
    git-commit-convention.md
    harness-engineering.md
    spec-driven-development.md
```

This keeps adapter logic unchanged: adapters already mirror `rules/**` into the target-specific layout.

## Module design

Rules are split into precise modules instead of one broad `rules/developer` module. This prevents the architecture module from owning every developer rule after the new files are added.

```text
baseline-rules                 -> rules/common
language-rules                 -> rules/python
architecture-rules             -> rules/developer/architecture.md
harness-engineering-rules      -> rules/developer/harness-engineering.md
spec-driven-development-rules  -> rules/developer/spec-driven-development.md
commit-convention-rules        -> rules/developer/git-commit-convention.md
```

Workflow skill modules depend on their rule modules:

```text
architecture-review-skill      -> architecture-rules
spec-mode-selector-skill       -> spec-driven-development-rules
harness-parity-review-skill    -> harness-engineering-rules
commit-message-writer-skill    -> commit-convention-rules
```

## Profile design

- `minimal`: common baseline only.
- `core`: common baseline + review agent + approved MCP baseline.
- `developer`: common baseline, language rule, all developer core rules, related skills/agents, planning command, MCP baseline.
- `full`: currently same as developer until advanced governance assets are added.

## Skill content strategy

Skills in `agent-deploy/assets/skills` are target-neutral. They avoid hardcoding only `.agents/...` paths because Claude and Gemini adapters install the same skill content under `.claude/skills` or `.gemini/skills`. Each skill tells the agent to read the installed rule file for its harness, with examples for Codex, Claude, and Gemini.

## Smoke coverage strategy

The smoke test remains a round-trip plan/apply test. Coverage is strengthened at the target-layout level:

- Claude developer: `.claude/rules/developer/*` and `.claude/skills/*`.
- Codex developer: `.agents/rules/developer/*`, `.agents/skills/*`, `.codex/agents/*`, TOML MCP, command skip.
- Gemini developer: `.gemini/rules/developer/*`, `.gemini/skills/*`, commands/agents fallback, MCP skip.
- Minimal: common rules present, developer rules absent.

## Risks

- Promoted asset copies can drift from `.agents/rules`. Mitigation: keep this explicit in TODO as a future drift check/asset sync task.
- Some skill frontmatter is interpreted differently by harnesses. Mitigation: keep frontmatter minimal and make the body target-neutral.
- Gemini native surfaces may evolve. Existing fallback layout remains valid until a future adapter update.
