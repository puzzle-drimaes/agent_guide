# 02. Profile과 Agent Asset 설계

## 목적

모든 직원이 같은 installer를 쓰되, 직무와 업무 상황에 맞는 agent 설정을 설치할 수 있게 한다.

## Profile 원칙

- profile은 직무별 업무 방식의 묶음이다.
- 모든 profile은 `minimal`을 포함한다.
- 개발자와 비개발자가 같은 용어를 쓰도록 공통 workflow rule을 포함한다.
- profile은 변경 가능해야 하며, 분기 governance review에서 조정한다.

## 권장 Profile

| Profile | 대상 | 목적 |
|---|---|---|
| `minimal` | 전 직원 | 공통 AI 사용 원칙, 보안, 출처 표기 |
| `developer` | 개발자 | 코드 작성, 리뷰, 테스트, PR 회고 |
| `product` | PM/기획 | 요구사항 정리, 정책 문서, 스펙 작성 |
| `design` | 디자이너 | UX 리뷰, 카피, 디자인 QA |
| `business` | 세일즈/운영/CS | 고객 응대, 회의록, 제안서, FAQ |
| `manager` | 리드/경영 | 의사결정, 요약, 리스크, 보고서 |
| `sdd` | 개발/PM 협업 | spec-driven 개발 workflow |
| `governance` | PMO/운영자 | KPI, 계정 배분, 회고 운영 |

## Asset 구조

```text
agent-deploy/assets/
  ├─ rules/
  │   ├─ common/
  │   ├─ developer/
  │   ├─ product/
  │   ├─ business/
  │   └─ governance/
  │
  ├─ skills/
  │   ├─ code-review/
  │   ├─ tdd/
  │   ├─ spec-writing/
  │   ├─ meeting-summary/
  │   ├─ customer-response/
  │   └─ prompt-capture/
  │
  ├─ agents/
  │   ├─ planner.md
  │   ├─ reviewer.md
  │   ├─ debugger.md
  │   ├─ security-reviewer.md
  │   └─ document-reviewer.md
  │
  ├─ prompts/
  │   ├─ product/
  │   ├─ business/
  │   ├─ developer/
  │   └─ governance/
  │
  └─ mcp/
      └─ servers.json
```

## Module 설계

예시:

```json
{
  "id": "common-rules",
  "description": "전 직원 공통 AI 사용 원칙",
  "paths": ["rules/common"],
  "targets": ["codex", "claude", "gemini"],
  "dependencies": [],
  "stability": "stable"
}
```

권장 module:

```text
common-rules
security-rules
source-attribution-rules
knowledge-sharing-rules
architecture-rules
spec-driven-development-rules
commit-convention-rules
developer-rules
product-rules
business-rules
manager-rules
review-agents
developer-skills
product-skills
business-skills
governance-skills
mcp-baseline
```

## Profile manifest 예시

```json
{
  "profiles": {
    "minimal": [
      "common-rules",
      "security-rules",
      "source-attribution-rules",
      "knowledge-sharing-rules"
    ],
    "developer": [
      "common-rules",
      "security-rules",
      "spec-driven-development-rules",
      "architecture-rules",
      "commit-convention-rules",
      "developer-rules",
      "review-agents",
      "developer-skills"
    ],
    "business": [
      "common-rules",
      "security-rules",
      "business-rules",
      "business-skills"
    ]
  }
}
```

## 직무별 첫 사용 예시

### Developer

```text
- 이 변경의 테스트 계획을 세워줘.
- 이 diff에서 실제 버그 가능성이 높은 부분만 리뷰해줘.
- PR 설명과 AI 활용 노하우를 작성해줘.
```

### Product

```text
- 이 아이디어를 요구사항/비범위/리스크로 나눠줘.
- 고객 요청을 정책 문서 초안으로 정리해줘.
- 개발팀에 전달할 수 있는 acceptance criteria를 써줘.
```

### Business

```text
- 고객 문의에 대한 답변 초안을 정중하게 작성해줘.
- 회의록을 의사결정/액션아이템/리스크로 정리해줘.
- 이 제안서의 핵심 메시지를 3개로 줄여줘.
```

## 완료 기준

- `minimal`, `developer`, `product`, `business` profile 초안이 있다.
- profile별 설치되는 modules가 명확하다.
- 비개발자가 profile 설명만 보고 선택할 수 있다.
- 각 profile에 첫 사용 예시가 3개 이상 있다.
