# TODO — 사내 Agent Installer / Agent Deploy 인수인계 작업 목록

작성일: 2026-06-18  
목적: 현재까지 정리한 `docs/plans/codex/company-wide-agent-rollout/` 계획을 기반으로, 다음 작업자가 방향성을 잃지 않고 이어서 구현·운영할 수 있도록 남은 작업을 순서대로 정리한다.

---

## 0. 프로젝트 방향성 요약

최종 목표는 다음이다.

```text
회사의 누구나,
개발자/비개발자 여부와 관계없이,
Windows/Linux/macOS 환경에서,
Claude/Codex/Gemini 등 어떤 AI 도구를 쓰더라도,
같은 회사 표준 agent 설정, 업무 방식, Markdown 기반 AI 업무 자산을 사용할 수 있게 한다.
```

1차 제품 목표는 다음으로 구체화한다.

```text
회사 구성원은 하네스 엔지니어링으로 관리되는 공통 rule(*.md)을 사용한다.
다른 사람이 공유한 문서, prompt, skill(*.md)을 자신의 프로젝트에 적용할 수 있다.
agent 사용이 서툰 사람은 검증된 template(*.md)으로 좋은 결과를 얻는다.
agent 사용이 익숙한 사람은 자신의 공유 문서(*.md)를 배포 가능한 asset으로 정리하고 공유한다.
```

현재 결정된 큰 방향:

```text
1. project scope 설치가 기본이다.
   - 각 프로젝트에 AGENTS.md, CLAUDE.md, GEMINI.md, .codex/, .claude/, .gemini/ 등을 설치한다.
   - 전역 설정은 선택 옵션이다.

2. 배포 형태는 bundle 중심이다.
   - OS 공통: zip bundle
   - 설정 유도: SETUP_WIZARD.md 기반 첫 agent 대화
   - install.sh: bootstrap 안내 및 고급 사용자용 direct wrapper
   - Windows installer exe packaging은 제외

3. agent-deploy는 버리지 않고 core로 확장한다.
   - 현재는 prototype/skeleton이다.
   - Manifest → Plan → Adapter → Apply → State 구조를 유지한다.

4. 하네스 엔지니어링 원칙을 따른다.
   - canonical source first
   - adapter per harness
   - semantic equivalence
   - capability-aware fallback

5. 회사 개발 룰도 agent asset으로 배포한다.
   - spec driven development rules
   - architecture rules
   - commit convention rules
   - security/source/knowledge sharing rules
   - product/business prompt와 template
   - 개인/팀 shared document asset 후보

6. 공용 AI 계정 운영의 목적은 비용 절감보다 지식 공유화다.
   - 20명 내외 구성원이 9개 AI 계정을 공유한다.
   - PR 노하우, weekly 회고, Prompt DB, 데모데이, 분기 governance를 운영한다.

7. agent-deploy의 정체성은 설정 설치기에서 Markdown asset 배포기로 확장한다.
   - rule, skill, prompt, template, doc, agent, command의 의미를 구분한다.
   - target별 파일 구조가 달라도 canonical asset의 의미가 같으면 성공으로 본다.
   - 숙련자의 공유 문서는 바로 배포하지 않고 asset 후보 → 검증 → catalog/profile 반영 흐름을 거친다.
```

참고 문서:

```text
docs/plans/codex/company-wide-agent-installer-rollout-plan.md
docs/plans/codex/company-wide-agent-rollout/README.md
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
docs/references_analysis.html
Finish.md
references/ECC/
references/k-sdd/
```

현재 파일 정리 상태:

```text
- 완료 이력 파일: Finish.md
- 참고자료 분석 리포트: docs/references_analysis.html
- ECC 참고 소스: references/ECC/
- k-sdd 참고 소스: references/k-sdd/
- installer skeleton: agent-deploy/
```

---

## 1. 최우선 결정사항 정리

먼저 `00-open-decisions.md`의 P0/P1 항목을 실제 결정으로 바꿔야 한다.

### 1.1 P0 결정사항 확정

파일:

```text
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
```

해야 할 일:

- [x] D01 정규 소스 저장 위치 확정
  - 결정: 별도 private repo `company-agent-kit`
- [x] D02 1차 지원 AI 도구 확정
  - 권장: Codex + Claude 먼저, Gemini는 Pilot 중 추가
- [x] D03 개발자/비개발자 전달 방식 확정
  - 개발자: project bundle installer
  - 비개발자: profile guide, Custom Instructions, Prompt DB, 필요 시 bundle
