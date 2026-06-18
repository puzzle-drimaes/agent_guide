---
name: architecture-review
description: Review a diff for software-architecture/layering violations. Triggers on "architecture review", "layer check", "boundary review". Read-only.
allowed-tools: ["Read", "Grep", "Glob"]
argument-hint: "[path or diff]"
---

# Architecture Review

Read the actual diff, then check layering — not style (the rules layer covers style).

## Checklist
- Does `domain` depend on framework/infrastructure (React/Express/Django/SQL/HTTP client)?
- Is a business rule hidden in UI/controller/component?
- Are DTO and domain model mixed (API/DB shape flowing into domain)?
- Is a usecase doing too much (multiple responsibilities)?
- Does a repository hold a business decision?
- Do tests verify the layer boundaries?
- Did a new dependency leak into an inner layer?
- Is it consistent with the **existing** project structure?

## Output
For each finding: `file:line` — violated principle — why — minimal fix.
If the change introduces a large architectural shift, flag it as **needs approval** (do not assume).
