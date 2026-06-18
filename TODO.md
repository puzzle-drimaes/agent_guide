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
같은 회사 표준 agent 설정과 업무 방식을 사용할 수 있게 한다.
```

현재 결정된 큰 방향:

```text
1. project scope 설치가 기본이다.
   - 각 프로젝트에 AGENTS.md, CLAUDE.md, GEMINI.md, .codex/, .claude/, .gemini/ 등을 설치한다.
   - 전역 설정은 선택 옵션이다.

2. 배포 형태는 bundle 중심이다.
   - Windows: installer exe + install.bat
   - Linux/macOS: zip bundle + install.sh

3. agent-deploy는 버리지 않고 core로 확장한다.
   - 현재는 prototype/skeleton이다.
   - Manifest → Plan → Adapter → Apply → State 구조를 유지한다.

4. 하네스 엔지니어링 원칙을 따른다.
   - canonical source first
   - adapter per harness
   - semantic equivalence
   - capability-aware fallback

5. 회사 개발 룰도 agent asset으로 배포한다.
   - architecture rules
   - commit convention rules
   - security/source/knowledge sharing rules

6. 공용 AI 계정 운영의 목적은 비용 절감보다 지식 공유화다.
   - 20명 내외 구성원이 9개 AI 계정을 공유한다.
   - PR 노하우, weekly 회고, Prompt DB, 데모데이, 분기 governance를 운영한다.
```

참고 문서:

```text
docs/plans/codex/company-wide-agent-installer-rollout-plan.md
docs/plans/codex/company-wide-agent-rollout/README.md
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
docs/report.html
Finish.md
references/ECC/
references/k-sdd/
```

현재 파일 정리 상태:

```text
- 완료 이력 파일: Finish.md
- 통합 리포트 기준 파일: docs/report.html
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

- [ ] D01 정규 소스 저장 위치 확정
  - 권장: 별도 private repo `company-agent-kit`
- [ ] D02 1차 지원 AI 도구 확정
  - 권장: Codex + Claude 먼저, Gemini는 Pilot 중 추가
- [ ] D03 개발자/비개발자 전달 방식 확정
  - 개발자: project bundle installer
  - 비개발자: profile guide, Custom Instructions, Prompt DB, 필요 시 bundle
- [ ] D04 배포 채널 확정
  - Windows installer exe
  - Linux/macOS zip bundle
  - 내부 파일 서버 또는 GitHub Releases
- [ ] D04-B 기본 설치 범위 확정
  - 결정 방향: project scope 기본, user/global scope 옵션
- [ ] D05 지식 DB 위치 확정
  - 권장: Notion + GitHub + Slack
- [ ] D06 공용 계정 매핑 방식 확정
  - 업무 유형별 계정 배정 + 초기 담당자 1명 + 공동 사용자 N명
- [ ] D07 민감정보 입력 금지 범위 확정

### 1.2 P1 결정사항 확정

- [ ] D08-A Installer 내부 아키텍처 패턴 확정
  - 결정 방향: Clean Architecture + Hexagonal Architecture
  - MVVM은 Windows GUI/Web UI에만 적용
- [ ] D08-B 개발 프로젝트 코딩 아키텍처 표준 확정
  - Backend: Clean/Hexagonal
  - Frontend: Feature-based
  - Mobile/Desktop: MVVM + Clean Architecture
  - CLI/Automation: Command → UseCase → Adapter
- [ ] D08-C Git Commit Convention 표준 확정
  - `[type] 한글 제목`
  - `1. 내용`
  - `2. 수정 내역`
  - `3. 영향도`
  - `jira : ...`
- [ ] D08 1차 profile 범위 확정
  - 권장: minimal, developer, product, business
- [ ] D09 installer 실행 방식 확정
  - 개발자: bundle + install.sh/install.bat
  - Windows: exe
- [ ] D10 provenance 식별자 확정
  - actor.track
  - actor.aiAccountId
  - optional userId/machineLabel
- [ ] D11 Prompt DB 승인/승격 방식 확정
- [ ] D12 KPI 목표값 확정

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

주의:

