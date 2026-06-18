---
name: commit-message-writer
description: Create or review a commit message using the company Git commit convention.
---

# Commit Message Writer

## Required context

Read this file first:

```text
.agents/rules/developer/git-commit-convention.md
```

## Workflow

1. Inspect the diff.
2. Identify the primary type: feat, fix, refactor, chore, docs, or test.
3. Ask for Jira ticket when missing.
4. If Jira is intentionally unavailable, ask whether `jira : N/A (사유: ...)` is allowed.
5. Draft the message in the required structure.

## Output format

```text
[type] 한글 제목

1. 내용
- ...

2. 수정 내역
- ...

3. 영향도
- ...

jira : ...
```

