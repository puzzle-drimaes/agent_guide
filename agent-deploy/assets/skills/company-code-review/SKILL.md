---
name: company-code-review
description: Run the company Review Before Done workflow on a change — self-review, invoke the reviewer agents, and gate human approval before marking work complete. Triggers on "review before done", "is this ready", "review my change".
allowed-tools: ["Read", "Grep", "Glob"]
argument-hint: "[path or diff]"
---

# Company Code Review (Review Before Done)

Use this skill before claiming a change is done. No non-trivial change is complete
until it has passed review.

## Required context

Read the diff itself first. Then read the installed developer rules for the current
harness so review checks the layer/style the rules define:

```text
Codex:  .agents/rules/developer/
Claude: .claude/rules/developer/
Gemini: .gemini/rules/developer/
Cursor: .cursor/rules/developer-*.mdc
Kiro:   .kiro/steering/developer-*.md
```

## Workflow

1. **Self-review** the diff against the checklist below.
2. **Correctness** — delegate to the `code-reviewer` agent (read-only) for bug review.
3. **Architecture** — for structural changes, run the `architecture-review` skill
   (layer/boundary violations).
4. **Evidence** — confirm tests/verification were actually run, and record results.
   Do not claim "passing" without the command output.
5. **Gate** — important or risky changes need explicit human approval; flag them as
   **needs approval** and do not self-approve.

## Self-review checklist

- Does the change do what the requirement asked, and nothing it did not?
- Are errors and edge cases handled, not just the happy path?
- New/changed behavior covered by a test?
- Any secret, credential, or sensitive data introduced? (must be none)
- External material used? Source/license recorded? (`source-attribution` rule)
- Does it match the existing project structure and naming?

## Output

```text
Reviewed: <files / diff>
Findings:
- file:line — severity — issue — suggested fix
Verification: <command> → <result>
Status: ready | needs approval | changes required
```

Skip style nits already enforced by the rules layer. If nothing blocks, say so
plainly with the evidence; do not invent findings.