```text
현재 환경에서 `node --test`는 child process 제한으로 일부 실패할 수 있다.
일반 CI 환경에서 재검증해야 한다.
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

- [ ] `codex.js` adapter 작성
- [ ] `rules`를 `AGENTS.md` 또는 `.agents/rules/`로 변환
- [ ] `skills`를 `.agents/skills/`로 설치
- [ ] `agents`를 `.codex/agents/`로 설치
- [ ] `mcp`/config를 `.codex/config.toml`에 병합하는 정책 설계
- [ ] TOML add-only merge 구현
- [ ] registry에 codex 등록
- [ ] Codex project scope smoke test 추가
- [ ] unsupported capability는 skip reason 기록

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

- [ ] `gemini.js` adapter 작성
- [ ] `rules`를 `GEMINI.md` 또는 `.gemini/` 하위로 설치
- [ ] `commands`를 `.gemini/commands/`로 설치
- [ ] agent/skill 미지원 기능은 instruction-backed fallback으로 처리
- [ ] registry에 gemini 등록
- [ ] Gemini project scope smoke test 추가

### 2.4 target capability matrix 구현

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
```

해야 할 일:

- [ ] `docs/harness-capability-matrix.md` 작성
- [ ] Claude/Codex/Gemini/Cursor capability 정리
- [ ] adapter별 native/fallback/skip 정책 작성
- [ ] harness parity test 추가

---

## 3. 회사 표준 asset 추가

현재 `agent-deploy/assets/`는 아직 starter 수준이다. 아래 회사 표준 asset을 추가해야 한다.

### 3.1 공통 rules 추가

대상:

```text
agent-deploy/assets/rules/common/
```

해야 할 일:

- [ ] `company-ai-principles.md` 추가
- [ ] `source-attribution.md` 추가
- [ ] `knowledge-sharing.md` 추가
- [ ] `security.md` 보강

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

- [ ] 현재 asset 내용 검토
- [ ] Backend Clean/Hexagonal rule 보강
- [ ] Frontend feature-based architecture rule 보강
- [ ] Mobile/Desktop MVVM + Clean Architecture rule 보강
- [ ] CLI/Automation Command → UseCase → Adapter rule 보강
- [ ] architecture-reviewer가 계층 위반을 체크하도록 명시

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/02d-project-coding-architecture-rules.md
```

### 3.3 commit convention rules 추가

대상:

```text
agent-deploy/assets/rules/developer/git-commit-convention.md
agent-deploy/assets/skills/commit-message-writer/SKILL.md
```

해야 할 일:

- [ ] 제공된 commit convention을 rule asset으로 작성
- [ ] `[type] 한글 제목` 형식 명시
- [ ] 허용 type 명시
  - feat
  - fix
  - refactor
  - chore
  - docs
  - test
- [ ] 본문 섹션 명시
  - 1. 내용
  - 2. 수정 내역
  - 3. 영향도
- [ ] Jira 링크 필수 명시
- [ ] Jira 티켓 없을 때 agent가 사용자에게 확인하도록 명시
- [ ] commit-message-writer skill 작성

참고 문서:

```text
docs/plans/codex/company-wide-agent-rollout/02e-git-commit-convention-plan.md
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

- [ ] `assets/skills/company-plan/`
- [ ] `assets/skills/company-code-review/`
- [ ] `assets/skills/prompt-asset/`
- [ ] `assets/skills/meeting-summary/`
- [ ] `assets/skills/customer-response/`
- [ ] `assets/skills/spec-writing/`
- [ ] `assets/prompts/product/`
- [ ] `assets/prompts/business/`
- [ ] `assets/prompts/governance/`

---

## 4. manifests/profiles 재구성

대상:

```text
agent-deploy/manifests/modules.json
agent-deploy/manifests/profiles.json
```

### 4.1 modules 추가

추가할 module:

- [ ] `common-rules`
- [ ] `security-rules`
- [ ] `source-attribution-rules`
- [ ] `knowledge-sharing-rules`
- [ ] `architecture-rules`
- [ ] `commit-convention-rules`
- [ ] `review-agents`
- [ ] `developer-skills`
- [ ] `product-skills`
- [ ] `business-skills`
- [ ] `governance-skills`
- [ ] `sdd-lite`
- [ ] `mcp-baseline`은 default 제외 또는 profile별 선택

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
- [ ] profile별 module dependencies 정리
- [ ] manifest validation 통과
- [ ] profile별 install smoke test 추가

---

## 5. bundle 배포 작업

기본 배포 방식:

```text
Windows: installer exe + install.bat
Linux/macOS: zip bundle + install.sh
```

### 5.1 Windows installer exe

해야 할 일:

- [ ] exe packaging 방식 결정
  - 예: pkg, nexe, bun compile, 별도 installer wrapper
- [ ] `CompanyAgentKitSetup.exe` 생성 script 추가
- [ ] project path 선택 UX 설계
- [ ] profile 선택 UX 설계
- [ ] target 선택 UX 설계
- [ ] 설치 전 dry-run 표시
- [ ] 설치 후 doctor 실행
- [ ] code signing 여부 결정

