---
name: spec-writing
description: Author SDD-full spec artifacts (requirements/design/tasks/review) under docs/specs/<feature>/ from the company template. Triggers on "write a spec", "SDD-full", "spec out this feature".
argument-hint: "[feature name or description]"
---

# Spec Writing (SDD-full)

Use this skill when work is judged `SDD-full` (structure, deploy assets, manifest,
or cross-target parity impact) and needs a written spec. Use the spec-mode-selector
skill first to confirm the mode — `none`/`lite` work usually does not create a spec
directory.

## Required context

Read the installed Spec Driven Development rule for the current harness, which
defines the A~Z stages this spec follows:

```text
Codex:  .agents/rules/developer/spec-driven-development.md
Claude: .claude/rules/developer/spec-driven-development.md
Gemini: .gemini/rules/developer/spec-driven-development.md
Cursor: .cursor/rules/developer-spec-driven-development.mdc
```

## Workflow

1. Pick a kebab-case `<feature>` name.
2. Copy the template:

   ```bash
   cp -r docs/specs/_template docs/specs/<feature>
   ```

3. Fill the artifacts in order:
   - `requirements.md` — context, SDD mode + reason, in/out scope, R1.. requirements,
     acceptance criteria.
   - `design.md` — approach, component/module boundaries, file/install layout,
     alternatives, risks.
   - `tasks.md` — A~Z breakdown; delete stages you do not use.
   - `review.md` — fill at the end: per-requirement result, verification commands,
     real result (e.g. `16 tests, 16 pass`).
4. Keep requirements **verifiable** and acceptance criteria **observable**.
5. On completion, update `review.md`, and reflect the result in `TODO.md` / `Finish.md`.

## Notes

- One feature per `docs/specs/<feature>/` directory.
- The spec is the source of truth for the change; if scope shifts, update the spec,
  do not let code and spec drift apart.