- [x] D04 배포 채널 확정
  - OS 공통 zip bundle
  - SETUP_WIZARD.md 기반 agent setup flow
  - Windows installer exe 제외
  - 내부 파일 서버 또는 GitHub Releases
- [x] D04-B 기본 설치 범위 확정
  - 결정 방향: project scope 기본, user/global scope 옵션
- [x] D05 지식 DB 위치 확정
  - 결정: Notion + GitHub + Slack
- [x] D06 공용 계정 매핑 방식 확정
  - 결정: 업무 유형별 계정 배정 + 초기 담당자 1명 + 공동 사용자 N명
- [x] D07 민감정보 입력 금지 범위 확정
  - 결정: 고객 개인정보, credential, 미공개 계약/민감 재무/법무 검토 전 자료 입력 금지

### 1.2 P1 결정사항 확정

- [x] D08-A Installer 내부 아키텍처 패턴 확정
  - 결정 방향: Clean Architecture + Hexagonal Architecture
  - MVVM은 Windows GUI/Web UI에만 적용
- [x] D08-B 개발 프로젝트 코딩 아키텍처 표준 확정
  - Backend: Clean/Hexagonal
  - Frontend: Feature-based
  - Mobile/Desktop: MVVM + Clean Architecture
  - CLI/Automation: Command → UseCase → Adapter
- [x] D08-C Git Commit Convention 표준 확정
  - `[type] 한글 제목`
  - `1. 내용`
  - `2. 수정 내역`
  - `3. 영향도`
  - `jira : ...`
- [x] D08-D Spec Driven Development 적용 방식 확정
  - agent가 SDD-none/lite/full 직접 판단
  - none/lite/full은 같은 A~Z 흐름의 압축률 차이
  - 불필요한 QnA 없이 합리적 가정으로 진행
- [x] D08 1차 profile 범위 확정
  - Pilot 기본: minimal, developer, product, business
  - optional/내부 검토: governance, sdd, full
- [x] D09 installer 실행 방식 확정
  - Pilot 1차: zip bundle 복사/압축 해제 후 SETUP_WIZARD.md 기반 첫 agent 대화
  - install.sh는 bootstrap/wizard 안내 및 고급 사용자용 direct wrapper만 담당
  - repo checkout/node CLI는 개발 fallback
  - npx/OS별 binary/Windows exe/zip-web generator는 현재 배포 범위 제외
- [x] D10 provenance 식별자 확정
  - 기본: actor.track, actor.aiAccountId
  - optional: machineLabel, 승인된 pseudonymous userId
- [x] D11 Prompt DB 승인/승격 방식 확정
- [x] D12 KPI 목표값 확정

---

## 2. agent-deploy MVP 구현 작업

현재 `agent-deploy/`는 skeleton으로는 좋지만, 전사 목표를 모두 커버하지 않는다. 다음 순서로 확장한다.

### 2.1 현재 상태 확인

현재 구현됨:

- [x] manifest modules/profiles
- [x] dependency expansion / cycle detection
- [x] target adapter 구조
- [x] Claude adapter
- [x] Cursor adapter
- [x] project scope 기본 + home/global option 일부
- [x] install.sh
- [x] install.bat
- [x] dry-run
- [x] install-state
- [x] path-safety
- [x] symlink guard
- [x] manifest validation
- [x] Codex adapter
- [x] Codex project scope smoke test
- [x] TOML add-only merge for Codex MCP config
- [x] Gemini adapter
- [x] Gemini project scope smoke test
- [x] Claude/Codex/Gemini/Cursor profile smoke test
- [x] Pilot 기본 profile(minimal/developer/product/business) Codex/Claude/Gemini 직접 smoke test
- [x] company core rules/skills asset 승격
- [x] 직무별 developer/product/business/governance profile 초안
- [x] rule drift / entry parity / asset schema / catalog parity validation

검증:

```text
npm --prefix agent-deploy run validate
  → manifest/rule-drift/entry-parity/asset-schema/catalog-parity validation 통과

npm --prefix agent-deploy test
  → 32개 smoke test 전체 통과
```

### 2.1-A 최우선 전략 문서화

목적:

```text
agent-deploy를 단순 AI coding config installer가 아니라
회사 AI Markdown asset 배포/적용 인프라로 정의한다.
```

해야 할 일:

- [x] `agent-deploy/README.md`에 bundle goal과 Markdown asset taxonomy 반영
- [x] `agent-deploy/SETUP_WIZARD.md`에 사용 목적/숙련도/공유 문서 공유 흐름 반영
- [x] `docs/plans/codex/company-wide-agent-rollout/02-profiles-and-assets.md`에 asset taxonomy와 profile 구현 상태 반영
- [x] `prompts/templates/docs` frontmatter schema 설계
- [x] asset catalog 초안 설계
- [x] 외부/shared asset pack 적용 방식 설계
- [x] beginner quickstart/role guide 문서 추가

산출물:

```text
agent-deploy/docs/ASSET_SCHEMA_AND_CATALOG.md
agent-deploy/docs/ASSET_PACKS.md
agent-deploy/schemas/asset-frontmatter.schema.json
agent-deploy/schemas/asset-catalog.schema.json
agent-deploy/assets/catalog.draft.json
docs/specs/external-shared-asset-packs/
```

최우선 구현 후보:

```text
1. [x] prompt/template/doc schema를 non-blocking validation으로 연결
2. [x] catalog와 실제 파일/frontmatter/module/profile의 parity checker 추가
3. [x] shared document asset 작성/승격 skill 추가
4. [x] 외부/shared asset pack 적용 방식 설계
5. [x] SETUP_WIZARD.md 기반 초보자 role guide 보강
6. [x] asset pack Phase 1 validation-only 구현
   - `schemas/asset-pack.schema.json`
   - `scripts/check-pack.js`
   - pack root 구조/module/profile/path/conflict 검증
   - `.agent-packs/externals/` Markdown scanner
   - fixture + smoke test
```

### 2.2 Codex adapter 추가

대상 파일:

```text
agent-deploy/src/targets/codex.js
agent-deploy/src/targets/registry.js
agent-deploy/test/
```

설치 구조:

```text
project/
  ├─ AGENTS.md
  ├─ .agents/
  │   └─ skills/
  ├─ .codex/
  │   ├─ agents/
  │   └─ config.toml
  └─ .agent-deploy/
      └─ install-state.json
```

해야 할 일:

- [x] `codex.js` adapter 작성
- [x] `rules`를 `AGENTS.md` managed block과 `.agents/rules/`로 변환
- [x] `skills`를 `.agents/skills/`로 설치
- [x] `agents`를 `.codex/agents/`로 설치
- [x] `mcp`/config를 `.codex/config.toml`에 병합하는 정책 설계
- [x] TOML add-only merge 구현
- [x] registry에 codex 등록
- [x] Codex project scope smoke test 추가
- [x] unsupported capability는 skip reason 기록

구현 메모:

```text
Codex adapter는 project scope에서 AGENTS.md를 덮어쓰지 않고 managed block으로 upsert한다.
MCP 설정은 assets/mcp/servers.json을 .codex/config.toml의 [mcp_servers.*] TOML 섹션으로 add-only merge한다.
설치 상태는 .agent-deploy/install-state.json에 기록한다.
```

### 2.3 Gemini adapter 추가

대상 파일:

```text
agent-deploy/src/targets/gemini.js
agent-deploy/src/targets/registry.js
agent-deploy/test/
```

설치 구조:

```text
project/
  ├─ GEMINI.md
  ├─ .gemini/
  │   ├─ commands/
  │   └─ agents/
  └─ .agent-deploy/
      └─ install-state.json
```

해야 할 일:

- [x] `gemini.js` adapter 작성
- [x] `rules`를 `GEMINI.md` managed block과 `.gemini/rules/`로 설치
- [x] `commands`를 `.gemini/commands/`로 설치
- [x] agent/skill 미지원 기능은 instruction-backed fallback으로 처리
- [x] registry에 gemini 등록
- [x] Gemini project scope smoke test 추가

구현 메모:

```text
Gemini adapter는 project scope에서 GEMINI.md를 덮어쓰지 않고 managed block으로 upsert한다.
rules/commands/agents/skills는 .gemini/ 하위에 설치하고, agents/skills는 instruction-backed fallback으로 취급한다.
MCP 설정은 의도된 skip-with-reason 정책으로 확정했다(docs/specs/gemini-adapter/mcp-policy.md). 재검토 트리거 충족 시 native 설치로 전환한다.
설치 상태는 .agent-deploy/install-state.json에 기록한다.
```

