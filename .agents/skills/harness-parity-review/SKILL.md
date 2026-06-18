---
name: harness-parity-review
description: Review whether agent rules preserve semantic equivalence across Claude, Codex, Gemini, and other harnesses.
---

# Harness Parity Review

## Required context

Read these files first:

```text
AGENTS.md
.agents/rules/developer/harness-engineering.md
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
```

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