### 5.2 Linux/macOS zip bundle

해야 할 일:

- [ ] bundle build script 추가
- [ ] `company-agent-kit-linux-x64.zip`
- [ ] `company-agent-kit-macos-arm64.zip`
- [ ] zip 내부 구조 확정

권장 구조:

```text
company-agent-kit/
  ├─ bin/agent-deploy
  ├─ assets/
  ├─ manifests/
  ├─ docs/
  ├─ install.sh
  ├─ install.bat
  └─ README.md
```

### 5.3 install.sh / install.bat 개선

현재 존재:

```text
agent-deploy/install.sh
agent-deploy/install.bat
```

해야 할 일:

- [ ] path with spaces 지원 확인
- [ ] `--project` 명시 지원
- [ ] `--target all` 또는 복수 target 지원 여부 결정
- [ ] `--dry-run` 기본 안내
- [ ] 실패 시 `doctor` 안내
- [ ] Windows PowerShell/Command Prompt 모두 확인

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

추가:

- [ ] asset frontmatter schema validation
- [ ] skill schema validation
- [ ] agent schema validation
- [ ] rule schema validation
- [ ] install-state schema runtime validation
- [ ] unicode safety scan
- [ ] secret scan
- [ ] workflow security validation

### 7.2 MCP governance

해야 할 일:

- [ ] MCP를 minimal profile에서 제외
- [ ] MCP allowlist 도입
- [ ] filesystem MCP 기본 제외
- [ ] npx 기반 MCP는 버전 고정
- [ ] `DISABLED_MCPS` 또는 유사 환경 필터 설계
- [ ] MCP token은 `${ENV}` placeholder만 허용

### 7.3 artifact signing

- [ ] Windows exe signing 여부 결정
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

- [ ] P0 결정사항 확정
- [ ] Codex adapter 동작
- [ ] Claude adapter 동작
- [ ] minimal/developer/product/business profile 초안
- [ ] install.sh/install.bat 동작
- [ ] Windows 사용자는 임시로 bat 또는 node 실행 가능
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

- [ ] Windows exe 또는 대체 설치 경로 준비
- [ ] Linux/macOS zip bundle 준비
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
docs/report.html
references/ECC/
references/k-sdd/
Finish.md
```

해야 할 일:

- [ ] 새 분석 내용은 개별 report 파일을 다시 늘리기보다 `docs/report.html`에 통합.
- [ ] ECC/k-sdd 원본 참고는 root가 아니라 `references/` 하위 경로 기준으로 링크.
- [ ] 완료된 작업은 `Finish.md`에 추가.
- [ ] 남은 작업 순서는 이 `TODO.md`에 반영.
- [ ] 문서에 남아 있는 이전 경로가 생기면 즉시 정정.

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
- [ ] report.html의 내용과 plans 문서가 충돌하지 않게 유지

### 11.2 report.html 보강

최근 검토 결과 기준 남은 수정:

- [ ] `conventional commit` 표현을 회사형 commit convention으로 수정
- [ ] Jira 필수 규칙을 report에 추가
- [ ] 출처 문장 정리
- [ ] Linux/macOS zip bundle 남은 작업 명시
- [ ] 테스트 상태 문장을 더 정확히 수정

---

## 12. 권장 작업 순서 요약

가장 추천하는 실제 순서:

```text
1. P0 결정사항 확정
2. agent-deploy Codex adapter 구현
3. agent-deploy Gemini adapter 구현
4. company core rules 추가
5. commit convention rule 추가
6. architecture rule 보강
7. profiles/modules 재구성
8. install.sh/install.bat 검증
9. Linux/macOS zip bundle build
10. Windows exe packaging 설계
11. backup/conflict policy 추가
12. update/repair/uninstall 설계
13. Pilot 2주 진행
14. Prompt DB/Slack/GitHub governance 자동화
15. 전사 rollout
```

---

## 13. 인수인계 메모

다음 작업자가 꼭 기억해야 할 점:

```text
- agent-deploy는 버리는 것이 아니라 확장한다.
- project scope가 기본이다.
- user/global scope는 옵션이다.
- Windows는 exe, Linux/macOS는 zip bundle이 기본 배포 방식이다.
- sh/bat은 bundle 내부 실행 entrypoint다.
- Codex/Gemini adapter가 최우선이다.
- 회사 개발 룰도 agent asset으로 배포해야 한다.
- commit convention에는 Jira 링크가 필수다.
- governance는 agent-deploy만으로 끝나지 않는다.
- Prompt DB → skill 승격 루프가 지식 공유화의 핵심이다.
```