### 2.4 target capability matrix 구현

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
```

해야 할 일:

- [x] `docs/harness-capability-matrix.md` 작성
- [x] Claude/Codex/Gemini/Cursor capability 정리
- [x] adapter별 native/fallback/skip 정책 작성
- [x] harness parity smoke test 보강 (Codex/Claude/Gemini core rules/skills + skip reason)
- [x] 루트 진입점(AGENTS/CLAUDE/GEMINI) parity 자동 가드 추가 (`check-entry-parity.js`, validate에 통합)

---

## 3. 회사 표준 asset 추가

현재 `agent-deploy/assets/`에는 company core rules 1차 세트가 승격됐다. 아래 목록은 완료된 항목과 후속 확장 항목을 함께 추적한다.

현재 프로젝트에는 dogfooding 용도로 아래 룰을 먼저 적용했다.

```text
AGENTS.md
CLAUDE.md
GEMINI.md
.agents/rules/common/
.agents/rules/developer/harness-engineering.md
.agents/rules/developer/spec-driven-development.md
.agents/rules/developer/architecture.md
.agents/rules/developer/git-commit-convention.md
.agents/skills/
```

주의: 이 파일들은 현재 프로젝트에 먼저 적용한 기준이며, 2026-06-18에 1차 company core rules/skills가 `agent-deploy/assets/`와 manifest/profile에 반영됐다. drift check는 `npm run validate`에 통합됐고, 이후에는 직무별 확장을 추가해야 한다.

### 3.1 공통 rules 추가

대상:

```text
agent-deploy/assets/rules/common/
```

해야 할 일:

- [x] `company-ai-principles.md` 추가
- [x] `source-attribution.md` 추가
- [x] `knowledge-sharing.md` 추가
- [x] `security.md` 보강

포함해야 할 핵심:

```text
- AI는 회사 지식 축적 도구다.
- 민감정보 입력 금지.
- 외부 자료 사용 시 출처/라이선스 표기.
- 반복 가능한 프롬프트는 Prompt DB에 등록.
- 공용 계정 사용 후 노하우를 남긴다.
```

### 3.2 개발자 architecture rules 추가/보강

현재 일부 추가됨:

```text
agent-deploy/assets/rules/developer/architecture.md
agent-deploy/assets/agents/architecture-reviewer.md
agent-deploy/assets/skills/architecture-review/SKILL.md
```

해야 할 일:

- [x] 현재 asset 내용 검토
- [x] Backend Clean/Hexagonal rule 보강
- [x] Frontend feature-based architecture rule 보강
- [x] Mobile/Desktop MVVM + Clean Architecture rule 보강
- [x] CLI/Automation Command → UseCase → Adapter rule 보강
- [x] architecture-reviewer가 계층 위반을 체크하도록 명시

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/02d-project-coding-architecture-rules.md
```

### 3.2-B 하네스 엔지니어링 rules 추가/보강

현재 프로젝트에 먼저 추가됨:

```text
.agents/rules/developer/harness-engineering.md
.agents/skills/harness-parity-review/SKILL.md
```

해야 할 일:

- [x] `agent-deploy/assets/rules/developer/harness-engineering.md`로 승격
- [x] `agent-deploy/assets/skills/harness-parity-review/SKILL.md`로 승격
- [x] modules.json에 `harness-engineering-rules` 추가
- [x] developer profile에 포함
- [x] Codex/Claude/Gemini adapter별 semantic equivalence test 추가

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
```

### 3.2-C Spec Driven Development rules 추가/보강

현재 프로젝트에 먼저 추가됨:

```text
.agents/rules/developer/spec-driven-development.md
.agents/skills/spec-mode-selector/SKILL.md
```

핵심 결정:

```text
SDD-none, SDD-lite, SDD-full은 서로 다른 프로세스가 아니다.
같은 A~Z 흐름을 공유하고, 중간 단계와 산출물의 깊이만 다르다.

none: A → C → Z
lite: A → C → E → F → G → Z
full: A → B → C → D → E → F → G → H → Z
```

해야 할 일:

- [x] `agent-deploy/assets/rules/developer/spec-driven-development.md`로 승격
- [x] `agent-deploy/assets/skills/spec-mode-selector/SKILL.md`로 승격
- [x] modules.json에 `spec-driven-development-rules` 추가
- [x] developer profile에 SDD 기본 포함
- [x] sdd profile에 SDD rules/skills 포함
- [x] Codex/Claude/Gemini adapter별 SDD 지시문 설치 경로 smoke test 보강
- [x] `docs/specs/<feature>/` 템플릿 추가 (`docs/specs/_template/`)

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/07-workflow-standardization.md
references/k-sdd/
```

### 3.3 commit convention rules 추가

대상:

```text
agent-deploy/assets/rules/developer/git-commit-convention.md
agent-deploy/assets/skills/commit-message-writer/SKILL.md
```

해야 할 일:

