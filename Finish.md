# Finish — 완료된 작업 정리

작성일: 2026-06-18  
목적: 현재까지 완료한 분석/문서화/초기 구현 상태를 다음 작업자가 빠르게 파악할 수 있게 정리한다.

> 기존 오타 파일명 `Finishde.md`를 `Finish.md`로 정정했다.

---

## 0. 최근 운영 반영

### 0.18 Kiro target adapter 및 setup wizard 반영

반영일: 2026-06-24

- [x] Kiro 공식 문서 기준으로 workspace steering(`.kiro/steering/`), Agent Skills(`.kiro/skills/`), MCP 설정(`.kiro/settings/mcp.json`) 표면을 확인하고 `agent-deploy/src/targets/kiro.js` adapter 추가.
- [x] 모든 manifest module target에 `kiro`를 포함하고, Kiro minimal/developer/idempotent smoke test를 추가.
- [x] SETUP_WIZARD와 사용자 안내 문서에서 선택 가능한 target에 Kiro를 포함.
- [x] canonical harness/architecture/company 원칙 rule과 배포 asset rule을 Kiro 포함 기준으로 동기화.
- [x] Kiro adapter spec(`docs/specs/kiro-adapter/`)에 요구사항/설계/tasks/review와 참고 출처 기록.

### 0.17 Drive `.md` 수신 기본 경로를 직접 다운로드 + 로컬 보안검사로 정리

반영일: 2026-06-24

- [x] Google Drive MCP/커넥터가 정상 동작할 때는 큰 `.md`를 base64 문자열이나 대화창 텍스트로 옮기지 않고, 파일을 원형 그대로 직접 다운로드하도록 `SETUP_WIZARD.md` 흐름을 수정.
- [x] 다운로드한 `.md`는 `.agent-packs/externals/` 검역 위치에 둔 뒤 로컬 파일에서 credential/customer data/민감정보/출처 누락을 검사하는 방식을 기본 추천으로 정리.
- [x] `SHARED_FOLDER_GUIDE.md`에도 같은 기준을 반영해 쓰는 쪽 flow와 연결 확인 요청 예시를 "직접 다운로드 후 로컬 보안검사" 중심으로 갱신.
- [x] 기존에 있던 `agent-deploy/INSTALL_GUIDE.html` 변경은 이번 작업 범위에 포함하지 않고, 커밋/릴리즈 산출물에서도 제외.

### 0.16 apply 후 지식공유 handoff 및 release bundle 재생성

반영일: 2026-06-24

- [x] `agent-deploy` CLI의 `apply` 성공 출력에 Google Drive `AI-Knowhow` 공유 prompts/skills 수신 여부를 묻는 다음 단계 안내를 추가.
- [x] `apply --json` 결과에도 같은 handoff 메시지를 `nextStep`으로 포함해 자동화가 stdout JSON 유효성을 유지하면서 후속 안내를 확인할 수 있게 정리.
- [x] `SETUP_WIZARD.md`의 install.sh 역할 설명을 "설치 명령 생성 + apply 후 지식공유 Q&A 연결" 범위로 정정해 11장 마무리 Q&A와 충돌하지 않게 정리.
- [x] 최신 `SETUP_WIZARD.md`와 CLI 변경이 들어가도록 `release/` bundle 재생성 및 zip 내부 section 11 포함 여부 확인.

### 0.15 README/운영 문서 현재 상태 최신화

반영일: 2026-06-24

- [x] 루트 `README.md`에 현재 구현 상태(target/profile/운영 명령/release 산출물/83개 smoke test)를 추가해 저장소 진입 문서가 최신 상태를 설명하도록 정리.
- [x] `agent-deploy/README.md`의 reference skeleton 표현을 reference implementation으로 갱신하고, `doctor/update/repair/uninstall` 및 `release/` 체크섬 검증 경로를 반영.
- [x] 비개발자/처음 사용자용 `INSTALL_GUIDE.html`을 추가하고, `SETUP_WIZARD.md`, package files, bundle builder에 포함.
- [x] `TODO.md`의 현재 구현/검증 상태를 8종 validation guard와 83개 smoke test 기준으로 갱신.

### 0.14 externals 비어 있을 때 Drive 가져오기 Q&A 보강

반영일: 2026-06-24

- [x] `SETUP_WIZARD.md`에 `.agent-packs/externals/skills|prompts`가 비어 있을 때 Google Drive `AI-Knowhow`에서 공유 `.md`를 가져올지 묻는 Q&A flow 추가.
- [x] agent가 직접 Drive에서 가져오려면 Google Drive MCP/커넥터 연결과 공유 드라이브 권한이 필요함을 안내하고, 연결이 없으면 Drive 웹 다운로드 fallback으로 안내하도록 정리.
- [x] 공유 `.md`를 받을 때 `보안 검사 후 받기(추천)`와 `원본 그대로 받기` 선택지를 추가하고, 원본도 canonical에 바로 적용하지 않고 externals 검역 구역에만 두도록 명시.
- [x] `SHARED_FOLDER_GUIDE.md`에도 동일한 가져오기/연동/보안검사 기준을 연결해 사용자·운영자 문서 간 흐름을 맞춤.

### 0.13 SETUP_WIZARD project root 지정 안내 보강

반영일: 2026-06-24

- [x] zip 압축 해제 후 생기는 `company-agent-kit/`은 bundle root이고, 실제 설치 대상은 그 부모인 project root임을 `SETUP_WIZARD.md` 0.2에 명시.
- [x] `<repo>/company-agent-kit`에서 실행할 때는 `--project ..`, `<repo>`에서 실행할 때는 `--project .`를 쓰는 예시를 추가해 bundle 자체에 설치되는 실수를 줄이도록 정리.

### 0.12 기존 agent 프로젝트 우선 병합 Q&A 및 preserve-existing 정책 추가

반영일: 2026-06-24

- [x] `SETUP_WIZARD.md`에 기존 agent 설정 사용 여부를 묻는 Q&A를 추가하고, 기존 설정이 있으면 `--conflict-policy preserve-existing` dry-run을 기본 추천하도록 정리.
- [x] `preserve-existing` conflict policy 추가: 기존 root instruction은 관리 블록 append, JSON/TOML MCP 설정은 비파괴 merge, 기존 copy-file 대상(rule/skill/prompt 등)은 overwrite하지 않고 skip으로 기록.
- [x] README/runbook/spec/schema/test를 갱신해 기존 프로젝트 적용 시 `dry-run → --backup apply` 흐름과 install-state provenance 검증을 반영.

### 0.11 공유 폴더 feedback → feedbacks 통일 + 하위 폴더 직통 링크/ID 명시

반영일: 2026-06-24

- [x] Google Drive AI-Knowhow의 피드백 폴더 실제 이름이 `feedbacks`(복수, skills/prompts와 일관)로 생성됨에 맞춰, 문서의 폴더 경로 `feedback/` → `feedbacks/`로 통일(스킬 디렉터리 `agent-bundle-feedback/`는 정밀 lookbehind로 보존).
- [x] SHARED_FOLDER_GUIDE 위치 섹션에 skills/prompts/feedbacks 하위 폴더 **직통 링크 + folder ID** 명시. 이름 검색 시 동명 결과가 많은 문제를 막고, agent는 `parentId='<id>'`로 검색을 한정한다(feedbacks id 2026-06-24 생성).
- [x] 적용 범위: knowledge-sharing rule(canonical+asset, drift 동기화), agent-bundle-feedback SKILL, SETUP_WIZARD, SHARED_FOLDER_GUIDE, non-developer-guide, pilot-runbook/retrospective/alpha-rehearsal-log, plans(06/10/12), TODO.

### 0.10 배포 산출물 폴더를 release/로 변경

반영일: 2026-06-24

- [x] `npm run bundle` 기본 출력 경로를 `agent-deploy/dist/` → 저장소 루트 `./release/`(`./tests`와 동일 깊이)로 변경. 운영자가 폴더 채로 Google Drive에 올리기 쉽도록 정리(`--out` 오버라이드는 그대로).
- [x] build-bundle.js(distDir→releaseDir, 기본 경로/주석), `.gitignore`, agent-deploy/README.md, docs/pilot-runbook.md 5.1을 release/ 기준으로 갱신.
- [x] 재빌드로 release/에 zip+sha256+manifest 생성 확인(zip 내부 install.bat CRLF 유지, 동일 바이트 alias). build-bundle.js/README가 번들에 포함되므로 이번 편집 기준으로 zip sha256은 갱신되며, release/의 .sha256와 자기일치한다.

### 0.9 베타 공지문 최종화 및 배포(게시) 절차 문서화

반영일: 2026-06-24

- [x] `docs/pilot-runbook.md` 5장 전사 공지문 placeholder 확정: 배포 위치(Google Drive 공유 폴더 `AI-Knowhow`의 `company-agent-kit-0.1.0.zip`), 운영 담당(AI 도입 운영 담당자), 문의 경로(`AI-Knowhow` Drive 운영 메모).
- [x] 5.1 "배포(게시) 준비 절차" 추가: 빌드 → checksum 검증 → Drive 업로드 → 공지 게시 → 사용자 검증 안내 순서 문서화.
- [x] 배포 채널을 Google Drive(`AI-Knowhow`)로 결정. 실제 zip 업로드/게시는 운영자가 진행(이번 작업은 문서 최종화까지).
- [x] 운영자 알파 리허설 로그(8장/7.2)의 "남은 일"을 공지문 최종화 완료 기준으로 갱신.

