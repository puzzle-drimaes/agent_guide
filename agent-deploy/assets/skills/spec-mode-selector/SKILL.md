---
name: spec-mode-selector
description: Decide SDD-none, SDD-lite, or SDD-full from a user request and proceed without unnecessary QnA.
---

# Spec Mode Selector

Use this skill when a task needs an explicit Spec Driven Development mode or when the user mentions SDD/spec mode.

## Required context

Read the installed Spec Driven Development rule for the current harness before acting:

```text
Codex:  .agents/rules/developer/spec-driven-development.md
Claude: .claude/rules/developer/spec-driven-development.md
Gemini: .gemini/rules/developer/spec-driven-development.md
Cursor: .cursor/rules/developer-spec-driven-development.mdc
Kiro:   .kiro/steering/developer-spec-driven-development.md
```

If the local harness uses another rule location, use the semantically equivalent installed rule file.

## Workflow

1. Analyze the user request.
2. Select `SDD-none`, `SDD-lite`, or `SDD-full`.
3. Do not ask the user unless the rule allows an exception.
4. State assumptions briefly when needed.
5. Follow the selected flow.
6. Escalate the mode if the work grows.

## Output at start

For non-trivial work, include:

```text
SDD mode: none | lite | full
Reason:
Proceeding with:
```

For very small `none` tasks, keep this implicit and answer directly.
