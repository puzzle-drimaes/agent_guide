# 02. Profile과 Agent Asset 설계

## 목적

모든 직원이 같은 installer를 쓰되, 직무와 업무 상황에 맞는 agent 설정과 Markdown 기반 업무 자산을 설치할 수 있게 한다.

이 문서에서 말하는 agent asset은 단순한 설정 파일이 아니라, 회사 구성원이 공유하고 재사용하는
`*.md` 기반 AI 업무 자산 전체를 뜻한다.

```text
rules + skills + prompts/templates + external/shared docs
```

목표는 모든 target의 파일 구조를 같게 만드는 것이 아니라, Codex/Claude/Gemini 등 각 harness가
같은 canonical asset set을 의미상 동일하게 읽도록 만드는 것이다.

## 1차 전략

1차 목표는 다음 세 사용자 그룹을 모두 지원하는 것이다.

| 사용자 | 필요한 것 | agent-deploy 역할 |
|---|---|---|
| 회사 구성원 공통 | 하네스 엔지니어링으로 관리되는 회사 rule `*.md` | project scope에 공통 rule과 entrypoint 설치 |
| agent 초보자 | 검증된 템플릿/프롬프트/스킬 `*.md` | role profile과 첫 사용 예시 제공 |
| agent 숙련자 | 외부/팀 공유 문서 `*.md` 적용과 승격 | asset 후보 작성, 검증, catalog 등록, profile 반영 흐름 제공 |

## Profile 원칙

- profile은 직무별 업무 방식과 asset bundle의 묶음이다.
- 모든 profile은 `minimal`을 포함한다.
- 개발자와 비개발자가 같은 용어를 쓰도록 공통 workflow rule을 포함한다.
- profile은 변경 가능해야 하며, 분기 governance review에서 조정한다.
- profile은 target별 파일 구조가 아니라 설치할 canonical asset set을 기준으로 정의한다.
- role별 prompt/template/skill은 공통 rule 위에 추가되는 레이어다.

## 권장 Profile

| Profile | 대상 | 목적 |
|---|---|---|
| `minimal` | 전 직원 | 공통 AI 사용 원칙, 보안, 출처 표기 |
| `core` | 공통 고급 사용자 | 공통 rule + 기본 review agent + prompt asset workflow |
| `developer` | 개발자 | 코드 작성, 리뷰, 테스트, PR 회고 |
| `product` | PM/기획 | 요구사항 정리, 정책 문서, 스펙 작성 |
| `design` | 디자이너 | UX 리뷰, 카피, 디자인 QA |
| `business` | 세일즈/운영/CS | 고객 응대, 회의록, 제안서, FAQ |
| `manager` | 리드/경영 | 의사결정, 요약, 리스크, 보고서 |
| `sdd` | 개발/PM 협업 | spec-driven 개발 workflow |
| `governance` | PMO/운영자 | KPI, 계정 배분, 회고 운영 |
| `full` | 내부 검토/테스트 | 1차 role asset 전체 설치 |

현재 `agent-deploy/manifests/profiles.json`에 구현된 profile은 다음이다.

```text
minimal
core
sdd
business
product
governance
developer
full
```

`design`, `manager`는 rollout 후보로 문서에는 유지하되, 실제 manifest에는 아직 넣지 않는다.

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
  ├─ templates/          # 향후 분리 후보: 초보자용 문서 골격
  │   ├─ product/
  │   └─ business/
  │
  ├─ docs/               # 향후 추가 후보: 외부/팀 공유 문서 asset
  │   ├─ developer/
  │   ├─ product/
  │   ├─ business/
  │   └─ team/
  │
  └─ mcp/
      └─ servers.json
```

Pilot에서는 `templates/`와 `docs/`를 바로 코드로 추가하지 않아도 된다. 다만 prompt와 skill을
설계할 때 향후 분리될 수 있도록 asset type, audience, owner, stability 정보를 남길 수 있어야 한다.

schema/catalog 초안은 아래 파일에서 관리한다.

```text
agent-deploy/docs/ASSET_SCHEMA_AND_CATALOG.md
agent-deploy/schemas/asset-frontmatter.schema.json
agent-deploy/schemas/asset-catalog.schema.json
agent-deploy/assets/catalog.draft.json
```

## Asset taxonomy

| Type | 의미 | 예시 | 배포 기준 |
|---|---|---|---|
| `rule` | 반드시 지켜야 하는 회사/프로젝트 규칙 | security, source attribution, SDD | 모든 profile 또는 특정 role profile에 포함 |
| `skill` | agent가 수행할 절차/전문성 | product-spec, meeting-summary | task trigger와 output 형식이 명확해야 함 |
| `prompt` | 특정 결과물을 만들기 위한 재사용 요청문 | PRD 작성, 고객 답변, 비교 분석 | 초보자가 그대로 사용할 수 있어야 함 |
| `template` | 사용자가 채워 넣는 문서 골격 | PRD, user story, proposal | 입력 항목과 결과 품질 기준이 있어야 함 |
| `doc` | 외부/팀 공유 문서 | 팀별 리뷰 방식, 도메인별 체크리스트 | owner/reviewer와 승격 상태가 있어야 함 |
| `agent` | 전문 subagent 정의 | reviewer, architecture-reviewer | target 지원 여부와 fallback이 명확해야 함 |
| `command` | slash command 또는 instruction fallback | plan | unsupported target은 skip reason 기록 |

asset은 파일 확장자가 같아도 운영 의미가 다르므로, manifest/catalog/schema에서 type을 구분해야 한다.

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
prompt-library
product-prompts
business-prompts
external-doc-assets
mcp-baseline
```

현재 구현은 module id를 더 구체적으로 나눠 둔다.

```text
baseline-rules
prompt-asset-skill
prompt-library
product-prompts
business-prompts
prompt-db-curation-skill
...
```

향후 `templates/`, `docs/`, 외부 asset pack을 추가할 때도 같은 module/profile 구조를 유지한다.

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
- asset type별 의미와 배포 기준이 문서화되어 있다.
- prompt/template/doc schema와 catalog 도입 여부가 TODO로 추적된다.
- 실제 manifest에 없는 후보 profile은 문서에서 예정 상태로 표시된다.
- catalog 초안이 실제 asset 경로, module, profile 추천을 설명한다.
