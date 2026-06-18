---
paths: ["**/*.py", "**/*.pyi"]
---

# Python Coding Style

> Extends [common/security.md](../common/security.md). Language-specific rules
> override common ones on conflict.

- Format with the project formatter (ruff/black) before committing.
- Prefer explicit imports; no wildcard `from x import *`.
- Type-annotate public functions.