- [x] 제공된 commit convention을 rule asset으로 작성
- [x] `[type] 한글 제목` 형식 명시
- [x] 허용 type 명시
  - feat
  - fix
  - refactor
  - chore
  - docs
  - test
- [x] 본문 섹션 명시
  - 1. 내용
  - 2. 수정 내역
  - 3. 영향도
- [x] Jira 링크 필수 명시
- [x] Jira 티켓 없을 때 agent가 사용자에게 확인하도록 명시
- [x] commit-message-writer skill 작성

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/02e-git-commit-convention-plan.md
```


완료 메모(2026-06-18):

```text
- company core common/developer rules 1차 승격 완료
- spec-mode-selector / harness-parity-review / commit-message-writer skill asset 추가
- developer/full/sdd profiles 갱신
- Codex/Claude/Gemini smoke test 보강 및 validate/test 통과
```

### 3.4 직무별 skills/prompts 추가

필요 profile:

```text
minimal
developer
product
business
sdd
governance
```

해야 할 일:

- [x] `assets/skills/company-plan/` (Plan First, developer)
- [x] `assets/skills/company-code-review/` (Review Before Done, developer)
- [x] `assets/skills/spec-writing/` (SDD-full spec authoring, developer)
- [x] `assets/skills/prompt-asset/` (knowledge capture, 전 직무 공통; core/developer/full)
- [x] `assets/prompts/_universal-template.md` (범용 프롬프트 골격, prompt-asset-skill 모듈에 동봉)
- [x] `assets/prompts/` 스타터 라이브러리 (dev/doc/comparison/research, `prompt-library` 모듈; core/developer/full)
- [x] `assets/skills/meeting-summary/` (회의록 정리, business/product)
- [x] `assets/skills/customer-response/` (고객 응대 초안, business)
- [x] `assets/skills/product-spec/` (기획 요구사항 정리, product)
- [x] `assets/skills/quarterly-review/` `kpi-report/` `prompt-db-curation/` (governance)
- [x] `assets/prompts/product/` (prd / user-story / prioritization, `product-prompts` 모듈; product/full)
- [x] `assets/prompts/business/` (faq / proposal / announcement, `business-prompts` 모듈; business/full)
- [ ] `assets/prompts/governance/` (현재는 governance skill 3종으로 충분하다고 판단하여 보류)

---

## 4. manifests/profiles 재구성

대상:

```text
agent-deploy/manifests/modules.json
agent-deploy/manifests/profiles.json
```

### 4.1 modules 추가

추가/정리할 module:

- [x] `baseline-rules` (`rules/common` 전체: common/security/source-attribution/knowledge-sharing)
- [ ] `security-rules` / `source-attribution-rules` / `knowledge-sharing-rules` 세분화 여부 결정
- [x] `architecture-rules`
- [x] `commit-convention-rules`
- [x] `review-agent` / `architecture-review-agent`
- [x] developer core skills (`architecture-review`, `spec-mode-selector`, `harness-parity-review`, `commit-message-writer`)
- [x] developer workflow skills (`company-plan`, `company-code-review`, `spec-writing`)
- [x] `product-skills` (meeting-summary, product-spec)
- [x] `business-skills` (meeting-summary, customer-response)
- [x] `governance-skills` (quarterly-review, kpi-report, prompt-db-curation)
- [x] `spec-driven-development-rules` / `spec-mode-selector-skill`
- [ ] `mcp-baseline`은 default 제외 또는 profile별 선택
  - 현재 core/developer/full에는 포함되어 있으므로, Pilot 전 MCP governance 결정(D16/7.2)에 맞춰 재검토

### 4.2 profiles 재구성

권장:

```json
{
  "minimal": [
    "common-rules",
    "security-rules",
    "source-attribution-rules",
    "knowledge-sharing-rules"
  ],
  "developer": [
    "common-rules",
    "security-rules",
    "source-attribution-rules",
    "architecture-rules",
    "commit-convention-rules",
    "review-agents",
    "developer-skills"
  ],
  "product": [
    "common-rules",
    "security-rules",
    "source-attribution-rules",
    "knowledge-sharing-rules",
    "product-skills"
  ],
  "business": [
    "common-rules",
    "security-rules",
    "source-attribution-rules",
    "knowledge-sharing-rules",
    "business-skills"
  ]
}
```

해야 할 일:

- [ ] 기존 `core/full` 유지 여부 결정
  - 현재 구현은 minimal/core/developer/product/business/governance/sdd/full을 유지한다. Pilot 노출 범위는 D08에서 별도 결정한다.
- [x] `business` / `product` / `governance` 비개발 profile 신설 (baseline + prompt 자산 + 직무 skill)
- [x] profile별 module dependencies 정리
- [x] manifest validation 통과
- [x] Codex/Claude/Gemini profile별 install smoke test 보강

---

## 5. bundle 배포 작업

기본 배포 방식:

```text
OS 공통: zip bundle
설정 유도: SETUP_WIZARD.md 기반 첫 agent 대화
제외: Windows installer exe packaging
```

### 5.1 Windows installer exe 제외

결정:

```text
Windows installer exe는 현재 배포 범위에서 제외한다.
Windows 사용자는 zip bundle을 내려받고 SETUP_WIZARD.md를 첫 agent 대화에 전달한다.
install.sh는 bootstrap과 wizard 안내, 고급 사용자용 direct wrapper만 담당하며, install.bat은 필요 시 Node CLI를 호출하는 호환 wrapper로만 다룬다.
```

해야 할 일:

- [x] exe packaging 제외 결정 반영
- [ ] Windows 사용자의 shell 실행 전제와 fallback 안내 작성
- [ ] install.bat 유지 여부를 wrapper 관점에서 재검토

### 5.2 OS 공통 zip bundle

해야 할 일:

- [ ] bundle build script 추가
- [ ] `company-agent-kit.zip` 또는 OS별 zip naming 정책 결정
- [ ] zip 내부 구조 확정
- [ ] zip checksum 생성

권장 구조:

```text
company-agent-kit/
  ├─ bin/agent-deploy
  ├─ assets/
  ├─ manifests/
  ├─ docs/
  ├─ install.sh
  ├─ install.bat  # optional wrapper
  └─ README.md
