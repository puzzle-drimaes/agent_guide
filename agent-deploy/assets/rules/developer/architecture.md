---
paths: ["src/**", "lib/**", "app/**"]
---

# Software Architecture Rules

> Applies when an AI agent writes or edits the company's product/service code.
> Goal: change-resilient, testable code where domain rules don't leak into
> UI/DB/external APIs. (Not the installer's own architecture.)

## Common principles (enforced)
1. **Dependency direction**: inner layers don't know outer ones. `domain` does not import UI, DB, framework, or HTTP/SQL clients.
2. **Explicit boundaries**: presentation / application / domain / infrastructure / shared. Small projects may shorten names but not mix roles.
3. **DTO ≠ domain model**: API/DB/external payloads are DTOs; keep them out of domain rules.
4. **UseCase-centric**: important behavior lives in usecases/application services, not controllers or UI handlers.
5. **Repository via interface**: domain/application depend on a repository interface, not a concrete store.
6. **Judge by testability**: can you test the usecase without a DB? the domain without UI? failure paths without the external API?

## Project-type defaults
- Backend / API / service → **Clean / Hexagonal**.
- Frontend web → **Feature-based** (Clean style if needed).
- Mobile / desktop → **MVVM + Clean**.
- CLI / automation / installer → **Command → UseCase → Adapter** (dry-run capable).
- Data / ML → **pipeline stage separation** + config/io/domain split.

## AI agent work rules
- **Respect existing structure first** — detect it; if consistent, follow it. Propose the company default only for new/unclear areas.
- **Architecture changes need approval** — large folder restructures, introducing Clean/MVVM, new repository/usecase layers, framework swaps, public API shape changes.
- **Small changes still respect boundaries** — no business rule in controllers/components, no `domain → infrastructure` import, no layer move without tests.
- **Explain new files** — which layer, why here, what it depends on, where its test goes.
