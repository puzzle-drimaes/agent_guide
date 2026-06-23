---
name: prompt-db-curation
description: Curate prompt/skill candidate branches — flag duplicates to merge, low-value entries to deprecate, proven entries to promote, and missing success tags. The hygiene counterpart of prompt-asset. Triggers on "prompt DB 정리", "프롬프트 정리", "curate prompts", "prompt cleanup".
allowed-tools: ["Read"]
argument-hint: "[prompts/skills branch entries or exported candidate list]"
---

# Prompt / Skill Candidate Curation

Use this skill to keep the GitHub `prompts` and `skills` candidate branches from
rotting. Where `prompt-asset` captures new prompts, this skill reviews the existing
set and proposes merge / deprecate / promote. Notion/Slack operations are deferred
in the first rollout.

## Required context

Read the installed common rules for the current harness first (knowledge-sharing,
source-attribution, security). The promotion bar reuses the `prompt-asset` skill's
promotion gate.

## Workflow

1. **중복/유사** — 목적·본문이 겹치는 엔트리를 묶어 통합 후보로 표시한다.
2. **deprecate 후보** — 성공률 낮음 / 장기 미사용 / 더 나은 대체본 존재.
3. **승격 후보** — 검증된 엔트리(여러 사용자·작업에서 재사용, 문구 안정, 성공률 충족)는
   `main` protected merge 또는 `company-*` skill/agent 승격을 제안한다(무단 생성/직접 push 금지).
4. **태깅 누락** — 성공률·사용 횟수·출처가 비어 있는 엔트리를 표시한다.

## Promotion bar (prompt-asset과 동일)

```text
- 사용 횟수 ≥ N (예: 5)  /  서로 다른 사용자 ≥ 2명  /  성공률 ≥ X% (예: 80%)
- 문구 안정 (최근 수정 없이 재사용)
→ 모두 충족 시 사람 확인 후 main protected merge 또는 승격
(N/X 구체값은 KPI 목표 확정(D12) 전까지 잠정값)
```

## Output

```text
## 통합 후보
- [A] + [B] → 통합 (이유)

## deprecate 후보
- [name] (이유)

## 승격 후보
- [name] → main|skill|agent (근거: 사용/성공률)

## 태깅 누락
- [name] (빠진 필드)
```
