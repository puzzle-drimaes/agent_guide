# Markdown Asset Schema and Catalog Draft

이 문서는 `agent-deploy`가 배포할 Markdown 기반 AI 업무 자산의 frontmatter schema와
asset catalog 초안을 정의한다.

목표는 모든 `*.md`를 같은 방식으로 취급하는 것이 아니라, 각 자산의 운영 의미를 명시해
초보자는 검증된 템플릿을 선택하고, 숙련자는 자신의 knowhow를 공유 가능한 asset으로 승격할 수
있게 만드는 것이다.

## 1. 범위

초안에서 다루는 자산 타입은 다음이다.

| Type | 현재 상태 | 목적 |
|---|---|---|
| `rule` | 이미 배포 중 | 반드시 따라야 하는 회사/프로젝트 규칙 |
| `skill` | 이미 배포 중 | agent가 특정 작업에서 따르는 절차 |
| `prompt` | 이미 배포 중 | 특정 결과물을 만들기 위한 재사용 요청문 |
| `template` | prompt 안에 혼재 | 사용자가 채워 넣는 문서 골격 |
| `knowhow` | 추가 예정 | 개인/팀의 재사용 가능한 작업 노하우 |
| `agent` | 이미 배포 중 | target이 지원할 때 쓰는 전문 subagent 정의 |
| `command` | 이미 배포 중 | slash command 또는 instruction-backed command |

Pilot 단계에서는 기존 prompt 파일을 즉시 모두 수정하지 않는다. 먼저 schema와 catalog를 설계하고,
새로 추가되는 prompt/template/knowhow부터 frontmatter를 요구한다. 기존 자산은 catalog 초안으로
분류한 뒤 점진적으로 frontmatter를 보강한다.

## 2. 공통 frontmatter 필드

모든 Markdown asset은 아래 공통 필드를 목표 schema로 사용한다.

```yaml
---
id: product-prd
asset_type: prompt
title: PRD 작성 프롬프트
description: 제품 아이디어를 PRD 초안으로 정리한다.
audience: ["product", "developer"]
owner: product-team
stability: stable
version: "0.1.0"
tags: ["prd", "requirements", "product"]
---
```

| Field | 필수 | Type | 설명 |
|---|---:|---|---|
| `id` | 예 | string | catalog/module에서 참조하는 안정적인 식별자 |
| `asset_type` | 예 | enum | `rule`, `skill`, `prompt`, `template`, `knowhow`, `agent`, `command` |
| `title` | 예 | string | 사람이 읽는 이름 |
| `description` | 예 | string | asset의 사용 목적 |
| `audience` | 예 | string[] | 대상 역할. 예: `developer`, `product`, `business`, `governance`, `all` |
| `owner` | 예 | string | 책임 팀/개인. 개인 이름보다 팀 alias 권장 |
| `stability` | 예 | enum | `draft`, `beta`, `stable`, `deprecated` |
| `version` | 권장 | string | asset 단위 버전. SemVer 권장 |
| `tags` | 권장 | string[] | 검색/추천용 태그 |
| `reviewers` | 선택 | string[] | 승격/변경 리뷰 담당 |
| `source` | 선택 | string | 외부 참고자료 또는 내부 원본 링크 |
| `license` | 선택 | string | 외부 자료가 포함될 때 라이선스/사용 조건 |
| `deprecated_by` | 선택 | string | deprecated asset의 대체 asset id |

## 3. 타입별 추가 필드

### 3.1 `prompt`

```yaml
---
id: product-prd
asset_type: prompt
title: PRD 작성 프롬프트
description: 제품 아이디어를 PRD 초안으로 정리한다.
audience: ["product"]
owner: product-team
stability: stable
version: "0.1.0"
tags: ["prd", "product"]
inputs: ["idea", "target_user", "constraints"]
outputs: ["problem", "requirements", "non_goals", "acceptance_criteria"]
---
```

추가 필드:

| Field | 필수 | Type | 설명 |
|---|---:|---|---|
| `inputs` | 권장 | string[] | 사용자가 제공해야 하는 입력 |
| `outputs` | 권장 | string[] | 기대 산출물 섹션 |

### 3.2 `template`

```yaml
---
id: product-user-story-template
asset_type: template
title: 사용자 스토리 템플릿
description: 요구사항을 user story와 acceptance criteria로 구조화한다.
audience: ["product", "developer"]
owner: product-team
stability: stable
version: "0.1.0"
tags: ["user-story", "acceptance-criteria"]
required_sections: ["User Story", "Acceptance Criteria", "Non-goals"]
output_format: markdown
---
```

