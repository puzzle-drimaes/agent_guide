---
name: harness-parity-review
description: Review whether agent rules preserve semantic equivalence across Claude, Codex, Gemini, and other harnesses.
---

# Harness Parity Review

Use this skill when reviewing agent-deploy assets, target adapters, root instruction files, or harness-specific fallbacks.

## Required context

Read the installed harness engineering rule for the current harness before reviewing:

```text
Codex:  .agents/rules/developer/harness-engineering.md
Claude: .claude/rules/developer/harness-engineering.md
Gemini: .gemini/rules/developer/harness-engineering.md
Cursor: .cursor/rules/developer-harness-engineering.mdc
Kiro:   .kiro/steering/developer-harness-engineering.md
```

If available in the repository, also read the root instruction file for each affected harness (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) and the rollout harness engineering plan.

## Checklist

- Is there a canonical source for the rule?
- Do tool-specific files preserve the same meaning?
- Are unsupported features handled with fallback or explicit skip reason?
- Is project scope the default?
- Does the installer record install-state/provenance?
- Are target-specific branches contained in adapters?
- Does dry-run use the same plan as actual install?

## Output

```text
Finding:
- target:
- canonical source:
- mismatch:
- risk:
- minimal fix:
```