### 0.8 피드백 수집 UX를 agent Q&A 방식으로 정리

반영일: 2026-06-23

- [x] 사용자가 긴 피드백 프롬프트를 복사하지 않고 `피드백 해줘`라고 말하면 agent가 수집하도록 방향을 조정.
- [x] `agent-bundle-feedback` skill을 추가해 환경정보 수집 동의, 짧은 Q&A, 민감정보 제거, 업로드 전 확인 기준을 문서화.
- [x] 모든 기본 profile에 feedback skill을 포함해 최소 설치에서도 베타 피드백을 남길 수 있게 정리.
- [x] `docs/pilot-runbook.md`의 사용자 피드백 섹션을 프롬프트 입력 방식에서 skill 기반 Q&A 방식으로 변경.

### 0.7 전사 Agent Bundle 베타 runbook 정리

반영일: 2026-06-23

- [x] 폐쇄형 5명 Pilot 대신 전사 베타 배포 방식으로 1차 실행 방향을 정리.
- [x] 참가자별 OS/target/profile 배정과 D0/D+7/D+14 일정표는 1차 버전에서 제외.
- [x] 운영자 Windows/Linux 알파 리허설 범위를 `dry-run → apply → doctor → update --dry-run → repair --dry-run → uninstall --dry-run`으로 문서화.
- [x] 사용 후 피드백은 agent가 `.md`로 정리해 Google Drive `AI-Knowhow/feedback/` 업로드를 유도하는 방식으로 확정.
- [x] 실행용 문서 `docs/pilot-runbook.md`를 추가하고, 기존 `10-pilot.md`는 전사 베타 기준으로 연결/정리.

### 0.6 Agent 기반 Google Drive 피드백 업로드 유도

반영일: 2026-06-23

- [x] 피드백 수집을 agent가 `.md`로 정리해 Google Drive `AI-Knowhow/feedback/` 업로드를 유도하는 방식으로 정리.
- [x] Drive 커넥터가 있으면 agent 직접 업로드, 없으면 agent가 업로드용 `.md` 본문을 만들어 사용자가 웹에서 올리는 fallback을 문서화.
- [x] `SHARED_FOLDER_GUIDE.md`에 feedback 폴더, 파일명 규칙, 피드백 템플릿, agent 동작 기준을 추가.

### 0.5 이번 버전 실시간 메신저 운영 제외

반영일: 2026-06-23

- [x] 이번 버전의 피드백/공지/회고/거버넌스 흐름에서 실시간 메신저와 `#ai-*` 채널 표현을 제거.
- [x] 운영 경로를 Drive 운영 메모, 공유 폴더, 사내 게시판, 담당자 문의, GitHub 기록 중심으로 정리.
- [x] canonical knowledge-sharing rule과 배포 asset rule을 함께 갱신하고 rule drift 검증을 통과.

### 0.4 Pilot 선 배포 후 피드백 반영 방식 정리

반영일: 2026-06-23

- [x] Pilot은 별도 리허설 없이 준비된 bundle/profile을 먼저 배포한 뒤 실제 사용 피드백을 반영하는 방식으로 정리.
- [x] `10-pilot.md`에 배포 후 피드백 수집 채널, blocker workaround 문서화, 반영/보류 항목 구분 원칙을 추가.
- [x] Pilot 전 준비 항목은 rehearsal 성격의 검증이 아니라 필수 경로 확인 중심으로 표현을 조정.

### 0.1 GitHub prompts/skills 후보 branch 및 main 보호 운영

반영일: 2026-06-23

- [x] GitHub `prompts` / `skills` branch를 실제 후보 수집 branch로 운영하는 기준을 문서화.
- [x] `main`은 공식 배포본이며 agent 직접 push 금지, protected merge 전용으로 명시.
- [x] 후보 branch는 PR 없이 commit/push 가능하지만, `main` 반영은 운영자 검증 후 진행하도록 정리.
- [x] 세부 운영/권한 체크리스트를 `agent-deploy/docs/GITHUB_BRANCH_POLICY.md`에 추가.

### 0.2 WIP 기간 main push 차단 비활성화

반영일: 2026-06-23

- [x] 작업 진행 중에는 `main` 직접 push가 막히지 않도록 GitHub main 보호 ruleset enforcement를 `disabled`로 변경.
- [x] 운영 문서에 현재 WIP 기간은 `main` direct push 허용, 안정화 후 protected merge 전환으로 정리.

### 0.3 Drive + uploads 후보 등록 flow 정리

반영일: 2026-06-23

- [x] `prompt-asset` / `prompt-db-curation` skill을 Drive + GitHub 후보 branch 우선 정책으로 갱신.
- [x] 후보 branch 최소 등록 경로를 `uploads/prompts/<name>.md`, `uploads/skills/<skill-name>/SKILL.md`로 명시.
- [x] `SHARED_FOLDER_GUIDE.md`와 `GITHUB_BRANCH_POLICY.md`에 후보 등록 예시를 보강.
- [x] `SETUP_WIZARD.md`에서 공유 후보 등록 flow와 관련 문서로 안내하도록 연결.
- [x] PR/MR template은 만들지 않고, 후보 branch commit + Drive 운영 메모를 기준으로 운영자 수동 승격하도록 정리.

---

## 1. 분석 완료

### 1.1 ECC 분석

대상:

```text
references/ECC/
```

확인한 핵심:

- [x] ECC는 단순 설정 묶음이 아니라 cross-harness agent operating layer에 가깝다.
- [x] 67 agents, 271 skills, 92 commands, 114 rule markdown, 48 hook scripts 규모 확인.
- [x] skills-first 전략 확인.
- [x] commands는 legacy slash-entry compatibility surface 성격이 강함.
- [x] install manifests 구조 확인.
  - components
  - modules
  - profiles
- [x] target adapter 구조 확인.
- [x] install-state/provenance 구조 확인.
- [x] hooks/CI validation/security scan 계층 확인.
- [x] 사내 도입 시 ECC는 운영 자산/하네스 패턴/보안 라이브러리로 쓰는 것이 적합하다고 판단.

report 정리:

```text
docs/references_analysis.html
```

개별 ECC report는 현재 `docs/references_analysis.html` 참고자료 분석 리포트로 정리됐다.

---

### 1.2 k-sdd 분석

대상:

```text
references/k-sdd/
```

확인한 핵심:

- [x] k-sdd는 경량 installer architecture와 spec-driven workflow reference로 적합.
- [x] 8개 skills-mode target과 17개 skill set 구조 확인.
- [x] manifest → plan → execute 구조 확인.
- [x] path-safety와 symlink guard 중요성 확인.
- [x] Codex/Gemini/Claude templates 확인.
- [x] spec-driven workflow 확인.
  - discovery
  - requirements
  - design
  - tasks
  - impl
  - review
  - debug
- [x] boundary-first spec discipline 확인.
- [x] fresh implementer/reviewer/debugger 구조 확인.
- [x] 사내 도입 시 k-sdd는 설치 엔진/SDD-lite/장시간 구현 workflow 참고로 쓰는 것이 적합하다고 판단.

report 정리:

```text
docs/references_analysis.html
```

개별 k-sdd report는 현재 `docs/references_analysis.html` 참고자료 분석 리포트로 정리됐다.

---

### 1.3 참고자료 분석 리포트 작성

생성/검토된 파일:

```text
docs/references_analysis.html
```

포함된 내용:

- [x] ECC vs k-sdd 비교
- [x] 통합 배포 아키텍처
- [x] 통합 재사용 기법 카탈로그
- [x] 추출 우선순위 P0/P1/P2
- [x] agent-deploy 현황
- [x] 주의할 점
- [x] 통합 결론

검토 결과:

- [x] 참고자료 분석 리포트의 구조는 적절하다고 판단.
- [x] 이전 지적 사항 일부 반영됨.
  - ECC adapter 수 표현 정리.
  - project 기본/global option 반영.
  - starter asset v1 추가.
  - architecture asset 실제 추가 반영.
  - 테스트 표현 완화.

남은 보강은 `TODO.md`에 기록함.

---

### 1.4 참고 소스/리포트 파일 정리

정리 완료:

```text
references/ECC/
references/k-sdd/
docs/references_analysis.html
```

내용:

- [x] ECC 원본 참고 자료를 `references/ECC/` 아래로 이동.
- [x] k-sdd 원본 참고 자료를 `references/k-sdd/` 아래로 이동.
- [x] 개별 report 파일을 정리하고 `docs/references_analysis.html`을 ECC/k-sdd 참고자료 분석용 리포트로 사용.

---

## 2. 계획 문서 작성 완료

계획 문서 root:

```text
docs/plans/codex/company-wide-agent-rollout/
```

### 2.1 전체 목차/인덱스

작성 완료:

```text
docs/plans/codex/company-wide-agent-installer-rollout-plan.md
docs/plans/codex/company-wide-agent-rollout/README.md
```