추가 필드:

| Field | 필수 | Type | 설명 |
|---|---:|---|---|
| `required_sections` | 권장 | string[] | 결과물에 반드시 포함될 섹션 |
| `output_format` | 권장 | string | `markdown`, `table`, `checklist` 등 |

### 3.3 `knowhow`

```yaml
---
id: frontend-review-checklist
asset_type: knowhow
title: 프론트엔드 리뷰 체크리스트
description: 팀에서 반복적으로 발견한 UI/상태관리 리뷰 포인트를 정리한다.
audience: ["developer"]
owner: frontend-team
stability: beta
version: "0.1.0"
tags: ["review", "frontend"]
reviewers: ["architecture-reviewer"]
promotion_status: candidate
sensitivity: internal
---
```

추가 필드:

| Field | 필수 | Type | 설명 |
|---|---:|---|---|
| `promotion_status` | 예 | enum | `candidate`, `reviewing`, `approved`, `rejected`, `archived` |
| `sensitivity` | 예 | enum | `public`, `internal`, `confidential` |
| `examples` | 권장 | string[] | 대표 사용 예시 또는 fixture 경로 |

`knowhow`는 민감정보가 섞일 가능성이 높으므로 `sensitivity=confidential`이면 bundle 기본 profile에
포함하지 않는다. 별도 승인된 내부 pack이나 project-local asset으로만 적용한다.

## 4. Catalog 설계

frontmatter는 개별 파일의 metadata이고, catalog는 사용자가 선택할 수 있는 asset 목록이다.

catalog의 책임:

```text
asset discovery
role/profile 추천
module 연결
stability/review 상태 확인
외부 asset pack 병합 기준 제공
```

초안 위치:

```text
agent-deploy/assets/catalog.draft.json
```

기본 구조:

```json
{
  "schemaVersion": "agentdeploy.assetCatalog.v1",
  "generatedAt": null,
  "assets": [
    {
      "id": "product-prd",
      "assetType": "prompt",
      "title": "PRD 작성 프롬프트",
      "path": "prompts/product/prd.md",
      "moduleIds": ["product-prompts"],
      "profiles": ["product", "full"],
      "audience": ["product"],
      "stability": "stable",
      "owner": "product-team",
      "tags": ["prd", "product"],
      "reviewStatus": "approved"
    }
  ]
}
```

## 5. Catalog 필드

| Field | 필수 | 설명 |
|---|---:|---|
| `id` | 예 | frontmatter `id`와 일치해야 하는 asset id |
| `assetType` | 예 | frontmatter `asset_type`과 일치해야 하는 type |
| `title` | 예 | 사용자에게 보여줄 이름 |
| `path` | 예 | `assets/` 기준 상대 경로 |
| `moduleIds` | 예 | 이 asset을 포함하는 module id 목록 |
| `profiles` | 예 | 추천 profile 목록 |
| `audience` | 예 | 대상 역할 |
| `stability` | 예 | `draft`, `beta`, `stable`, `deprecated` |
| `owner` | 예 | 책임 팀/개인 |
| `tags` | 권장 | 검색/추천 태그 |
| `reviewStatus` | 예 | `candidate`, `reviewing`, `approved`, `deprecated`, `rejected` |
| `targets` | 선택 | 특정 target 제한이 있을 때만 사용 |
| `skipReason` | 선택 | catalog에는 있으나 특정 target/profile에서 제외되는 이유 |

## 6. 검증 단계

검증은 한 번에 강제하지 않고 단계적으로 도입한다.

1. **Design only**
   - `schemas/asset-frontmatter.schema.json`
   - `schemas/asset-catalog.schema.json`
   - `assets/catalog.draft.json`
2. **Non-blocking check**
   - prompt/template/knowhow metadata 누락을 warning으로 출력
3. **Blocking check for new assets**
   - 새로 추가되는 prompt/template/knowhow에는 frontmatter 필수
4. **Catalog parity check**
   - catalog entry와 실제 파일/frontmatter/module/profile의 일치성 검증

## 7. 운영 원칙

- canonical rule은 항상 profile의 기반 레이어로 둔다.
- prompt/template/knowhow는 role별 추가 레이어로 둔다.
- 개인 knowhow는 기본 배포에 바로 넣지 않고 `candidate` 상태로 시작한다.
- 외부 자료를 기반으로 한 asset은 `source`와 `license`를 남긴다.
- target이 특정 asset type을 native로 지원하지 않으면 instruction-backed fallback 또는 skip reason을 남긴다.
