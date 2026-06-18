# 전사 공통 Agent Installer Rollout 단계별 문서

## 목적

전사 구성원이 OS와 AI 도구에 상관없이 동일한 agent 설정, 업무 방식, 지식 공유 규칙을 사용하도록 만드는 실행 계획이다.

## 전체 흐름

```text
원칙 합의
  → profile/assets 설계
  → installer MVP
  → 비개발자 UX
  → 공용 계정 운영
  → 지식 공유 KPI
  → workflow 표준화
  → target adapter
  → 교육
  → pilot
  → 전사 rollout
  → 운영 자동화
  → 분기 governance
```

## 문서 목록

| 순서 | 문서 | 주요 산출물 |
|---|---|---|
| 00-D | `00-open-decisions.md` | 결정 레지스터, 권장 기본값, 결정 시점 |
| 01 | `01-principles-and-scope.md` | 공통 원칙, 보안 기준, 출처 표기 기준 |
| 02 | `02-profiles-and-assets.md` | profile 정의, assets 구조, manifest 초안 |
| 02-B | `02b-harness-engineering-principles.md` | 하네스 엔지니어링 원칙, capability matrix, adapter contract |
| 02-C | `02c-installer-architecture.md` | Clean/Hexagonal Architecture 기반 installer 내부 구조 |
| 02-D | `02d-project-coding-architecture-rules.md` | 개발 프로젝트용 코딩 아키텍처 룰 |
| 02-E | `02e-git-commit-convention-plan.md` | Git commit message convention과 Jira 연동 계획 |
| 03 | `03-installer-mvp.md` | CLI MVP, dry-run, install-state, OS 호환 |
| 03-B | `03b-project-bundle-install-strategy.md` | 프로젝트별 bundle 설치와 선택적 전역 설정 전략 |
| 04 | `04-nondeveloper-onboarding.md` | 비개발자 설치 flow, doctor/explain/examples |
| 05 | `05-shared-ai-accounts.md` | 9개 공용 AI 계정 운영 정책 |
| 06 | `06-knowledge-kpi-system.md` | PR 노하우, 주간 회고, Prompt DB, KPI |
| 07 | `07-workflow-standardization.md` | Plan First, Evidence First, Review Before Done |
| 08 | `08-target-adapters.md` | Codex/Claude/Gemini adapter 설계 |
| 09 | `09-training-and-onboarding.md` | 전 직원/직무별/계정 담당자 교육 |
| 10 | `10-pilot.md` | 2주 파일럿 계획 |
| 11 | `11-company-rollout.md` | 전사 배포 절차 |
| 12 | `12-automation.md` | Slack/PR/Notion 자동화 |
| 13 | `13-governance-and-roadmap.md` | 분기 리뷰, RACI, KPI, 30/60/90일 |
| 14 | `14-claude-plan-review-and-gaps.md` | Claude 문서 비교 평가와 Codex 보강 백로그 |

## 단계별 의존성

```text
00-D와 01은 모든 단계의 전제다.
02, 02-B, 02-C, 02-D, 02-E는 03, 03-B, 04, 07, 08의 입력이다.
03, 03-B, 08은 installer 구현 축이다.
04, 09, 10, 11은 adoption 축이다.
05, 06, 12, 13은 운영/governance 축이다.
14는 Claude 문서에서 보강할 내용을 추려 각 단계 문서에 반영하기 위한 점검표다.
```

## 성공 상태

- 대부분의 구성원이 같은 installer로 환경을 세팅했다.
- Claude/Codex/Gemini를 써도 기본 workflow가 같다.
- 공용 AI 계정은 개인 소유가 아니라 회사 지식 축적 장치로 운영된다.
- 좋은 프롬프트와 실패 사례가 Notion/Slack/PR에 남는다.
- 비개발자도 profile 기반 AI 업무 방식을 자연스럽게 사용한다.
