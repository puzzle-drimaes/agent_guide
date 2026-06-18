---
name: customer-response
description: Draft a polite, accurate customer reply with tone/risk checks and a mandatory human-review gate before sending. Triggers on "고객 응대", "답변 초안", "customer reply", "respond to this inquiry".
allowed-tools: ["Read"]
argument-hint: "[customer inquiry + optional policy/FAQ]"
---

# Customer Response

Use this skill to draft a customer-facing reply. The output is a **draft**, never an
auto-sent message — outbound customer communication always needs human review.

## Required context

Read the installed common rules for the current harness first:

```text
Codex:  .agents/rules/common/    (security, source-attribution, knowledge-sharing)
Claude: .claude/rules/common/
Gemini: .gemini/rules/common/
Cursor: .cursor/rules/common-*.mdc
```

## Workflow (business: request → context → draft → tone/risk → human review)

1. **의도/감정 파악** — 문의의 핵심 요구와 톤을 읽는다.
2. **사실 확인** — 정책/FAQ로 검증 가능한 것만 단정한다. 모르면 추측하지 말고
   "확인 필요"로 표시한다.
3. **민감정보 보호** — 고객 식별 정보·계정 정보는 노출/저장하지 않는다(security 룰).
4. **초안 작성** — 정중하고 정확한 톤, 회사 정책 준수.
5. **리스크 체크** — 과한 약속/보상/환불/법적 함의가 있는 표현을 플래그한다.
6. **검토 게이트** — `status: 검토 필요`로 끝낸다. 사람 승인 전 발송 금지.

## Output

```text
## 답변 초안
(정중하고 정확한 본문)

## 확인 필요 항목
- (담당자가 사실 확인 후 채울 빈칸)

## 톤 / 리스크 노트
- (약속·보상·법적 표현 등 주의점)

status: 검토 필요 (자동 발송 금지)
```

반복되는 문의 유형이면 prompt-asset skill로 자산화 후보로 표시한다.
