---
name: commit-message-writer
description: Create or review a commit message using the company Git commit convention.
---

# Commit Message Writer

Use this skill when the user asks for a commit message, commit review, or Jira-aware change summary.

## Required context

Read the installed Git commit convention rule for the current harness before drafting:

```text
Codex:  .agents/rules/developer/git-commit-convention.md
Claude: .claude/rules/developer/git-commit-convention.md
Gemini: .gemini/rules/developer/git-commit-convention.md
Cursor: .cursor/rules/developer-git-commit-convention.mdc
Kiro:   .kiro/steering/developer-git-commit-convention.md
```

If the local harness uses another rule location, use the semantically equivalent installed rule file.

## Workflow

1. Inspect the diff.
2. Identify the primary type: `feat`, `fix`, `refactor`, `chore`, `docs`, or `test`.
3. Ask for a Jira ticket when missing.
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
