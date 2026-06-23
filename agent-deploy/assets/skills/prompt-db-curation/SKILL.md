---
name: prompt-db-curation
description: Curate Drive plus prompt/skill candidate branches — flag duplicates to merge, low-value entries to deprecate, proven entries to promote, and missing success tags. The hygiene counterpart of prompt-asset. Triggers on "prompt DB 정리", "프롬프트 정리", "curate prompts", "prompt cleanup".
allowed-tools: ["Read"]
argument-hint: "[Drive exports, prompts/skills branch entries, or exported candidate list]"
---

# Prompt / Skill Candidate Curation

Use this skill to keep Google Drive `AI-Knowhow` and the GitHub `prompts` / `skills`
candidate branches from rotting. Where `prompt-asset` captures new prompts or skill
workflows, this skill reviews the existing set and proposes merge / deprecate /
promote. Real-time messenger and Notion operations are excluded from this rollout.

## Required context

Read the installed common rules for the current harness first (knowledge-sharing,
source-attribution, security). The promotion bar reuses the `prompt-asset` skill's
promotion gate. When available, also read:

```text
agent-deploy/docs/SHARED_FOLDER_GUIDE.md
agent-deploy/docs/GITHUB_BRANCH_POLICY.md
docs/plans/codex/company-wide-agent-rollout/15-prompt-db-operations.md
```

## Scope and source priority

Curate both human-facing Drive shares and GitHub candidate branch records:

```text
1. Google Drive AI-Knowhow/prompts/ and AI-Knowhow/skills/
   - easiest channel for people to browse, upload, and download.
2. GitHub prompts branch and skills branch
   - preferred audit/history location for candidates.
   - prompt/template candidates belong on `prompts` at `uploads/prompts/<name>.md`.
   - skill/workflow candidates belong on `skills` at `uploads/skills/<skill-name>/SKILL.md`.
3. GitHub main / company-* assets
   - official distribution only after approval; do not promote directly.
```

If Drive and branch contents diverge, report the mismatch and recommend syncing the
sanitized candidate into the correct branch before any `main` promotion decision.
Current WIP may allow `main` direct push, but curation should still prefer
`prompts`/`skills` for unproven prompt/skill candidates.

## Workflow

1. **수집 범위 확인** — Drive export, `prompts` branch, `skills` branch, and any provided
   candidate list를 구분해서 본다. 후보 자료는 공식 asset이 아님을 표시한다.
2. **분류/위치 점검** — prompt/template은 `prompts:uploads/prompts/<name>.md`, skill/workflow는 `skills:uploads/skills/<skill-name>/SKILL.md`에 있는지 확인하고
   잘못된 branch나 Drive 폴더에 있으면 이동/재등록 후보로 표시한다.
3. **중복/유사** — 목적·본문이 겹치는 엔트리를 묶어 통합 후보로 표시한다.
4. **deprecate 후보** — 성공률 낮음 / 장기 미사용 / 더 나은 대체본 존재.
5. **승격 후보** — 검증된 엔트리(여러 사용자·작업에서 재사용, 문구 안정, 성공률 충족)는
   `main` 반영 또는 `company-*` skill/agent 승격을 제안한다(공식 asset 무단 승격 금지).
6. **태깅 누락** — 성공률·사용 횟수·사용자 수·출처·Owner/Reviewer가 비어 있는 엔트리를 표시한다.
7. **동기화 누락** — Drive에는 있지만 branch에 없는 후보, branch에는 있지만 Drive에 없는 후보,
   branch/type이 맞지 않는 후보를 별도 표시한다.

## Promotion bar (prompt-asset과 동일)

```text
- 사용 횟수 >= 5
- 서로 다른 사용자 >= 2명
- 성공률 >= 80%
- 문구 안정 (최근 수정 없이 재사용)
- Owner / Reviewer 확인
→ 모두 충족 시 사람 확인 후 main 반영 또는 승격
```

임계값은 Pilot 운영 기본값이며, 분기 거버넌스 리뷰에서 재조정할 수 있다.

## Output

```text
## 범위 / 기준
- Reviewed sources: Drive prompts/skills, GitHub prompts branch, GitHub skills branch, main/company-* (해당하는 것만)
- Branch-first policy: prompt/template → prompts:uploads/prompts/<name>.md, skill/workflow → skills:uploads/skills/<skill-name>/SKILL.md, official promotion → approved main/company-*

## 통합 후보
- [A] + [B] → 통합 (이유, 권장 branch/folder)

## deprecate 후보
- [name] (이유, Drive/branch 위치)

## 승격 후보
- [name] → main|skill|agent (근거: 사용/사용자/성공률/Owner/Reviewer)

## 태깅 누락
- [name] (빠진 필드: 성공률/사용 횟수/사용자 수/출처/Owner/Reviewer 등)

## Drive / branch 동기화 누락
- [name] (Drive only | branch only | wrong branch/folder, 권장 조치)

## 보안 / 출처 이슈
- [name] (민감정보 제거 필요 | 출처/라이선스 보강 필요 | 확인 완료)
```