내용:

- [x] 전체 목표 정리.
- [x] 단계별 문서 링크 정리.
- [x] 바로 다음 액션 정리.

---

### 2.2 결정 레지스터

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
```

포함:

- [x] P0/P1/P2/P3 결정사항 구분.
- [x] 정규 소스 저장 위치.
- [x] 1차 지원 AI 도구.
- [x] 개발자/비개발자 전달 방식.
- [x] 배포 채널.
- [x] project scope 기본 / user scope 옵션.
- [x] 지식 DB 위치.
- [x] 공용 계정 매핑.
- [x] 민감정보 입력 금지 범위.
- [x] installer 내부 아키텍처 패턴.
- [x] 프로젝트 코딩 아키텍처 표준.
- [x] Git Commit Convention 표준.
- [x] Spec Driven Development none/lite/full 적용 방식.
- [x] Prompt DB 승인 방식.
- [x] KPI 목표값.
- [x] MCP 기본 포함 여부.

---

### 2.3 원칙과 범위

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/01-principles-and-scope.md
```

포함:

- [x] 전사 AI 사용 원칙.
- [x] 보안 원칙.
- [x] 외부 자료 출처 표기 원칙.
- [x] 지식 공유 원칙.
- [x] 초기 범위와 제외 범위.

---

### 2.4 profiles/assets 설계

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/02-profiles-and-assets.md
```

포함:

- [x] minimal, developer, product, design, business, manager, sdd, governance profile.
- [x] assets 구조.
- [x] module 설계.
- [x] profile manifest 예시.
- [x] developer profile에 architecture-rules와 commit-convention-rules 반영.

---

### 2.5 하네스 엔지니어링 원칙

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
```

포함:

- [x] Harness / Harness Engineering 정의.
- [x] canonical source first.
- [x] adapter per harness.
- [x] project scope 기본.
- [x] capability-aware fallback.
- [x] semantic equivalence.
- [x] capability matrix.
- [x] adapter contract.
- [x] harness parity test.

---

### 2.6 Installer 내부 아키텍처

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/02c-installer-architecture.md
```

포함:

- [x] Clean Architecture + Hexagonal Architecture 방향.
- [x] MVVM은 Windows/Web UI에만 적용.
- [x] domain/usecases/ports/adapters/interfaces/main 구조.
- [x] UI가 직접 파일 write하지 않는 원칙.
- [x] target adapter가 하네스 차이를 흡수하는 원칙.

---

### 2.7 프로젝트 코딩 아키텍처 룰

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/02d-project-coding-architecture-rules.md
```

포함:

- [x] 회사 개발 프로젝트의 코딩 아키텍처 표준.
- [x] 공통 원칙.
  - 의존성 방향.
  - 경계 분리.
  - DTO/domain model 구분.
  - UseCase 중심.
  - Repository interface.
  - 테스트 가능성.
- [x] 프로젝트 유형별 기본 패턴.
  - Backend: Clean/Hexagonal.
  - Frontend: Feature-based.
  - Mobile/Desktop: MVVM + Clean.
  - CLI/Automation: Command → UseCase → Adapter.
  - Data/ML: pipeline stage 분리.
- [x] AI agent 작업 규칙.
- [x] architecture review checklist.

---

### 2.8 Git Commit Convention 계획

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/02e-git-commit-convention-plan.md
```

포함:

- [x] 사용자 제공 commit convention 반영.
- [x] `[type] 한글 제목` 형식.
- [x] 1. 내용 / 2. 수정 내역 / 3. 영향도.
- [x] Jira 링크 필수.
- [x] 허용 type.
  - feat
  - fix
  - refactor
  - chore
  - docs
  - test
- [x] commit-message-writer skill 계획.
- [x] commit-msg hook 계획.
- [x] Pilot warning → rollout required 전환 계획.

---

### 2.9 Installer MVP 계획

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/03-installer-mvp.md
```

포함:

- [x] CLI MVP 범위.
- [x] project scope 기본.
- [x] user scope 선택.
- [x] dry-run.
- [x] install-state.
- [x] path-safety.
- [x] OS 공통 zip bundle + SETUP_WIZARD.md 기반 agent setup flow 방향.

---

### 2.10 프로젝트 번들 설치 전략

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/03b-project-bundle-install-strategy.md
```

포함:

- [x] project scope 기본 결정.
- [x] user scope는 옵션.
- [x] OS 공통 zip bundle.
- [x] SETUP_WIZARD.md 기반 agent setup flow를 기본 entrypoint로 결정.
- [x] project/user scope install-state 구분.
- [x] 설정 우선순위.

---

### 2.11 온보딩/계정/거버넌스 문서

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/04-nondeveloper-onboarding.md
docs/plans/codex/company-wide-agent-rollout/05-shared-ai-accounts.md
docs/plans/codex/company-wide-agent-rollout/06-knowledge-kpi-system.md
docs/plans/codex/company-wide-agent-rollout/07-workflow-standardization.md
docs/plans/codex/company-wide-agent-rollout/09-training-and-onboarding.md
docs/plans/codex/company-wide-agent-rollout/10-pilot.md
docs/plans/codex/company-wide-agent-rollout/11-company-rollout.md
docs/plans/codex/company-wide-agent-rollout/12-automation.md
docs/plans/codex/company-wide-agent-rollout/13-governance-and-roadmap.md
```

포함:

- [x] 비개발자 설치 경험.
- [x] 20명/9개 공용 AI 계정 운영.
- [x] 1 PR = 1 노하우.
- [x] 매주 금 16:00 회고.
- [x] 월 1회 데모데이.
- [x] 분기 governance review.
- [x] Prompt DB.
- [x] 출처 표기 KPI.
- [x] Pilot 계획.
- [x] 전사 rollout 계획.
- [x] 30/60/90일 roadmap.

---

### 2.12 Claude 계획 비교 평가

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/14-claude-plan-review-and-gaps.md
```

포함:

- [x] Claude 계획 문서의 장점 평가.
- [x] Codex 계획 문서의 보강점 정리.
- [x] 2-track 전략.
- [x] supply-chain/lifecycle 보강 필요성.
- [x] governance-as-code.
- [x] Prompt DB → skill 승격 루프.

---

## 3. agent-deploy 현재 구현 상태

대상:

```text
agent-deploy/
```

### 3.1 구현되어 있는 것

- [x] `package.json`
- [x] `README.md`
- [x] `install.sh`
- [x] `install.bat`
- [x] `manifests/modules.json`
- [x] `manifests/profiles.json`
- [x] `schemas/install-state.schema.json`
- [x] `scripts/validate-manifests.js`
- [x] `src/cli.js`
- [x] `src/planner.js`
- [x] `src/apply.js`
- [x] `src/manifest.js`
- [x] `src/path-safety.js`
- [x] `src/json-merge.js`
- [x] `src/state.js`
- [x] `src/targets/helpers.js`
- [x] `src/targets/claude.js`
- [x] `src/targets/cursor.js`
- [x] `src/targets/registry.js`
- [x] smoke test 파일.

### 3.2 현재 asset

확인된 asset:

```text
agent-deploy/assets/rules/common/company-ai-principles.md
agent-deploy/assets/rules/common/security.md
agent-deploy/assets/rules/common/source-attribution.md
agent-deploy/assets/rules/common/knowledge-sharing.md
agent-deploy/assets/rules/python/coding-style.md
agent-deploy/assets/rules/developer/architecture.md
agent-deploy/assets/rules/developer/git-commit-convention.md
agent-deploy/assets/rules/developer/harness-engineering.md
agent-deploy/assets/rules/developer/spec-driven-development.md
agent-deploy/assets/agents/code-reviewer.md
agent-deploy/assets/agents/architecture-reviewer.md
agent-deploy/assets/commands/plan.md
agent-deploy/assets/skills/architecture-review/SKILL.md
agent-deploy/assets/skills/commit-message-writer/SKILL.md
agent-deploy/assets/skills/harness-parity-review/SKILL.md
agent-deploy/assets/skills/spec-mode-selector/SKILL.md
agent-deploy/assets/mcp/servers.json
```

### 3.3 검증 상태

확인:

```text
manifest validation OK
```

검증:

```text
npm --prefix agent-deploy test
  → 전체 테스트 통과
```

---

## 3-B. 현재 프로젝트 dogfooding 적용 상태

현재 프로젝트에 배포 예정 개발 룰을 먼저 적용했다.

적용된 진입점:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
```

적용된 canonical rule source:

```text
.agents/rules/common/company-ai-principles.md
.agents/rules/common/security.md
.agents/rules/common/source-attribution.md
.agents/rules/common/knowledge-sharing.md
.agents/rules/developer/harness-engineering.md
.agents/rules/developer/spec-driven-development.md
.agents/rules/developer/architecture.md
.agents/rules/developer/git-commit-convention.md
```

적용된 skill:

```text
.agents/skills/architecture-review/SKILL.md
.agents/skills/commit-message-writer/SKILL.md
.agents/skills/harness-parity-review/SKILL.md
.agents/skills/spec-mode-selector/SKILL.md
```

의미:

