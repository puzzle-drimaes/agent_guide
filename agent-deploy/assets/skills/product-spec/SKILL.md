---
name: product-spec
description: Turn a product idea into a structured spec — problem statement, requirements, non-goals, and acceptance criteria. Triggers on "기획 정리", "PRD", "요구사항 정리", "spec out this idea".
allowed-tools: ["Read"]
argument-hint: "[product idea or feature request]"
---

# Product Spec

Use this skill to turn a rough idea into a reviewable product spec. It is the
non-developer counterpart of the developer spec-writing skill.

## Required context

Read the installed common rules for the current harness first:

```text
Codex:  .agents/rules/common/    (security, source-attribution, knowledge-sharing)
Claude: .claude/rules/common/
Gemini: .gemini/rules/common/
Cursor: .cursor/rules/common-*.mdc
```

## Workflow (product: idea → problem → requirements → non-goals → acceptance → review)

1. **문제 정의** — 무엇이, 누구에게, 왜 문제인지 한두 문단으로.
2. **요구사항** — 검증 가능한 단위로 쪼갠다(R1, R2 ...).
3. **Non-goals** — 이번에 의도적으로 안 하는 것을 명시한다.
4. **수용 기준** — 관찰·측정 가능한 성공 기준.
5. **리뷰** — 가정·미결을 드러내고, 중요한 결정은 사람 승인을 받는다.

추측이 필요하면 가정을 먼저 밝히고 진행한다. 외부 자료를 쓰면 출처를 남긴다.

## Output

```text
## 문제 정의
- 대상 / 문제 / 근거

## 요구사항
- R1. ...
- R2. ...

## Non-goals
- ...

## 수용 기준
- (관찰 가능한 성공 기준)

## 리스크 / 미결
- ...
```

개발로 이어지는 작업이면 developer 쪽 spec-writing skill(SDD-full)로 연결한다.
