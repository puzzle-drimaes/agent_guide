---
name: prompt-asset
description: Capture a reusable prompt as a Drive/GitHub candidate and decide whether to promote it to a shared skill/agent asset. Triggers on "save this prompt", "prompt 자산화", "register prompt", "make this reusable".
argument-hint: "[the prompt or workflow to capture]"
---

# Prompt Asset (Knowledge Capture)

Use this skill when a prompt or procedure worked well and should not stay trapped in
one chat. In the first rollout, turn it into a sanitized Google Drive upload plus a
GitHub candidate on the type-specific branch: `prompts` for prompt/template entries,
`skills` for reusable procedures/skills. Candidate branches are preferred over
`main`; `main` is only for official or operator-approved assets. During the current
WIP period, `main` direct push may not be technically blocked, but prompt/skill
candidates still go to `prompts` or `skills` first.

## Required context

Read the installed knowledge-sharing, source-attribution, and security rules for the
current harness first:

```text
Codex:  .agents/rules/common/knowledge-sharing.md  + source-attribution.md + security.md
Claude: .claude/rules/common/knowledge-sharing.md  + source-attribution.md + security.md
Gemini: .gemini/rules/common/knowledge-sharing.md  + source-attribution.md + security.md
Cursor: .cursor/rules/common-knowledge-sharing.mdc + common-source-attribution.mdc + common-security.mdc
```

When available, also use the shared-folder and branch operation guides as the
operational source of truth:

```text
agent-deploy/docs/SHARED_FOLDER_GUIDE.md
agent-deploy/docs/GITHUB_BRANCH_POLICY.md
docs/plans/codex/company-wide-agent-rollout/15-prompt-db-operations.md
```

## When to capture

Capture when **all** hold: the prompt or workflow is reusable, it produced a good
result, and the result is generalizable (not tied to one-off data). Do not capture
sensitive data, secrets, or customer-identifying content — strip or placeholder it
first. If the useful asset is mostly a step-by-step workflow rather than a copy/paste
prompt body, classify it as a skill candidate.

## Storage decision (Drive + branch first)

Pick the storage target before drafting the entry:

```text
prompt/template candidate:
  Drive:  AI-Knowhow/prompts/<name>.md
  GitHub: prompts branch, uploads/prompts/<name>.md

skill candidate:
  Drive:  AI-Knowhow/skills/<skill-name>/SKILL.md  (or skills/<name>.md for a simple note)
  GitHub: skills branch, uploads/skills/<skill-name>/SKILL.md

main / company-* asset:
  Only after reuse evidence, owner/reviewer confirmation, and promotion approval.
```

Do not silently overwrite an existing candidate. If the filename or ID collides,
propose a more specific kebab-case name or a namespaced location. Force-push and
branch deletion are out of scope for this skill.

## Candidate entry

Produce these fields in the `.md` frontmatter or body. They are compatible with the
later Notion Prompt DB schema, but the first rollout stores them in Google Drive and
GitHub candidate branches. Write the `프롬프트 본문` field on the company prompt
skeleton — start from the installed templates and pick the closest one:

```text
Codex:  .agents/prompts/      (_universal-template.md + task templates)
Claude: .claude/prompts/
Gemini: .gemini/prompts/
Cursor: .cursor/prompts/
```

Leave usage/success metrics blank for a new entry; they are filled by operations over time.

First-rollout storage rule:

```text
- Upload the sanitized `.md` to Google Drive AI-Knowhow/prompts/ or AI-Knowhow/skills/.
- Commit/push prompt/template candidates to the GitHub `prompts` branch under `uploads/prompts/<name>.md`.
- Commit/push skill candidates to the GitHub `skills` branch under `uploads/skills/<skill-name>/SKILL.md`.
- Prefer `prompts`/`skills` candidate branches over `main` for prompt/skill candidates.
- Treat `main` as official distribution: current WIP may allow direct push, but candidate registration should not use `main` unless an operator explicitly asks for an approved official update.
```

```text
이름:
목적:
대상 직무:        # developer / product / business / governance ...
AI 도구:          # Claude / Codex / Gemini ...
권장 profile:     # minimal / developer / product / business / governance ...
프롬프트 본문:
입력 예시:
출력 예시:
상태:             # draft / candidate (신규는 보통 candidate)
Owner:
Reviewer:
성공률:           # (운영 중 태깅; 신규는 비움)
사용 횟수:        # (운영 중 집계; 신규는 비움)
사용자 수:        # (운영 중 집계; 신규는 비움)
작성자:
최종 수정일:
출처/라이선스:    # 외부 자료 기반이면 source-attribution 규칙대로 기록
```

## Promotion to a shared asset

A candidate graduates to `main` or a shared asset only after it is proven (reused
across people or tasks, stable wording). When proposing promotion, state the target
and rationale — do not promote it as an official `main` asset unilaterally:

```text
- prompt: assets/prompts/<domain>/<name>.md       (copy/paste reusable prompt)
- skill:  assets/skills/company-<name>/SKILL.md   (workflow with steps + output)
- agent:  assets/agents/<name>.md                 (a focused, least-agency reviewer/helper)
```

Default promotion gate unless governance changes it:

```text
- usage count >= 5
- distinct users >= 2
- success rate >= 80%
- wording stable across recent reuse
- owner/reviewer identified
```

## Output

```text
Capture decision: capture | skip (이유)
Asset type: prompt | template | skill | agent
Drive target: AI-Knowhow/prompts/... | AI-Knowhow/skills/...
GitHub target: prompts:uploads/prompts/<name>.md | skills:uploads/skills/<skill-name>/SKILL.md | not applicable (이유)
Candidate entry: <위 필드 채운 결과>
Promotion: not yet | propose <main|skill|agent> <name> (이유)
Safety checks: sensitive data removed, source/license recorded, no overwrite/force-push
```