- [x] 하네스 엔지니어링 룰을 현재 프로젝트에 먼저 적용.
- [x] SDD-none/lite/full 자동 판단 룰을 현재 프로젝트에 먼저 적용.
- [x] 코딩 아키텍처 룰을 현재 프로젝트에 먼저 적용.
- [x] Git commit convention 룰을 현재 프로젝트에 먼저 적용.
- [x] Claude/Codex/Gemini 공통 진입점 문서를 생성.
- [x] canonical source first 원칙에 따라 `.agents/rules/`를 기준 위치로 사용.

남은 일:

- [x] 동일 내용을 `agent-deploy/assets/`로 승격.
- [x] modules/profile manifest에 포함.
- [x] adapter가 각 harness 파일로 변환하도록 구현.
- [x] SDD rules/skills를 developer/sdd profile에 반영.
- [x] `.agents/rules` ↔ `agent-deploy/assets/rules` drift check 추가 (`npm run validate`에 통합).
- [x] `docs/specs/<feature>/` reusable template 추가 (`docs/specs/_template/`).

---

## 4. 방향성 결정 완료/변경 이력

### 4.1 전역 설정 → 프로젝트별 설정으로 변경

초기에는 사용자 전역 설정 중심으로 검토했지만, 최종 방향은 다음으로 변경됐다.

```text
project scope 기본
user/global scope 옵션
```

이유:

- 프로젝트별 규칙이 repo에 명확히 남는다.
- PR로 설정 변경을 리뷰할 수 있다.
- 팀원이 같은 프로젝트에서 같은 agent behavior를 얻는다.

### 4.2 배포 형태 결정

정리된 방향(최신 변경 반영):

```text
OS 공통:
  zip bundle
  SETUP_WIZARD.md 기반 agent setup flow

제외:
  Windows installer exe packaging

선택:
  user/global scope
```

변경 메모:

```text
초기에는 Windows exe + install.bat, Linux/macOS zip + install.sh로 정리했으나,
최신 결정은 OS 공통 zip bundle + SETUP_WIZARD.md 기반 agent setup flow다.
install.sh는 bootstrap/안내 역할만 담당하고, install.bat은 optional wrapper 여부만 검토한다.
```

### 4.3 하네스 엔지니어링 방향 결정

핵심:

```text
파일 구조가 같아지는 것이 아니라 의미가 같아지는 것이 목표다.
```

예:

```text
Claude:
  .claude/skills/company-code-review/SKILL.md

Codex:
  .agents/skills/company-code-review/SKILL.md

Gemini:
  GEMINI.md에 review workflow instructions
```

### 4.4 코딩 아키텍처 룰 방향 결정

정리된 기본값:

```text
Backend:
  Clean Architecture 또는 Hexagonal Architecture

Frontend:
  Feature-based architecture

Mobile/Desktop:
  MVVM + Clean Architecture

CLI/Automation:
  Command → UseCase → Adapter
```

### 4.5 Commit Convention 방향 결정

사용자 제공 규칙을 표준으로 문서화함.

형식:

```text
[type] 한글 제목

1. 내용
...

2. 수정 내역
...

3. 영향도
...

jira : https://<YOUR_SPACE>.atlassian.net/browse/{TICKET-KEY}
```

### 4.6 Codex adapter 1차 구현

생성/수정된 주요 파일:

```text
agent-deploy/src/targets/codex.js
agent-deploy/src/toml-merge.js
agent-deploy/src/targets/registry.js
agent-deploy/src/targets/helpers.js
agent-deploy/src/apply.js
agent-deploy/manifests/modules.json
agent-deploy/test/smoke.test.js
docs/specs/codex-adapter/
```

구현 내용:

- [x] Codex target adapter 추가.
- [x] project scope 기본 설치 지원.
- [x] `AGENTS.md` managed block upsert 지원.
- [x] canonical rules를 `.agents/rules/`로 설치.
- [x] canonical skills를 `.agents/skills/`로 설치.
- [x] canonical agents를 `.codex/agents/`로 설치.
- [x] `assets/mcp/servers.json`을 `.codex/config.toml`로 add-only TOML merge.
- [x] Codex 미지원 slash command는 skip reason으로 기록.
- [x] Codex install-state를 `.agent-deploy/install-state.json`에 기록.
- [x] Codex minimal/developer smoke test 추가.

검증 결과:

```text
npm --prefix agent-deploy run validate
  → manifest validation OK

npm --prefix agent-deploy test
  → 11개 중 11개 통과
```

### 4.7 Gemini adapter 1차 구현

생성/수정된 주요 파일:

```text
agent-deploy/src/targets/gemini.js
agent-deploy/src/targets/registry.js
agent-deploy/manifests/modules.json
agent-deploy/test/smoke.test.js
docs/specs/gemini-adapter/
```

구현 내용:

- [x] Gemini target adapter 추가.
- [x] project scope 기본 설치 지원.
- [x] `GEMINI.md` managed block upsert 지원.
- [x] canonical rules를 `.gemini/rules/`로 설치.
- [x] canonical commands를 `.gemini/commands/`로 설치.
- [x] canonical agents를 `.gemini/agents/` fallback으로 설치.
- [x] canonical skills를 `.gemini/skills/` fallback으로 설치.
- [x] Gemini MCP config 미확정 항목은 skip reason으로 기록.
- [x] Gemini install-state를 `.agent-deploy/install-state.json`에 기록.
- [x] Gemini minimal/developer smoke test 추가.

검증 결과:

```text
npm --prefix agent-deploy run validate
  → manifest validation OK

npm --prefix agent-deploy test
  → 14개 중 14개 통과
```

### 4.8 Company core rules asset 승격

생성/수정된 주요 파일:

```text
agent-deploy/assets/rules/common/
agent-deploy/assets/rules/developer/
agent-deploy/assets/skills/spec-mode-selector/SKILL.md
agent-deploy/assets/skills/harness-parity-review/SKILL.md
agent-deploy/assets/skills/commit-message-writer/SKILL.md
agent-deploy/manifests/modules.json
agent-deploy/manifests/profiles.json
agent-deploy/test/smoke.test.js
docs/specs/company-core-assets/
```

구현 내용:

- [x] `.agents/rules/common`의 company AI principles, security, source attribution, knowledge sharing 룰을 deploy asset으로 승격.
- [x] `.agents/rules/developer`의 architecture, Git commit convention, harness engineering, SDD 룰을 deploy asset으로 승격.
- [x] spec-mode-selector, harness-parity-review, commit-message-writer skill을 target-neutral asset으로 추가.
- [x] developer rule modules를 파일 단위로 분리해 `minimal` profile에 developer rules가 섞이지 않게 정리.
- [x] `developer`, `full`, `sdd` profile을 core rules/skills 기준으로 갱신.
- [x] Codex/Claude/Gemini smoke test가 common rules, developer rules, workflow skills, skip reason을 검증하도록 보강.
- [x] Cursor adapter가 file-level rule module도 flatten할 수 있게 보강.

검증 결과:

```text
npm --prefix agent-deploy run validate
  → manifest validation OK

npm --prefix agent-deploy test
  → 14개 중 14개 통과
```

후속 메모:

- `.agents/rules`와 `agent-deploy/assets/rules`의 drift check는 4.9에서 추가됨.
- Gemini MCP native policy는 4.9에서 의도된 skip-with-reason 정책으로 확정됨.

---

### 4.9 후속: rule drift check / spec template / Gemini MCP 정책

생성/수정된 주요 파일:

```text
agent-deploy/scripts/check-rule-drift.js
agent-deploy/package.json
docs/specs/_template/
docs/specs/README.md
docs/specs/gemini-adapter/mcp-policy.md
agent-deploy/src/targets/gemini.js
```

구현 내용:

- [x] `.agents/rules` ↔ `agent-deploy/assets/rules` content drift check 스크립트 추가.
- [x] `npm run validate`가 manifest validation + drift check를 함께 실행하도록 연결.
- [x] canonical source가 없는 번들 모드에서는 drift check가 자동 skip.
- [x] drift 음성 테스트로 가드 동작 확인 (실제 drift는 exit 1, 동기화 상태는 exit 0).
- [x] SDD-full 재사용 템플릿 `docs/specs/_template/`(requirements/design/tasks/review) 추가, README에 사용법 반영.
- [x] Gemini MCP를 의도된 skip-with-reason 정책으로 확정하고 `docs/specs/gemini-adapter/mcp-policy.md`에 결정/재검토 트리거 기록.

검증 결과:

```text
npm --prefix agent-deploy run validate
  → manifest validation OK
  → rule drift check OK (8 canonical rules in sync with assets)

npm --prefix agent-deploy test
  → 14개 중 14개 통과
```

SDD mode: lite (작은 가드 스크립트 + 문서 템플릿 + 정책 문서화).

---

### 4.10 후속: 진입점 parity 정책(C) + 자동 가드(B)

배경: 루트 진입점(AGENTS.md/CLAUDE.md/GEMINI.md)은 canonical `.agents/rules/`를 가리키는 포인터다. 의미는 같지만 in-context 깊이가 비대칭이고, 진입점 parity를 강제하는 자동 장치가 없었다.

생성/수정된 주요 파일:

