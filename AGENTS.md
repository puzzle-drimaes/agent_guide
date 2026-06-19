# AGENTS.md — agent_guide 프로젝트 작업 규칙

이 프로젝트는 사내 Agent Installer / Agent Deploy 표준을 먼저 적용해 보는 기준 프로젝트다. Codex와 기타 AI agent는 이 파일을 프로젝트 진입점으로 사용한다.

## 1. 먼저 읽을 파일

작업을 시작하기 전에 목적에 맞게 아래 파일을 확인한다.

```text
TODO.md
Finish.md
docs/references_analysis.html  # 참고자료 분석용
docs/plans/codex/company-wide-agent-rollout/00-open-decisions.md
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
docs/plans/codex/company-wide-agent-rollout/02d-project-coding-architecture-rules.md
docs/plans/codex/company-wide-agent-rollout/02e-git-commit-convention-plan.md
```

## 2. Canonical rule source

현재 프로젝트의 개발 룰 원본은 아래 경로다.

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

Claude/Gemini/Codex 등 도구별 파일은 이 원본 규칙과 의미가 같아야 한다. 특정 도구의 파일만 단독으로 고치지 말고, 먼저 `.agents/rules/`의 원본을 갱신한다.

## 3. 현재 프로젝트 작업 원칙

- 기본 설치/운영 방향은 project scope다.
- user/global scope는 선택 옵션으로만 다룬다.
- `agent-deploy/`는 버리지 않고 installer core로 확장한다.
- `references/ECC/`, `references/k-sdd/`는 분석 참고 소스다. 직접 수정하지 않는 것을 기본으로 한다.
- `docs/references_analysis.html`은 ECC/k-sdd 참고자료 분석용 리포트다.

## 4. SDD 작업 프로세스

모든 작업은 `.agents/rules/developer/spec-driven-development.md`에 따라 agent가 직접 mode를 판단하고 진행한다.

```text
SDD-none: A → C → Z
SDD-lite: A → C → E → F → G → Z
SDD-full: A → B → C → D → E → F → G → H → Z
```

공통 필수 단계:

```text
A. Analyze
C. Criteria
Z. Report
```

작업자에게 불필요한 QnA를 요청하지 않는다. 모호하면 합리적 가정을 명시하고 진행한다. 단, 파괴적 작업, 보안/credential, 비용 발생, 외부 배포, 요구사항 충돌은 확인 질문을 한다.

## 5. 개발 아키텍처 규칙

하네스/agent 설정 변경 시 `.agents/rules/developer/harness-engineering.md`를 따른다.

코드 변경 시 `.agents/rules/developer/architecture.md`를 따른다.

특히 `agent-deploy/` 구현은 아래 방향을 따른다.

```text
CLI / Script
  → UseCase / Planner
  → Domain policy
  → Target Adapter / File Adapter
```

규칙:

- CLI가 직접 복잡한 파일 쓰기 정책을 갖지 않게 한다.
- target별 차이는 adapter가 흡수한다.
- 파일 구조의 동일성이 아니라 의미의 동일성을 목표로 한다.
- dry-run 가능한 설계를 유지한다.
- path-safety, symlink guard, install-state를 우회하지 않는다.
- 큰 구조 변경은 SDD-full로 승격하고 spec 산출물을 남긴다.

## 6. Commit convention

commit message는 `.agents/rules/developer/git-commit-convention.md`를 따른다.

Jira 티켓이 없으면 임의로 만들지 말고 사용자에게 확인한다. 내부 문서/초안 작업처럼 예외가 필요한 경우에는 `jira : N/A (사유: ...)` 형식을 사용한다.

## 7. 보안/출처/지식 공유

- 민감정보, token, private key, 계정 정보를 파일에 남기지 않는다.
- 외부 자료나 참고 문서를 사용하면 출처와 라이선스를 가능한 범위에서 남긴다.
- PR/작업 완료 시 재사용 가능한 노하우는 TODO 또는 별도 지식 DB 후보로 기록한다.
