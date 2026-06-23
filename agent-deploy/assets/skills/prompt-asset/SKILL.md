---
name: prompt-asset
description: Capture a reusable prompt as a Drive/GitHub candidate and decide whether to promote it to a shared skill/agent asset. Triggers on "save this prompt", "prompt 자산화", "register prompt", "make this reusable".
argument-hint: "[the prompt or workflow to capture]"
---

# Prompt Asset (Knowledge Capture)

Use this skill when a prompt or procedure worked well and should not stay trapped in
one chat. In the first rollout, turn it into a Google Drive upload plus a GitHub
`prompts` branch candidate; flag genuinely reusable ones for later main merge or
promotion to a shared asset.

## Required context

Read the installed knowledge-sharing and source-attribution rules for the current
harness first:

```text
Codex:  .agents/rules/common/knowledge-sharing.md  + source-attribution.md
Claude: .claude/rules/common/knowledge-sharing.md  + source-attribution.md
Gemini: .gemini/rules/common/knowledge-sharing.md  + source-attribution.md
Cursor: .cursor/rules/common-knowledge-sharing.mdc + common-source-attribution.mdc
```

## When to capture

Capture when **all** hold: the prompt is reusable, it produced a good result, and the
result is generalizable (not tied to one-off data). Do not capture sensitive data,
secrets, or customer-identifying content — strip or placeholder it first.

## Candidate entry

Produce these fields in the `.md` frontmatter or body. They are compatible with the
later Notion Prompt DB schema, but the first rollout stores them in Google Drive and
GitHub. Write the `프롬프트 본문` field on the company prompt skeleton — start from the installed templates and pick the closest one:

```text
Codex:  .agents/prompts/      (_universal-template.md + task templates)
Claude: .claude/prompts/
Gemini: .gemini/prompts/
Cursor: .cursor/prompts/
```

Leave usage/success metrics blank for a new entry; they are filled by operations over time.

First-rollout storage rule:

```text
- Upload the sanitized `.md` to Google Drive AI-Knowhow/prompts/.
- Commit/push prompt candidates to the GitHub `prompts` branch only.
- Do not push to `main`; main is updated later by manual merge.
```

```text
이름:
목적:
대상 직무:        # developer / product / business / governance ...
AI 도구:          # Claude / Codex / Gemini ...
권장 profile:     # minimal / developer / product / business ...
프롬프트 본문:
입력 예시:
출력 예시:
성공률:           # (운영 중 태깅)
사용 횟수:        # (운영 중 집계)
작성자:
최종 수정일:
출처/라이선스:    # 외부 자료 기반이면 source-attribution 규칙대로 기록
```

## Promotion to a shared asset

A candidate graduates to `main` or a shared asset only after it is proven (reused
across people or tasks, stable wording). When proposing promotion, state the target
and rationale — do not create the asset in `main` unilaterally:

```text
- skill:  assets/skills/company-<name>/SKILL.md   (workflow with steps + output)
- agent:  assets/agents/<name>.md                 (a focused, least-agency reviewer/helper)
```

## Output

```text
Capture decision: capture | skip (이유)
Candidate entry: <위 필드 채운 결과>
Promotion: not yet | propose <skill|agent> <name> (이유)
```
