# Finish — 완료된 작업 정리

작성일: 2026-06-18  
목적: 현재까지 완료한 분석/문서화/초기 구현 상태를 다음 작업자가 빠르게 파악할 수 있게 정리한다.

> 기존 오타 파일명 `Finishde.md`를 `Finish.md`로 정정했다.

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
docs/report.html
```

개별 ECC report는 현재 통합 report로 정리됐다.

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
docs/report.html
```

개별 k-sdd report는 현재 통합 report로 정리됐다.

---

### 1.3 통합 report 작성

생성/검토된 파일:

```text
docs/report.html
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

- [x] 통합 report의 구조는 적절하다고 판단.
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
docs/report.html
```

내용:

- [x] ECC 원본 참고 자료를 `references/ECC/` 아래로 이동.
- [x] k-sdd 원본 참고 자료를 `references/k-sdd/` 아래로 이동.
- [x] 개별 report 파일을 정리하고 `docs/report.html`을 통합 리포트 기준 파일로 사용.

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
- [x] Windows exe / Linux macOS zip bundle 방향.

---

### 2.10 프로젝트 번들 설치 전략

작성 완료:

```text
docs/plans/codex/company-wide-agent-rollout/03b-project-bundle-install-strategy.md
```

포함:

- [x] project scope 기본 결정.
- [x] user scope는 옵션.
- [x] Windows exe + install.bat.
- [x] Linux/macOS zip bundle + install.sh.
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
agent-deploy/assets/rules/common/security.md
agent-deploy/assets/rules/python/coding-style.md
agent-deploy/assets/rules/developer/architecture.md
agent-deploy/assets/agents/code-reviewer.md
agent-deploy/assets/agents/architecture-reviewer.md
agent-deploy/assets/commands/plan.md
agent-deploy/assets/skills/architecture-review/SKILL.md
agent-deploy/assets/mcp/servers.json
```

### 3.3 검증 상태

확인:

```text
manifest validation OK
```

주의:

```text
현재 sandbox 환경에서 node --test는 child process 제한 때문에 일부 실패할 수 있다.
일반 CI 환경에서 반드시 재검증해야 한다.
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
.agents/rules/developer/architecture.md
.agents/rules/developer/git-commit-convention.md
```

적용된 skill:

```text
.agents/skills/architecture-review/SKILL.md
.agents/skills/commit-message-writer/SKILL.md
.agents/skills/harness-parity-review/SKILL.md
```

의미:

- [x] 하네스 엔지니어링 룰을 현재 프로젝트에 먼저 적용.
- [x] 코딩 아키텍처 룰을 현재 프로젝트에 먼저 적용.
- [x] Git commit convention 룰을 현재 프로젝트에 먼저 적용.
- [x] Claude/Codex/Gemini 공통 진입점 문서를 생성.
- [x] canonical source first 원칙에 따라 `.agents/rules/`를 기준 위치로 사용.

남은 일:

- [ ] 동일 내용을 `agent-deploy/assets/`로 승격.
- [ ] modules/profile manifest에 포함.
- [ ] adapter가 각 harness 파일로 변환하도록 구현.

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

정리된 방향:

```text
Windows:
  installer exe
  install.bat

Linux/macOS:
  zip bundle
  install.sh

선택:
  user/global scope
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

---

## 5. 아직 완료가 아닌 것

다음은 아직 완료되지 않았다. 자세한 순서는 `TODO.md` 참고.

- [ ] P0 결정사항 실제 승인.
- [ ] Codex adapter 구현.
- [ ] Gemini adapter 구현.
- [ ] commit convention asset 실제 추가.
- [ ] source attribution / knowledge sharing rules 실제 추가.
- [ ] profiles/modules 재구성.
- [ ] Windows exe packaging.
- [ ] Linux/macOS zip bundle build.
- [ ] update/repair/uninstall.
- [ ] backup/conflict policy.
- [ ] Prompt DB/Slack/GitHub governance automation.
- [ ] Pilot 실행.
- [ ] 전사 rollout.

---

## 6. 다음 작업자가 먼저 볼 파일

순서대로 보면 된다.

```text
1. TODO.md
2. docs/report.html
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
- project scope 기본 전략 확정
- architecture/commit convention 계획 추가
- report.html 통합 리포트 작성
```

아직 남은 핵심은 구현이다.

```text
agent-deploy를 실제 파일럿 가능한 사내 installer MVP로 확장해야 한다.
```
