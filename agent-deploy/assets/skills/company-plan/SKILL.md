---
name: company-plan
description: Plan a non-trivial change the company way — restate, judge SDD mode, gather evidence, produce a numbered plan, and gate before writing code. Triggers on "plan this", "make a plan", "how should we build".
argument-hint: "[feature or change description]"
---

# Company Plan (Plan First)

Use this skill before implementing any non-trivial change. It is the cross-harness
form of the `/plan` command: harnesses without slash commands (Codex, Cursor, Kiro) get
the same Plan First workflow here.

## Required context

Read the installed Spec Driven Development rule for the current harness first, so
the plan depth matches the chosen SDD mode:

```text
Codex:  .agents/rules/developer/spec-driven-development.md
Claude: .claude/rules/developer/spec-driven-development.md
Gemini: .gemini/rules/developer/spec-driven-development.md
Cursor: .cursor/rules/developer-spec-driven-development.mdc
Kiro:   .kiro/steering/developer-spec-driven-development.md
```

If the local harness uses another rule location, use the semantically equivalent
installed rule file.

## Workflow

1. **Restate** the requirement in your own words.
2. **Judge SDD mode** (`none` / `lite` / `full`) — see the spec-mode-selector skill.
   For `full`, plan the `docs/specs/<feature>/` artifacts (see spec-writing skill).
3. **Gather evidence** — read the affected files/structure before claiming a plan.
   Do not plan against assumptions you have not checked.
4. **List risks and unknowns**, with the assumptions you are proceeding on.
5. **Produce a numbered implementation plan** scoped to the SDD mode.

## Gate

For `lite`/`full` work, present the plan and **wait for explicit user confirmation**
before writing implementation code. Only skip the gate for trivial `none` tasks.

Ask the user a question only for the rule-defined exceptions (destructive work,
security/credentials, cost, external deploy, conflicting requirements). Otherwise
state assumptions and proceed.

## Output at start

```text
SDD mode: none | lite | full
Restated requirement:
Risks / unknowns:
Plan:
1. ...
2. ...
```
