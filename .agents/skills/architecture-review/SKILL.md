---
name: architecture-review
description: Review a diff for software architecture and layering violations. Use when asked for architecture review, layer check, boundary review, or before a large refactor.
---

# Architecture Review

## Required context

Read these files first:

```text
AGENTS.md
.agents/rules/developer/architecture.md
```

## Review checklist

- Does domain/application depend on framework, infrastructure, DB, or HTTP client?
- Is business logic hidden in CLI/UI/controller?
- Are DTO and domain model mixed?
- Is a usecase doing multiple unrelated responsibilities?
- Does a repository or adapter contain business decisions?
- Did target-specific logic leak into core installer planning?
- Are dry-run, path-safety, symlink guard, and install-state respected?
- Is the change consistent with the existing project structure?

## Output

For each finding:

```text
file:line — violated principle — why it matters — minimal fix
```

If a change introduces a large architectural shift, mark it as `needs approval`.