```text
.agents/rules/developer/harness-engineering.md            (#6 Entry pointer parity 추가)
agent-deploy/assets/rules/developer/harness-engineering.md (재승격)
agent-deploy/scripts/check-entry-parity.js
agent-deploy/package.json
```

구현 내용:

- [x] (C) "포인터 + canonical source = semantic equivalence 충족" 모델을 harness-engineering 룰의 정식 원칙(#6 Entry pointer parity)으로 명문화.
- [x] (C) canonical 룰을 먼저 수정하고 `agent-deploy/assets`로 재승격 (canonical-source-first dogfooding, drift check로 동기화 확인).
- [x] (B) entry-parity 가드 추가: 각 진입점이 canonical source를 가리키는지, 모든 canonical 룰을 커버하는지, dangling 룰 경로가 없는지 검사.
- [x] (B) `npm run validate`가 manifest + rule drift + entry parity 3중 검사를 실행하도록 연결.
- [x] 음성 테스트로 가드 확인: dangling ref와 미커버 신규 룰 모두 exit 1, 정상 상태 exit 0.

검증 결과:

```text
npm --prefix agent-deploy run validate
  → manifest validation OK
  → rule drift check OK (8 canonical rules in sync with assets)
  → entry parity check OK (3 entry files cover 8 canonical rules)

npm --prefix agent-deploy test
  → 14개 중 14개 통과
```

SDD mode: lite (정책 1개 명문화 + 가드 스크립트 1개 + validate 연결).

---

### 4.11 후속: asset frontmatter schema 검증 가드 (TODO 7.1, 대안 B)

배경: agent/skill/command/rule asset의 frontmatter가 잘못돼도(키 오타, 필수 키 누락, name 불일치) 설치 시 target 하네스가 조용히 무시할 뿐 사전 차단 장치가 없었다. 직전에 install-state schema enum drift를 발견한 것과 같은 "검증 가드" 테마의 연장.

생성/수정된 주요 파일:

```text
agent-deploy/scripts/check-asset-schema.js   (신규 가드)
agent-deploy/package.json                     (당시 validate에 4번째 가드 연결; 현재는 catalog/unicode/secret/MCP 포함 8종 가드)
agent-deploy/test/smoke.test.js               (positive/negative 테스트 2개 추가)
TODO.md                                        (7.1 갱신)
```

구현 내용:

- [x] zero-dependency frontmatter 파서(`key: scalar`, `key: ["a","b"]`)로 라이브러리 추가 없이 검증.
- [x] closed schema: 미정의 키는 error → 오타/잘못된 키 차단. 새 키 추가 시 SCHEMAS 갱신 강제(의도된 리뷰 포인트).
- [x] agent: name(파일명 일치)/description 필수, tools/model optional.
- [x] skill: name(디렉터리명 일치)/description 필수, allowed-tools/argument-hint/model optional. SKILL.md 누락 디렉터리 탐지.
- [x] command: description 필수, argument-hint/allowed-tools/model optional.
- [x] rule: frontmatter optional, present 시 paths(string[])만 허용.
- [x] `checkAssetSchemas(assetRoot)`를 export하여 테스트에서 import(positive=실 asset 통과, negative=임시 잘못된 asset 검출).
- [x] `npm run validate`를 당시 네 가지 가드(manifest/rule-drift/entry-parity/asset-schema)로 확장. 이후 catalog parity, unicode safety, secret scan, MCP governance가 추가되어 현재는 8종 가드다.

검증 결과:

```text
npm --prefix agent-deploy run validate
  → manifest validation OK
  → rule drift check OK (8 canonical rules in sync with assets)
  → entry parity check OK (3 entry files cover 8 canonical rules)
  → asset schema validation OK (16 assets: agents, commands, skills, rules)

npm --prefix agent-deploy test
  → 당시 16개 중 16개 통과. 최신 smoke test는 26개 통과 기준이다.
```

SDD mode: lite (가드 스크립트 1개 + 테스트 2개 + validate 연결, 기존 guard 패턴 따름).

---

### 4.12 P0 운영 결정 확정

대상 파일:

```text
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
TODO.md
docs/references_analysis.html
```

확정 내용:

- [x] D01 정규 소스 저장 위치: 별도 private repo `company-agent-kit`
- [x] D05 지식 DB 위치: Google Drive + GitHub (이번 버전에서 실시간 메신저/Notion 제외)
- [x] D06 공용 계정 매핑 방식: 업무 유형별 계정 배정 + 계정별 초기 담당자 1명 + 공동 사용자 N명
- [x] D07 민감정보 입력 금지 범위: 고객 개인정보, credential, 미공개 계약 조건, 민감 재무 정보, 법무 검토 전 외부 공개 불가 자료, 사내 계정 credential 입력 금지

반영 내용:

- [x] `00-open-decisions.md`에서 D01/D05/D06/D07 상태를 `Accepted`로 변경하고 결정 블록을 추가.
- [x] P0 체크리스트를 모두 완료 상태로 갱신.
- [x] `TODO.md`의 다음 작업 순서를 capability matrix와 bundle/lifecycle 중심으로 재정렬.
- [x] `docs/references_analysis.html`의 남은 작업 설명에서 P0 승인 항목을 제거하고 P1/P2 운영 결정 구체화로 갱신.

SDD mode: lite (결정 레지스터/인수인계 문서 정합성 갱신).

---

### 4.13 참고자료 분석 리포트 파일명 정정

대상 파일:

```text
docs/references_analysis.html
AGENTS.md
CLAUDE.md
GEMINI.md
TODO.md
README.md
.agents/rules/common/source-attribution.md
agent-deploy/assets/rules/common/source-attribution.md
```

정리 내용:

- [x] `docs/report.html`을 `docs/references_analysis.html`로 rename.
- [x] HTML 제목/개요/footer에 참고자료 분석용 리포트임을 명시.
- [x] AGENTS/TODO/README 계열 문서에 참고자료 분석용 리포트임을 반영.
- [x] source-attribution rule의 참고 소스 경로를 새 파일명으로 갱신.

SDD mode: lite (파일명/문서 의미 정정).

---

### 4.14 Harness capability matrix 작성

대상 파일:

```text
docs/harness-capability-matrix.md
TODO.md
```

작성 내용:

- [x] Claude/Codex/Gemini/Cursor target별 설치 root와 install-state 위치 정리.
- [x] rules/skills/agents/commands/prompts/MCP/merge/skip reason capability matrix 작성.
- [x] profile별 smoke test 직접/간접 검증 범위 정리.
- [x] Codex command skip, Cursor command skip, Gemini MCP skip 정책과 후속 재검토 조건 정리.
- [x] Pilot 전 smoke test 보강, state 위치, MCP governance, Cursor Pilot 범위 리스크 정리.

SDD mode: lite (현재 adapter/manifest/test 상태 문서화).

---

### 4.15 P1 운영 결정 확정

대상 파일:

```text
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
TODO.md
```

확정 내용:

- [x] D08 1차 profile 범위: Pilot 기본은 minimal/developer/product/business, governance/sdd/full은 optional 또는 내부 검토용.
- [x] D09 installer 실행 방식: 최신 결정은 zip bundle 복사/압축 해제 후 SETUP_WIZARD.md 기반 첫 agent 대화, repo checkout/node CLI는 개발 fallback.
- [x] D10 provenance 식별자: actor.track과 actor.aiAccountId 기본, machineLabel과 승인된 pseudonymous userId optional.
- [x] D11 Prompt DB 승인 방식: DB 등록 → 사용/성공률 태깅 → 데모/분기 리뷰 → owner 지정 → company skill PR → installer 배포.
- [x] D12 KPI 목표값: PR 노하우 80%, 회고 제출 7/9, Prompt DB 월 10개, 출처 표기 90%, Pilot 설치 성공률 80%.

반영 내용:

- [x] D08~D12 상태를 `Accepted`로 변경하고 결정 블록을 추가.
- [x] P1 결정 체크리스트를 추가.
- [x] TODO의 다음 우선순위를 Pilot 대상 smoke test와 install script 검증으로 이동.

SDD mode: lite (결정 레지스터/인수인계 문서 정합성 갱신).

---

### 4.16 Pilot 기본 profile smoke test 보강

대상 파일:

```text
agent-deploy/test/smoke.test.js
docs/harness-capability-matrix.md
TODO.md
```

구현 내용:

- [x] Claude product profile 직접 smoke test 추가.
- [x] Codex business profile 직접 smoke test 추가.
- [x] Gemini product/business profile 직접 smoke test 추가.
- [x] Pilot 기본 profile(minimal/developer/product/business)을 Codex/Claude/Gemini에서 직접 검증하도록 보강.
- [x] harness capability matrix의 profile별 검증 범위를 최신화.

검증 결과:

```text
npm --prefix agent-deploy test
  → 당시 23건 모두 통과. 최신 smoke test는 26개 통과 기준이다.
```

SDD mode: lite (기존 smoke test 보강, adapter 로직 변경 없음).

---

### 4.17 배포 전략 변경: Windows exe 제외, zip bundle + agent setup wizard

대상 파일:

```text
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
docs/plans/codex/company-wide-agent-rollout/03-installer-mvp.md
docs/plans/codex/company-wide-agent-rollout/03b-project-bundle-install-strategy.md
docs/plans/codex/company-wide-agent-rollout/02c-installer-architecture.md
TODO.md
docs/harness-capability-matrix.md
```

결정 내용:

- [x] Windows installer exe packaging은 현재 배포 범위에서 제외.
- [x] OS 공통 zip bundle을 기본 배포물로 사용.
- [x] 사용자는 bundle 압축 해제 후 첫 agent 대화에서 `SETUP_WIZARD.md`를 읽힌다.
- [x] `install.sh`는 QnA wizard가 아니라 bootstrap/안내 및 direct wrapper 역할만 담당한다.
- [x] `install.bat`은 필요 시 optional wrapper로만 검토.

SDD mode: lite (배포 전략 문서 정합성 갱신, 이후 4.18에서 shell QnA 제외를 명확화).

---

### 4.18 설정 방식 변경: shell QnA에서 agent setup wizard로 전환

대상 파일:

```text
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
docs/plans/codex/company-wide-agent-rollout/03-installer-mvp.md
docs/plans/codex/company-wide-agent-rollout/03b-project-bundle-install-strategy.md
docs/plans/codex/company-wide-agent-rollout/02c-installer-architecture.md
TODO.md
docs/harness-capability-matrix.md
```

결정 내용:

- [x] shell script가 복잡한 QnA를 담당하지 않는다.
- [x] `SETUP_WIZARD.md`를 첫 agent 대화에서 읽게 하고 agent와 QnA한다.
- [x] agent는 선택/설명/dry-run 명령 생성을 돕고, 실제 설치는 `agent-deploy` CLI가 수행한다.
- [x] `install.sh`는 bundle 검증, wizard 안내, fallback 안내, 고급 사용자용 direct wrapper만 담당한다.

SDD mode: lite (배포/설정 flow 문서 정합성 갱신).

---

### 4.19 SETUP_WIZARD.md 추가 및 install.sh bootstrap 정리

대상 파일:

```text
agent-deploy/SETUP_WIZARD.md
agent-deploy/README.md
agent-deploy/install.sh
agent-deploy/package.json
TODO.md
docs/references_analysis.html
```

구현 내용:

- [x] 첫 agent 대화에서 읽힐 `SETUP_WIZARD.md`를 추가.
- [x] wizard가 project path/profile/target/scope를 확인하고 `dry-run` → `apply` 명령을 생성하도록 절차화.
- [x] `install.sh` 무인자 실행은 bundle 검증과 wizard 안내를 출력하는 bootstrap으로 변경.
- [x] `install.sh` 인자 실행은 기존 direct apply wrapper로 유지.
- [x] package files에 `SETUP_WIZARD.md`를 포함.
- [x] README quick start를 zip bundle + agent setup wizard 중심으로 수정.

검증 결과:

```text
sh agent-deploy/install.sh
sh agent-deploy/install.sh --target codex --profile developer --dry-run
npm --prefix agent-deploy run validate
npm --prefix agent-deploy test
```

SDD mode: lite (기존 installer core 변경 없이 bundle entrypoint와 문서 정합성 보강).

---

### 4.20 Asset Pack Phase 3 시작: pack digest provenance

대상 파일:

```text
agent-deploy/src/packs/digest.js
agent-deploy/src/packs/pack-validator.js
agent-deploy/src/packs/pack-composer.js
agent-deploy/schemas/install-state.schema.json
agent-deploy/test/smoke.test.js
agent-deploy/docs/ASSET_PACKS.md
```

구현 내용:

- [x] pack 파일 목록을 정렬하고 경로 구분자/텍스트 줄바꿈을 정규화해 SHA-256 digest를 계산.
- [x] `.git/`, VCS metadata, `.DS_Store`, `Thumbs.db`, editor temp/backup 파일을 digest 대상에서 제외.
- [x] pack validator 결과에 digest를 포함.
- [x] composed manifest의 `source.packs[]` provenance에 `digest`, `root`, `source`, `packType`을 함께 기록.
- [x] install-state schema의 `source.packs[]` 구조를 확장.
- [x] pack digest 안정성 및 install-state 기록 smoke test 추가.

검증 결과:

```text
npm --prefix agent-deploy run validate
npm --prefix agent-deploy test
  → 36개 smoke test 전체 통과
```

SDD mode: lite (기존 pack planner/apply 구조 안에서 provenance 신뢰성 보강).

---

### 4.21 Asset Pack Phase 3: shared-approved profile extension opt-in

대상 파일:

```text
agent-deploy/src/cli.js
agent-deploy/src/planner.js
agent-deploy/src/packs/pack-composer.js
agent-deploy/test/smoke.test.js
agent-deploy/test/fixtures/packs/shared-approved-extension/
agent-deploy/test/fixtures/packs/project-local-extension/
agent-deploy/docs/ASSET_PACKS.md
docs/specs/external-shared-asset-packs/design.md
docs/specs/external-shared-asset-packs/tasks.md
docs/specs/external-shared-asset-packs/review.md
TODO.md
```

구현 내용:

- [x] CLI `--enable-pack-extensions` 옵션 추가.
- [x] shared-approved pack의 `defaultProfileExtensions`를 opt-in 시에만 builtin base profile에 적용.
- [x] extension 대상 profile은 bundled base profile로 제한.
- [x] `project-local`/`candidate` pack의 `defaultProfileExtensions` 선언을 validator에서 금지.
- [x] opt-in 미사용 시 approved pack extension module이 선택되지 않는 smoke test 추가.
- [x] opt-in 사용 시 developer profile에 approved pack module이 추가되는 planner/CLI dry-run smoke test 추가.

검증 결과:

```text
npm --prefix agent-deploy test
  → 39개 smoke test 전체 통과
```

SDD mode: full (profile resolution, trust policy, CLI 옵션, 테스트/문서에 걸친 governance성 변경).

---

### 4.22 Asset Pack Phase 3: governance 문서 보강

대상 파일:

```text
agent-deploy/docs/ASSET_PACKS.md
docs/specs/external-shared-asset-packs/design.md
docs/specs/external-shared-asset-packs/tasks.md
docs/specs/external-shared-asset-packs/review.md
TODO.md
```

구현 내용:

- [x] shared-approved pack 승인 기준 문서화.
- [x] candidate/externals → shared-approved 승격 흐름 문서화.
- [x] conflict resolution 기록 필드와 decision별 제약 문서화.
- [x] PR/review issue 또는 governance registry에 approval evidence와 pack digest를 기록하는 정책 명시.
- [x] runtime conflict-decision capture는 후속 구현 과제로 분리.

검증 결과:

```text
npm --prefix agent-deploy run validate
git diff --check
```

SDD mode: lite (코드 변경 없이 governance 운영 기준과 인수인계 문서 보강).

---

### 4.23 Asset Pack Phase 2/3: runtime conflict-resolution decision capture

대상 파일:

```text
agent-deploy/src/packs/conflict-resolutions.js
agent-deploy/src/cli.js
agent-deploy/src/planner.js
agent-deploy/src/apply.js
agent-deploy/src/state.js
agent-deploy/schemas/install-state.schema.json
agent-deploy/test/smoke.test.js
agent-deploy/docs/ASSET_PACKS.md
docs/specs/external-shared-asset-packs/design.md
docs/specs/external-shared-asset-packs/tasks.md
docs/specs/external-shared-asset-packs/review.md
TODO.md
```

구현 내용:

- [x] CLI `--conflict-resolution <json-file>` 옵션 추가.
- [x] conflict decision record 최소 validator 추가.
- [x] 허용 decision을 `keep-existing`, `add-namespaced`, `rename-proposed`, `replace-existing`로 제한.
- [x] apply 후 install-state `source.conflictResolutions[]`에 reviewed decision provenance 기록.
- [x] invalid decision 거부 smoke test 추가.
- [x] `add-namespaced` decision의 copy-file destination을 `shared/<pack-id>/...`로 변환.

검증 결과:

```text
npm --prefix agent-deploy test
  → 83개 smoke test 전체 통과
```

SDD mode: full (CLI, validation, install-state schema/provenance, 테스트/문서에 걸친 변경).


---

### 4.24 TODO/Finish 문서 정합성 정리

대상 파일:

```text
TODO.md
Finish.md
```

정리 내용:

- [x] OS 공통 zip bundle, SETUP_WIZARD, Windows fallback, update 실제 적용 등 이미 완료된 항목이 미완료로 남아 있던 부분을 정정.
- [x] repair/uninstall은 dry-run까지만 완료됐고 실제 write/hash drift는 후속임을 명확히 분리.
- [x] 다음 권장 순서를 `TODO/Finish 문서 정합성 정리 → MCP governance 구현` 흐름으로 최신화.
- [x] 인수인계 메모의 다음 최우선 작업을 MCP governance로 정정.

SDD mode: lite (완료/잔여 작업 문서 상태 정합성 갱신).

---

### 4.25 MCP governance 1차 구현

대상 파일:

```text
agent-deploy/assets/mcp/servers.json
agent-deploy/assets/mcp/allowlist.json
agent-deploy/src/mcp-governance.js
agent-deploy/scripts/check-mcp-governance.js
agent-deploy/src/targets/claude.js
agent-deploy/src/targets/codex.js
agent-deploy/src/targets/cursor.js
agent-deploy/manifests/profiles.json
agent-deploy/test/smoke.test.js
docs/specs/mcp-governance/
```

구현 내용:

- [x] MCP allowlist를 `assets/mcp/allowlist.json`으로 추가하고 validate 체인에 `check-mcp-governance.js`를 연결.
- [x] `assets/mcp/servers.json`에서 filesystem MCP를 제거하고 default-excluded 서버로 정책화.
- [x] MCP env/token 값은 `${ENV}` placeholder만 허용하도록 검증.
- [x] npx 기반 stdio MCP는 package version pin을 요구하도록 검증.
- [x] `DISABLED_MCPS=server-a,server-b` 런타임 필터를 추가하고 disabled server는 skip reason으로 install-state에 남김.
- [x] `core` profile에서 MCP를 제외하고 `developer`/`full` 또는 명시 `--module mcp-baseline`에서만 설치하도록 정리.
- [x] Claude/Codex/Cursor adapter가 MCP merge 전 공통 governance layer를 통과하도록 변경. Gemini는 stable project-scope MCP config contract 전까지 skip+reason 유지.

검증 결과:

```text
npm --prefix agent-deploy run validate
  → MCP governance validation OK 포함

npm --prefix agent-deploy test
  → 78개 smoke test 중 77개 통과, 1개 skip(PowerShell 미설치 환경)
```

SDD mode: full (security/profile/adapter/validation/test/spec에 걸친 governance 변경).

---

### 4.26 Windows install.bat 줄바꿈 수정 및 운영자 알파 리허설 완료

반영일: 2026-06-24

대상 파일:

```text
agent-deploy/install.bat
.gitattributes
tests/dist_test_windows.js
tests/dist_test.sh
tests/README.md
docs/pilot-alpha-rehearsal-log.md
```

구현 내용:

- [x] install.bat이 LF 줄바꿈 + goto/label 조합에서 cmd 파서가 깨져 Windows 설치가 실패하던 문제 수정 (CRLF 전환 + `chcp 65001`). LF 상태에서는 `set "DIR=%~dp0"`가 손상돼 cli.js를 cwd 기준으로 잘못 탐색했다.
- [x] `.gitattributes` 추가: `*.bat`/`*.cmd`는 `eol=crlf` 강제, `*.sh`는 `eol=lf` 유지(재발 방지, 체크아웃 시 자동 적용).
- [x] dist 테스트에 installer 진입점 smoke 추가: `dist_test_windows.js`는 공백 경로에서 install.bat을, `dist_test.sh`는 install.sh를 직접 실행해 번들이 해당 경로에 설치되는지 검증(기존에는 cli.js만 직접 호출해 진입점 자체는 미검증).
- [x] 운영자 알파 리허설을 Windows(Command Prompt)에서 `tests\dist_test.bat`로 실행하고 결과를 `docs/pilot-alpha-rehearsal-log.md` 10장에 기록(최종 판정: 통과).
- [x] 배포 번들을 재생성하고 zip 내부 install.bat이 CRLF + chcp 상태인지 확인.

검증 결과:

```text
Windows(cmd):  tests\dist_test.bat  → DIST TEST PASS (install.bat smoke 포함, 공백 경로 설치 정상)
Git Bash:      tests/dist_test.sh   → DIST TEST PASS (install.sh smoke 포함)
Linux:         tests/dist_test.sh   → DIST TEST PASS
번들:          npm run bundle → zip 내부 company-agent-kit/install.bat CRLF=44 + chcp 확인
```

SDD mode: lite (Windows 줄바꿈/인코딩 버그 수정 + 진입점 smoke 보강 + 리허설 기록).

---

## 5. 아직 완료가 아닌 것

다음은 아직 완료되지 않았다. 자세한 순서는 `TODO.md` 참고.

- [x] P0 결정사항 실제 승인.
- [x] Codex adapter 구현.
- [x] Gemini adapter 구현.
- [x] commit convention asset 실제 추가.
- [x] source attribution / knowledge sharing rules 실제 추가.
- [x] profiles/modules 재구성.
- [x] `.agents/rules`와 deploy assets drift check.
- [x] Windows exe packaging 제외 결정.
- [x] OS 공통 zip bundle build 1차 구현.
- [x] update 실제 적용 구현.
- [x] repair/uninstall dry-run 1차 구현.
- [x] repair hash drift/write.
- [x] uninstall 실제 write.
- [x] backup/conflict policy 1차 구현.
- [x] MCP governance 1차 구현.
- [ ] Prompt DB/GitHub governance automation.
- [ ] Pilot 실행.
- [ ] 전사 rollout.

---

## 6. 다음 작업자가 먼저 볼 파일

순서대로 보면 된다.

```text
1. TODO.md
2. docs/references_analysis.html
3. docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
4. docs/plans/codex/company-wide-agent-rollout/README.md
5. docs/plans/codex/company-wide-agent-rollout/03b-project-bundle-install-strategy.md
6. docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
7. docs/plans/codex/company-wide-agent-rollout/02d-project-coding-architecture-rules.md
8. docs/plans/codex/company-wide-agent-rollout/02e-git-commit-convention-plan.md
9. agent-deploy/README.md
10. agent-deploy/src/targets/
```

---

## 7. 인수인계 결론

현재까지 완료된 것은 주로 다음이다.

```text
- ECC/k-sdd 분석
- 통합 방향성 정리
- 단계별 planning 문서화
- 결정 레지스터 작성
- agent-deploy prototype 평가
- Codex adapter 1차 구현
- Gemini adapter 1차 구현
- project scope 기본 전략 확정
- architecture/commit convention 계획 추가
- references_analysis.html 참고자료 분석 리포트 작성
- developer 직무 workflow skill 추가 (company-plan / company-code-review / spec-writing)
- prompt-asset 지식 캡처 skill 추가 (전 직무 공통, Prompt DB 13필드 + 승격 루프)
- 범용 프롬프트 템플릿 + 스타터 라이브러리(dev/doc/comparison/research) 추가, 4개 adapter에 prompts category 설치 경로 추가
- 비개발 직무 skill 추가 (meeting-summary / customer-response / product-spec) + business/product profile 신설
- governance skill 추가 (quarterly-review / kpi-report / prompt-db-curation) + governance profile 신설
- 직무별 스타터 프롬프트 추가 (product: prd/user-story/prioritization, business: faq/proposal/announcement)
- external/shared asset pack Phase 1 validation-only 구현
  - `asset-pack.schema.json`, `check-pack.js`, pack validator, externals scanner, conflict detector 추가
  - 정상 pack / 누락 pack.json / path escape / id collision / externals scan smoke test 추가
- external/shared asset pack Phase 2 planner/apply 1차 통합
  - CLI `--pack` 옵션, composed manifest loader, pack-local profile/module plan/apply 지원
  - pack assetRoot를 bundled assets와 분리하고 install-state `source.packs` provenance 기록
  - pack module dry-run / pack profile apply smoke test 추가
- external/shared asset pack Phase 3 provenance 시작
  - pack digest 계산 및 install-state `source.packs[].digest` 기록
  - `.git/`, OS metadata, editor temp/backup 파일 제외 및 정규화 digest smoke test 추가
- external/shared asset pack Phase 3 profile extension opt-in 구현
  - CLI `--enable-pack-extensions` 옵션 추가
  - shared-approved pack만 builtin profile 확장 허용
  - candidate/project-local pack의 builtin profile 확장 금지 테스트 추가
- external/shared asset pack Phase 3 governance 문서 보강
  - shared-approved 승인 기준, candidate 승격 흐름, conflict resolution 기록 정책 정리
- external/shared asset pack runtime conflict-resolution decision capture 구현
  - `--conflict-resolution` 파일 입력과 validator 추가
  - install-state `source.conflictResolutions[]` provenance 기록
  - `add-namespaced`는 copy-file destination을 `shared/<pack-id>/...`로 변환
- agent-deploy apply `--backup` 1차 구현
  - project scope 백업 위치를 `.agent-deploy/backups/<timestamp>/`로 확정
  - home scope 백업 위치를 target config root의 `backups/<timestamp>/`로 확정
  - 기존 write 대상과 기존 install-state를 write 전 백업
  - install-state `backup` provenance와 runtime schema validation 연동
- agent-deploy apply `--conflict-policy` 1차 구현
  - `managed-overwrite`, `skip`, `append`, `merge-json`, `merge-toml`, `conflict-error` 정책 추가
  - apply 전 기존 destination을 기준으로 effective operation 결정
  - `skip` 정책은 install-state skip operation과 reason으로 기록
  - install-state `conflictPolicy` provenance와 runtime schema validation 연동
- agent-deploy `update --dry-run` 1차 구현
  - 기존 install-state 읽기와 runtime schema validation 재사용
  - 기존 state request를 기반으로 새 plan 생성 및 operation diff 리포트 출력
  - missing/new/unchanged/would-update/removed 상태와 possible user modification 신호 제공
  - 실제 update write는 fail-closed로 차단하고 dry-run만 지원
- agent-deploy `update` 실제 적용 구현
  - dry-run 분석(`analyzeUpdate`)을 apply와 공유하고, 실제 write/backup/install-state 재작성은 `applyPlan`에 위임
  - next plan operation만 갱신해 managed file만 건드림 (user 생성 파일·removed-from-plan 파일 미수정)
  - `--backup`, `--conflict-policy`를 apply와 동일하게 연동
  - 사용자 수정 파일 감지 시 기본 fail-closed, `--on-user-modified fail|skip|overwrite`로 명시 정책 선택
    - `skip`은 사용자 편집을 보존하고 `+update-skip` skip operation으로 install-state에 기록
    - `overwrite`는 canonical 내용으로 복원 (`--backup` 권장)
  - update 후 install-state(installedAt/operations/provenance) 재작성 및 runtime schema validation
- agent-deploy `repair --dry-run` 1차 구현
  - install-state를 source of truth로 사용 (update처럼 새 plan을 다시 만들지 않음)
  - 기록된 managed operation의 dest 존재 여부로 present/missing 분류 (존재 여부 기반)
  - 누락 managed 파일과 요약을 리포트로 출력, skip op·dest 없는 op은 제외
  - 실제 repair write는 fail-closed로 차단하고 dry-run만 지원 (hash 기반 drift, 복원 write는 후속)
- agent-deploy `uninstall --dry-run` 1차 구현
  - install-state operation을 역재생(reverse-replay)해 teardown 대상 분류
  - kind별 안전 경계: copy-file=would-delete(파일 전체 삭제), append-markdown/merge-json/merge-toml=would-revert(블록/키만 제거, 파일 보존)
  - "사용자 생성 파일 삭제 금지"를 shared 파일 revert 처리로 구현, dest 없는 op·skip op 제외
  - install-state provenance 파일을 별도 teardown 대상(stateFile)으로 리포트
  - 실제 삭제/revert write는 fail-closed로 차단하고 dry-run만 지원 (사용자 수정 안전장치·빈 디렉터리 정리는 후속)
- agent-deploy OS 공통 zip bundle build 1차 구현
  - `scripts/build-bundle.js` + `npm run bundle`: 의존성 0 순수 Node ZIP writer(재현 가능 빌드, 고정 timestamp·정렬 entry → 동일 내용 = 동일 체크섬)
  - naming 정책 결정: OS 공통 단일 zip, `company-agent-kit-<version>.zip`(정식) + `company-agent-kit.zip`(동일 바이트 alias), 각 SHA-256 sidecar(`sha256sum -c` 호환)
  - zip 내부 구조 확정: 최상위 `company-agent-kit/` 고정, 실제 런타임 레이아웃(src/cli.js 엔트리), install.sh exec bit 보존
  - 배포본 누락 버그 수정: planner→pack-composer→pack-validator가 import 시 `scripts/check-asset-schema.js`/`check-catalog-parity.js`를 eager-load하므로 package.json `files`에 `scripts/` 추가(없으면 배포본 CLI 기동 실패). schemas/·package.json도 필수 멤버
  - dist/ gitignore, build/checksum 검증 smoke test 추가, README 배포본 빌드 섹션 추가
  - 후속: src/가 scripts/를 참조하지 않도록 분리 리팩토링
- agent-deploy release manifest/checksum 검증 안내 추가
  - `scripts/build-bundle.js`가 `release-manifest.json`과 `release-manifest.json.sha256`을 생성하도록 보강
  - manifest schemaVersion은 `agentdeploy.release-manifest.v1`, package/version, zip 내부 top-level directory, artifact role/sizeBytes/SHA-256/sidecar 경로를 기록
  - zip과 manifest 모두 `sha256sum -c` 호환 sidecar 제공, manifest도 deterministic output으로 유지
  - README에 메인테이너용 빌드 산출물/검증 절차 추가, SETUP_WIZARD에 사용자 다운로드 전 검증 절차(macOS/Linux/Git Bash, PowerShell) 추가
  - D14 artifact signing 결정은 Pilot checksum+manifest 제공, 서명 정책은 전사 rollout 전 검토로 정리
- agent-deploy Windows / setup wizard 보강
  - `agent-deploy doctor` 서브커맨드 추가: Node 버전(>=18)·번들 무결성(src/cli.js·schemas·scripts·manifests·package.json type:module·assets)·설치 대상 폴더 쓰기 권한 진단, 실패 시 exit 1 + 항목별 조치 안내
  - path with spaces 버그 수정: install.sh passthrough가 공백 경로를 분해하던 문제를 POSIX set-- 재구성 + `"$@"` 큰따옴표로 해결(`--project "/a b/c"` 정상), install.bat은 per-arg 재인용
  - install.sh/install.bat: 실패 시 `doctor` 안내, Node 미설치 메시지에 진단 명령 추가
  - SETUP_WIZARD 9.1 Windows 실행 섹션(Node 전제 + install.bat/Git Bash·WSL/node 직접 실행 fallback), 10절 doctor 우선 진단, 7절 복수 target 결정 명시
  - 결정: install.bat 유지(bash 없는 Windows fallback), 복수 target은 target별 명령 유지(--target all 미지원)
  - doctor ok/fail·install.sh 공백 경로 smoke test 추가
- agent-deploy Windows 런처 정책 정리
  - PowerShell 런처는 Windows 리허설에서 실행 정책·콘솔 인코딩 이슈가 반복되어 제거
  - install.bat을 bash 없는 Windows fallback으로 유지하고, 필요 시 `node src\cli.js ...` 직접 실행으로 우회
  - package.json files·build-bundle.js BUNDLE_FILES·bundle membership 테스트를 install.sh/install.bat 기준으로 정리
- agent-deploy 자산 보안 스캔 가드 추가 (보안/공급망 6순위 1차)
  - `scripts/check-unicode-safety.js`: 자산의 invisible/bidi/Tag block(ASCII smuggling)/zero-width filler codepoint 탐지(prompt injection·homograph 차단), 선행 BOM만 허용, ECC check-unicode-safety codepoint 범위 차용
  - `scripts/check-secret-scan.js`: 고신호 credential 패턴(private key block/AWS/GitHub/Google/OpenAI/Anthropic/채팅 플랫폼 토큰) 탐지, `${ENV}` placeholder는 비매칭(허용)·`secret-scan:allow` marker로 문서 예시 opt-out
  - 둘 다 기존 `checkX(root)→{errors,warnings,checked}` + CLI wrapper 패턴, `npm run validate` 체인에 통합(자산 40개 통과)
  - pass-on-shipped + catches-violation 스모크 테스트 각 2건 추가
  - workflow security validation은 보류(번들에 GitHub Actions 없음); MCP governance는 4.25에서 1차 구현 완료
- agent-deploy `repair` 실제 write + hash drift detection 구현
  - install-state operation에 managed content hash(`contentHash`)와 replay payload(`markerId`/`content`/`mergePayload`)를 기록하도록 확장
  - `repair --dry-run`이 present/missing뿐 아니라 hash 기반 `drifted` 상태와 expected/actual hash를 리포트
  - `repair` 실제 실행은 missing managed operation을 복원하고 install-state를 재작성
  - hash drift는 기본 fail-closed, `--on-drift skip|overwrite`로 명시 정책 선택
  - `--backup` 연동: drift overwrite 전 기존 파일과 install-state를 `.agent-deploy/backups/<timestamp>/`에 보존
  - copy-file은 canonical source로 복원, append/merge 계열은 recorded payload를 재적용해 managed content만 복구
  - path-safety/symlink guard와 runtime install-state schema validation 재사용
  - smoke test는 80개로 확장, `npm test`와 `npm run validate` 통과
- agent-deploy `uninstall` 실제 write 구현
  - `uninstall` non-dry-run 경로 추가: install-state 역재생 결과를 실제 삭제/revert로 적용
  - copy-file은 contentHash 일치 시 삭제, append-markdown/merge-json/merge-toml은 shared 파일을 보존하고 managed block/keys만 제거
  - 사용자 수정 감지 기본 fail-closed, `--on-user-modified skip|force` 정책 추가
  - `--backup` 연동: 삭제/revert 대상과 install-state를 timestamp backup에 보존
  - 성공 시 install-state 삭제, 빈 managed 디렉터리 정리
  - dry-run JSON/리포트 경로는 유지하고 write smoke test 추가
  - smoke test는 84개로 확장, `npm test`, `npm run validate`, `git diff --check` 통과
- Pilot runbook에 스킬/프롬프트 공유 전 정제 프로세스 추가
  - 사용자 트리거 문구(`공유용으로 정제해줘`, Prompt DB 후보 등록 등)와 agent 정제 단계 명시
  - prompt/skill/template/doc 분류, 재사용성 확인, 민감정보 제거, 출처/라이선스 보강, 구조화, 검증, 업로드 전 확인 흐름 정리
  - Drive/GitHub 후보 위치와 승격 전 운영자 확인 기준(사용 횟수·사용자 수·성공률·Owner/Reviewer)을 runbook에 반영
```

아직 남은 핵심은 Pilot 운영 준비다.

```text
agent-deploy를 실제 파일럿 가능한 사내 installer MVP로 계속 확장해야 한다.
```
