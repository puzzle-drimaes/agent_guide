---
name: meeting-summary
description: Turn raw meeting notes or a transcript into a structured summary (decisions, action items, risks, open questions). Triggers on "회의록 정리", "meeting notes", "회의 내용 요약", "summarize this meeting".
allowed-tools: ["Read"]
argument-hint: "[meeting notes / transcript]"
---

# Meeting Summary

Use this skill to convert meeting notes into a structured, shareable summary.

## Required context

Read the installed common rules for the current harness first:

```text
Codex:  .agents/rules/common/    (security, source-attribution, knowledge-sharing)
Claude: .claude/rules/common/
Gemini: .gemini/rules/common/
Cursor: .cursor/rules/common-*.mdc
Kiro:   .kiro/steering/common-*.md
```

## Workflow

1. **민감정보 차단** — 개인정보·외부 비공개 내용은 `[placeholder]`로 치환한다(security 룰).
2. **사실 / 의견 / 추측 구분** — 추측이나 미확정 내용은 명시적으로 표시한다.
3. **구조화** — 아래 출력 형식으로 정리한다. 원문에 없는 담당자·기한을 임의로 만들지 않는다(없으면 "미정").
4. **출처 유지** — 외부 자료를 인용했다면 출처를 남긴다(source-attribution 룰).

## Output

```text
## 요약
- (3줄 이내)

## 의사결정
- (decided 사항)

## 액션 아이템
| 내용 | 담당자 | 기한 |
| --- | --- | --- |
| ... | ... / 미정 | ... / 미정 |

## 리스크 / 이슈
- ...

## 미결 질문 / 후속
- ...
```

반복 가능한 회의 유형이면 prompt-asset skill로 자산화 후보로 표시한다.