```

### 5.3 SETUP_WIZARD.md 기반 agent setup flow 추가

현재 존재:

```text
agent-deploy/install.sh
agent-deploy/install.bat
```

해야 할 일:

- [x] `SETUP_WIZARD.md` 작성
  - 첫 agent 대화에서 읽을 목적/절차
  - project path
  - profile(minimal/developer/product/business)
  - target(codex/claude/gemini 또는 복수 선택)
  - scope(project 기본, user optional)
  - dry-run 명령 생성
  - 사용자 확인 후 apply 명령 생성
- [x] install.sh bootstrap 역할 정리
  - bundle 검증
  - wizard 파일 안내
  - 다음 agent 대화 시작 방법 출력
  - 고급 사용자용 direct wrapper 동작 유지 여부 검증
- [ ] path with spaces 지원 확인
- [ ] `--project` 명시 지원
- [ ] `--target all` 또는 복수 target 지원 여부 결정
- [ ] `--dry-run` 기본 안내
- [ ] 실패 시 `doctor` 안내
- [ ] install.bat은 optional wrapper로 유지할지 결정

---

## 6. installer lifecycle 기능

전사 배포 전에는 최소한 update/repair/uninstall 설계를 해야 한다.

### 6.1 backup/conflict policy

해야 할 일:

- [ ] `--backup` 추가
- [ ] backup 위치 결정
  - project scope: `project/.agent-deploy/backups/<timestamp>/`
  - user scope: global config root 하위
- [ ] conflict policy 추가
  - managed-overwrite
  - skip
  - append
  - merge-json
  - merge-toml
  - conflict-error

### 6.2 update

- [ ] 기존 install-state 읽기
- [ ] 새 plan과 diff
- [ ] managed file만 갱신
- [ ] 사용자 수정 파일 감지
- [ ] dry-run update 지원

### 6.3 repair

- [ ] install-state 기반 누락 파일 감지
- [ ] hash 또는 존재 여부 기반 drift detection
- [ ] `agent-deploy repair --scope project --project .`

### 6.4 uninstall

- [ ] install-state operations 역재생
- [ ] managed 파일만 삭제
- [ ] 사용자 생성 파일 삭제 금지
- [ ] uninstall dry-run 지원

---

## 7. 보안/공급망 작업

전사 배포 전 필수.

### 7.1 CI validation

현재:

- [x] manifest validation
- [x] rule drift check
- [x] entry parity check
- [x] asset frontmatter schema validation (`scripts/check-asset-schema.js`, validate에 통합)
- [x] asset catalog parity validation (`scripts/check-catalog-parity.js`, validate에 통합)
- [x] skill schema validation (위 가드에 포함: name/description/allowed-tools/argument-hint)
- [x] agent schema validation (위 가드에 포함: name=파일명/description/tools/model)
- [x] rule schema validation (위 가드에 포함: frontmatter optional, present 시 paths만 허용)

추가:

- [ ] install-state schema runtime validation
- [ ] unicode safety scan
- [ ] secret scan
- [ ] workflow security validation

구현 메모(2026-06-18):

```text
check-asset-schema.js는 closed schema(unknown key error) + 타입 검사 + name 일치(agent=파일명, skill=디렉터리명)를 검증한다.
frontmatter 파서는 zero-dependency(라이브러리 없음)로 `key: scalar`와 `key: ["a","b"]` 형태만 지원한다.
rule은 frontmatter가 optional이며 present 시 paths(string[])만 허용한다.
npm run validate가 5종 가드(manifest/rule-drift/entry-parity/asset-schema/catalog-parity)로 확장됐고, smoke test는 26개다.
새 frontmatter 키를 추가하려면 SCHEMAS를 함께 갱신해야 한다(의도된 리뷰 포인트).
catalog parity는 catalog entry의 실제 파일 존재 여부, module/profile 참조, module path 포함 관계, frontmatter 일치 여부를 검증한다.
```

### 7.2 MCP governance

해야 할 일:

- [ ] MCP를 minimal profile에서 제외
- [ ] MCP allowlist 도입
- [ ] filesystem MCP 기본 제외
- [ ] npx 기반 MCP는 버전 고정
- [ ] `DISABLED_MCPS` 또는 유사 환경 필터 설계
- [ ] MCP token은 `${ENV}` placeholder만 허용

### 7.3 artifact signing

- [x] Windows exe signing 제외 결정
- [ ] zip checksum 생성
- [ ] release manifest 생성
- [ ] 내부 배포 채널에서 checksum 검증 안내

---

## 8. governance 자동화

agent-deploy만으로 전부 커버하지 않는 영역이다. 별도 automation 또는 GitHub/Slack/Notion 연동이 필요하다.

### 8.1 1 PR = 1 노하우

- [ ] PR template에 AI 노하우 섹션 추가
- [ ] merge 시 누락 reminder GitHub Action 설계
- [ ] Notion/GitHub DB append 자동화 검토

### 8.2 weekly 회고

- [ ] Slack `#ai-knowhow` 폼 설계
- [ ] 매주 금 16:00 자동 발송
- [ ] 계정 담당자 mention
- [ ] 제출 현황 기록

