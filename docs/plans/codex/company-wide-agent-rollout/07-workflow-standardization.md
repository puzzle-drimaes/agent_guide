# 07. Agent Workflow 표준화

## 목적

Claude, Codex, Gemini 등 AI 도구가 달라도 동일한 업무 방식으로 산출물을 만들게 한다.

## 공통 Workflow 원칙

### 1. SDD Mode First

```text
요청 이해
  → agent가 SDD-none / SDD-lite / SDD-full 직접 판단
  → 필요한 깊이만큼 기준/계획/검증 수행
  → 불필요한 QnA 없이 진행
```

mode별 공통 흐름:

```text
SDD-none:
  A → C → Z

SDD-lite:
  A → C → E → F → G → Z

SDD-full:
  A → B → C → D → E → F → G → H → Z
```

공통 단계:

```text
A. Analyze
B. Discover
C. Criteria
D. Design
E. Tasks
F. Implement
G. Verify
H. Review
Z. Report
```

### 2. Evidence First

```text
주장하기 전에 근거 확인
외부 자료 사용 시 출처 기록
코드 변경 시 테스트/검증 결과 기록
```

### 3. Review Before Done

```text
작업 완료 전 자기검토 또는 reviewer agent 사용
중요 산출물은 사람 승인 필요
```

### 4. Knowledge Capture

```text
반복 가능한 프롬프트/절차/실패 사례는 DB에 남김
```

## 개발자 Workflow

```text
SDD mode 판단
  → criteria
  → tasks/spec
  → implement
  → test
  → review
  → PR
  → 1 PR = 1 knowhow
```

필수 산출물:

```text
- 구현 계획
- 테스트 결과
- 리뷰 결과
- PR 노하우
```

## 비개발자 Workflow

```text
goal clarify
  → draft
  → evidence/source check
  → human review
  → reusable prompt 등록
```

필수 산출물:

```text
- 초안
- 출처
- 검토자 또는 검토 기록
- 재사용 가능 여부
```

## Product Workflow

```text
idea
  → problem statement
  → requirements
  → non-goals
  → acceptance criteria
  → review
```

## Business Workflow

```text
request
  → context 정리
  → response draft
  → tone/risk check
  → source check
  → final human review
```

## Agent Rule로 반영할 문구

```text
작업 시작 전 agent가 SDD mode를 직접 판단한다.
불필요한 QnA를 요청하지 않고 합리적 가정을 명시한 뒤 진행한다.
none/lite/full은 같은 A~Z 흐름의 압축률 차이로 처리한다.
파괴적 작업, 보안/credential, 비용 발생, 외부 배포, 요구사항 충돌만 확인 질문을 한다.
외부 자료를 사용하면 출처를 남긴다.
완료 주장 전 검증 결과를 제시한다.
반복 가능한 프롬프트나 절차는 지식 DB 등록 후보로 표시한다.
```

## 완료 기준

- 모든 profile에 공통 workflow rule이 포함된다.
- AI 도구가 달라도 SDD mode/review/knowledge capture 용어가 동일하다.
- 신규 입사자가 같은 workflow를 학습할 수 있다.
