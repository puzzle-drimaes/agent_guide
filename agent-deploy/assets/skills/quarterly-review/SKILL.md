---
name: quarterly-review
description: Prepare a quarterly AI-governance review — structure the standing agenda, propose evidence-backed decisions, next-quarter experiments, and follow-up PRs. Triggers on "분기 리뷰", "governance review", "quarterly review".
allowed-tools: ["Read"]
argument-hint: "[usage/KPI data, incidents, prompt DB status]"
---

# Quarterly Governance Review

Use this skill to turn scattered operating data into a reviewable governance agenda.
The point of the review is to keep rules/profiles evolving — every conclusion should
land as a decision or a follow-up PR, not a vague note.

## Required context

Read the installed common rules for the current harness first (security,
source-attribution, knowledge-sharing). Also read the local governance plan if present
(`docs/plans/.../13-governance-and-roadmap.md`).

## Evidence rule

Cite the data behind every claim. If a metric was not provided, write "데이터 없음" —
do not invent numbers or trends.

## Workflow (standing agenda)

1. 계정 재배분 — 사용률 낮은 계정 확인
2. profile별 사용량
3. Prompt DB 품질
4. 실패 사례 분석
5. 보안 / 출처 위반 검토
6. 신규 AI 도구 추가 여부
7. installer 개선 사항
8. 폐기할 rule / prompt 결정

## Output

```text
## 안건별 현황
1~8. (안건 — 데이터 근거 — 관찰)

## 의사결정 제안
- (결정 — 근거 데이터 — 영향 범위)

## 다음 분기 실험 항목
- ...

## 후속 PR
- (manifest / profile / rule 변경 항목)

→ 결론은 #ai-governance 공유 + 변경 PR 생성으로 연결한다.
```