### 8.3 Prompt DB

- [ ] Notion Prompt DB 생성
- [ ] 필드 정의
  - 이름
  - 목적
  - 직무
  - AI 도구
  - 권장 profile
  - 프롬프트 본문
  - 입력 예시
  - 출력 예시
  - 성공률
  - 사용 횟수
  - 작성자
  - 출처/라이선스
- [ ] Prompt DB → `assets/skills/company-*` 승격 절차 정의

### 8.4 Demo day / quarterly review

- [ ] 월간 데모데이 템플릿 작성
- [ ] 분기 governance review 템플릿 작성
- [ ] KPI dashboard 초안 작성

---

## 9. Pilot 준비

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/10-pilot.md
```

### 9.1 Pilot 대상

권장:

- [ ] 개발자 2명
- [ ] PM/기획 1명
- [ ] 비개발 직군 1명
- [ ] AI governance 담당 1명

### 9.2 Pilot 전 완료 조건

- [x] P0 결정사항 확정
- [x] Codex adapter 동작
- [x] Claude adapter 동작
- [x] minimal/developer/product/business profile 초안
- [ ] SETUP_WIZARD.md 기반 agent setup flow 검증
- [ ] Windows 사용자의 shell 실행 전제와 fallback 안내 확인
- [ ] Prompt DB 초안
- [ ] 계정 9개 매핑표 초안

### 9.3 Pilot 검증 항목

- [ ] 설치 성공률
- [ ] 설치 평균 소요 시간
- [ ] project scope 설정이 repo에 잘 남는지
- [ ] AI 도구별 의미 동등성
- [ ] 비개발자 profile 이해도
- [ ] PR 노하우 작성 가능 여부
- [ ] Prompt DB 등록 가능 여부
- [ ] 민감정보/출처 표기 rule 이해도

---

## 10. 전사 Rollout 전 체크리스트

전사 배포 전에 아래를 반드시 확인한다.

- [ ] OS 공통 zip bundle 준비
- [ ] SETUP_WIZARD.md 준비
- [ ] Codex/Claude/Gemini 중 최소 2개 target 안정화
- [ ] project scope 설치 기본값 확인
- [ ] global option은 선택으로 동작
- [ ] install-state 기록 정상
- [ ] backup 또는 최소 conflict policy 존재
- [ ] uninstall 또는 rollback 대응 계획 존재
- [ ] commit convention rule 배포
- [ ] architecture rule 배포
- [ ] source attribution rule 배포
- [ ] knowledge sharing rule 배포
- [ ] 공용 AI 계정 담당자 지정
- [ ] `#ai-help`, `#ai-knowhow`, `#ai-governance` 채널 준비
- [ ] Prompt DB 준비
- [ ] 첫 weekly 회고 일정 예약

