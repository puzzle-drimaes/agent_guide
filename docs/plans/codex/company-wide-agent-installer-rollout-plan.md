# 전사 공통 Agent Installer 도입 계획

이 문서는 전사 공통 Agent Installer 도입 계획의 인덱스다. 세부 수행 단계는 `company-wide-agent-rollout/` 하위 문서로 분리한다.

## 목표

회사의 모든 구성원이 개발자/비개발자 여부, 운영체제, 사용하는 AI 도구와 관계없이 같은 방향성과 같은 업무 기술을 사용하도록 만든다.

대상 조건:

- 구성원: 약 20명
- AI 계정: 약 9개
- 운영체제: Windows, macOS, Linux
- AI 도구: Claude, Codex, Gemini 중심으로 시작하고 Cursor, OpenCode, Copilot까지 확장 가능

핵심 방향:

1. 개인별 프롬프트 노하우가 흩어지지 않게 한다.
2. 공용 AI 계정을 통해 축적된 지식을 회사 자산으로 만든다.
3. 모든 사람이 동일한 기본 agent 규칙, 업무 방식, 산출물 기준을 따른다.
4. 설치는 쉬워야 하며, 비개발자도 사용할 수 있어야 한다.
5. 운영하면서 룰과 KPI를 계속 수정할 수 있어야 한다.

## 단계별 문서

| 단계 | 문서 | 목적 |
|---|---|---|
| 00 | [README](company-wide-agent-rollout/README.md) | 전체 구조와 진행 순서 |
| 00-D | [결정 필요 사항](company-wide-agent-rollout/00-open-decisions.md) | 착수 전/파일럿 전/전사 배포 전 결정해야 할 항목 |
| 01 | [공통 원칙과 범위](company-wide-agent-rollout/01-principles-and-scope.md) | 전사 AI 사용 원칙, 보안, 출처, 지식 공유 방향 확정 |
| 02 | [프로필과 자산 설계](company-wide-agent-rollout/02-profiles-and-assets.md) | 직무별 profile, rules, skills, agents, prompts 구조화 |
| 02-B | [하네스 엔지니어링 원칙](company-wide-agent-rollout/02b-harness-engineering-principles.md) | 여러 AI 도구에 같은 방법론을 주입하기 위한 adapter/profile/lifecycle 원칙 |
| 02-C | [Installer 내부 아키텍처](company-wide-agent-rollout/02c-installer-architecture.md) | Clean/Hexagonal Architecture 기반의 installer 구조와 UI 분리 원칙 |
| 02-D | [프로젝트 코딩 아키텍처 룰](company-wide-agent-rollout/02d-project-coding-architecture-rules.md) | 개발 프로젝트에서 적용할 Clean Architecture, MVVM, 계층 분리, 의존성 방향 규칙 |
| 02-E | [Git Commit Convention 계획](company-wide-agent-rollout/02e-git-commit-convention-plan.md) | Jira 링크를 포함한 회사 커밋 메시지 규칙과 agent 적용 계획 |
| 03 | [Installer MVP](company-wide-agent-rollout/03-installer-mvp.md) | OS/도구 공통 설치 CLI 구현 |
| 03-B | [프로젝트 번들 설치 전략](company-wide-agent-rollout/03b-project-bundle-install-strategy.md) | 프로젝트별 설정을 기본으로 설치하고 전역 설정은 옵션으로 제공하는 구조 |
| 04 | [비개발자 설치 경험](company-wide-agent-rollout/04-nondeveloper-onboarding.md) | 비개발자도 설치·사용 가능한 UX 설계 |
| 05 | [공용 AI 계정 운영](company-wide-agent-rollout/05-shared-ai-accounts.md) | 20명/9개 계정 공유 정책과 담당 체계 |
| 06 | [지식 공유 KPI 시스템](company-wide-agent-rollout/06-knowledge-kpi-system.md) | 1 PR = 1 노하우, 주간 회고, 데모데이, Prompt DB |
| 07 | [Agent Workflow 표준화](company-wide-agent-rollout/07-workflow-standardization.md) | 도구가 달라도 같은 업무 절차를 따르게 함 |
| 08 | [Target Adapter 구현](company-wide-agent-rollout/08-target-adapters.md) | Codex, Claude, Gemini 등 도구별 설치 어댑터 |
| 09 | [교육과 온보딩](company-wide-agent-rollout/09-training-and-onboarding.md) | 전 직원 교육, 직무별 교육, 계정 담당자 교육 |
| 10 | [Pilot 운영](company-wide-agent-rollout/10-pilot.md) | 2주 파일럿으로 설치·운영 검증 |
| 11 | [전사 Rollout](company-wide-agent-rollout/11-company-rollout.md) | 전 직원 배포, 첫 주 운영, hotfix 체계 |
| 12 | [운영 자동화](company-wide-agent-rollout/12-automation.md) | Slack/PR/Notion/GitHub 자동화 |
| 13 | [거버넌스와 로드맵](company-wide-agent-rollout/13-governance-and-roadmap.md) | 분기 리뷰, RACI, KPI 대시보드, 30/60/90일 계획 |
| 14 | [Claude 계획 비교 평가](company-wide-agent-rollout/14-claude-plan-review-and-gaps.md) | Claude 문서의 강점, Codex 문서 보강 백로그 |

## 바로 다음 액션

1. `01-principles-and-scope.md`를 기준으로 경영/PMO/개발 리드 합의
2. `00-open-decisions.md`의 P0 결정사항을 #ai-governance에서 확정
3. `02-profiles-and-assets.md`와 `02b-harness-engineering-principles.md`를 기준으로 `minimal`, `developer`, `product`, `business` profile 초안 작성
4. `03-installer-mvp.md`와 `08-target-adapters.md`를 기준으로 `agent-deploy`에 Codex target adapter 추가
5. `05-shared-ai-accounts.md`를 기준으로 9개 AI 계정 초기 담당자 지정
6. `10-pilot.md`를 기준으로 2주 pilot 대상 5명 선정
