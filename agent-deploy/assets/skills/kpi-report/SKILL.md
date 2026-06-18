---
name: kpi-report
description: Draft an AI-adoption KPI report grouped into Adoption / Usage / Quality / Business Impact, with trends and action signals. Triggers on "KPI 리포트", "KPI 대시보드", "kpi report", "usage dashboard".
allowed-tools: ["Read"]
argument-hint: "[raw metrics]"
---

# KPI Report

Use this skill to turn raw operating metrics into a structured KPI report for
governance review.

## Required context

Read the installed common rules for the current harness first (security,
source-attribution, knowledge-sharing).

## Evidence rule

Report only values that were actually provided. For any missing metric, write
"데이터 없음" — never fabricate a number or a trend.

## Workflow

1. 입력 지표를 4개 그룹으로 분류한다.
2. 각 지표에 값 + 추세(가능할 때)를 붙인다.
3. 주의 신호와 개선 액션을 도출한다.

## Output (4 groups, from the governance plan)

```text
## Adoption
- 설치율 / profile별 설치 수 / OS별 성공률 / target별 설치 수

## Usage
- 계정별 active usage / 회고 제출률 / 데모데이 발표 수 / prompt 등록 수

## Quality
- PR knowhow 작성률 / prompt 재사용률 / 실패 사례 수 / 출처 표기율 / 보안 위반 건수

## Business Impact
- 반복 업무 시간 절감 / PR cycle time / 문서 리드타임 / CS 응답 작성 시간

## 주의 신호 / 액션
- (임계 미달·악화 지표 → 제안 액션)
```