---

## 11. 문서 유지보수 작업

### 11.0 현재 파일 정리 상태 유지

최근 정리된 기준:

```text
docs/references_analysis.html
references/ECC/
references/k-sdd/
Finish.md
```

해야 할 일:

- [ ] 새 ECC/k-sdd 참고자료 분석 내용은 개별 report 파일을 다시 늘리기보다 `docs/references_analysis.html`에 통합.
- [ ] ECC/k-sdd 원본 참고는 root가 아니라 `references/` 하위 경로 기준으로 링크.
- [ ] 완료된 작업은 `Finish.md`에 추가.
- [ ] 남은 작업 순서는 이 `TODO.md`에 반영.
- [ ] 문서에 남아 있는 이전 경로가 생기면 즉시 정정.
- [x] `docs/report.html`을 `docs/references_analysis.html`로 rename하고 참고자료 분석용임을 명시.

### 11.1 plans 문서 정리

현재 주요 문서:

```text
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
docs/plans/codex/company-wide-agent-rollout/01-principles-and-scope.md
docs/plans/codex/company-wide-agent-rollout/02-profiles-and-assets.md
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
docs/plans/codex/company-wide-agent-rollout/02c-installer-architecture.md
docs/plans/codex/company-wide-agent-rollout/02d-project-coding-architecture-rules.md
docs/plans/codex/company-wide-agent-rollout/02e-git-commit-convention-plan.md
docs/plans/codex/company-wide-agent-rollout/03-installer-mvp.md
docs/plans/codex/company-wide-agent-rollout/03b-project-bundle-install-strategy.md
docs/plans/codex/company-wide-agent-rollout/08-target-adapters.md
docs/plans/codex/company-wide-agent-rollout/13-governance-and-roadmap.md
```

해야 할 일:

- [ ] 결정된 사항은 `00-open-decisions.md`에 `Accepted`로 반영
- [ ] 더 이상 맞지 않는 내용은 삭제하지 말고 “변경됨”으로 표시
- [ ] `docs/references_analysis.html`이 ECC/k-sdd 참고자료 분석용 리포트임을 유지한다.

### 11.2 references_analysis.html 보강

최근 검토 결과 기준 남은 수정:

- [x] `conventional commit` 표현을 회사형 commit convention으로 수정
- [x] Jira 필수 규칙을 report에 추가
- [x] 출처 문장 정리
- [x] OS 공통 zip bundle 남은 작업 명시
- [x] 테스트 상태 문장을 더 정확히 수정

---

## 12. 권장 작업 순서 요약

가장 추천하는 실제 순서:

```text
1. SETUP_WIZARD.md agent setup flow 검증
2. install.sh bootstrap/direct wrapper 검증
3. OS 공통 zip bundle build script 추가
4. backup/conflict policy 추가
5. install-state runtime validation 추가
6. update/repair/uninstall 설계
7. Pilot 2주 진행
8. Prompt DB/Slack/GitHub governance 자동화
9. 전사 rollout
```

---

## 13. 인수인계 메모

다음 작업자가 꼭 기억해야 할 점:

```text
- agent-deploy는 버리는 것이 아니라 확장한다.
- project scope가 기본이다.
- user/global scope는 옵션이다.
- OS 공통 zip bundle이 기본 배포 방식이며 Windows exe packaging은 제외한다.
- SETUP_WIZARD.md가 첫 agent 대화용 setup wizard이며, install.sh는 bootstrap/안내와 고급 사용자용 direct wrapper 역할만 담당한다.
- P0/P1 결정, capability matrix, Pilot 기본 profile smoke test는 완료됐고, 다음 최우선은 setup wizard flow 검증과 bundle/lifecycle 보강이다.
- 회사 개발 룰은 agent asset으로 1차 배포됐으며, 이후에는 직무별/운영별 asset을 점진 확장한다.
- commit convention에는 Jira 링크가 필수다.
- governance는 agent-deploy만으로 끝나지 않는다.
- Prompt DB → skill 승격 루프가 지식 공유화의 핵심이다.
```
