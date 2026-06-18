# agent_guide

사내 Agent Installer / Agent Deploy 표준을 설계하고 검증하는 저장소입니다.

이 저장소의 목표는 회사 구성원이 Claude, Codex, Gemini 등 어떤 AI 도구를 사용하더라도 동일한 agent 사용 룰과 개발 기준을 적용할 수 있도록 배포 체계와 운영 문서를 준비하는 것입니다.

## Repository

| 항목 | 값 |
|---|---|
| Remote | `https://github.com/puzzle-drimaes/agent_guide.git` |
| Default branch | `main` |

## 구성

```text
agent-deploy/   사내 agent 설정 installer skeleton
docs/           분석 리포트와 rollout 계획 문서
references/     ECC, k-sdd 참고 소스
.agents/        현재 프로젝트에 먼저 적용한 agent 사용 룰
```

## 에이전트 사용 라이프사이클

이 저장소에서 정의하는 agent 사용은 단순히 AI 도구를 실행하는 것이 아니라, 설치 → 작업 → 검증 → 공유 → 개선으로 이어지는 반복 운영 흐름입니다.

```text
1. 준비
   → 프로젝트에 agent 표준 설정 설치
   → AGENTS.md / CLAUDE.md / GEMINI.md / .agents/ / .codex/ 등 확인

2. 작업 요청
   → agent가 작업 목적과 영향 범위를 분석
   → SDD-none / SDD-lite / SDD-full 중 적절한 깊이를 판단

3. 계획과 기준 정리
   → 성공 기준, 제약, 변경 범위를 명시
   → 큰 작업은 docs/specs/<feature-name>/ 아래에 산출물 작성

4. 구현 또는 문서화
   → canonical rules를 우선 확인
   → target별 차이는 adapter가 흡수
   → 보안, 출처, 아키텍처, commit 규칙을 유지

5. 검증
   → 테스트, dry-run, diff, install-state, skip reason 확인
   → sandbox 제한이 있으면 외부/CI 환경에서 재검증

6. 리뷰와 보고
   → 변경 요약, 검증 결과, 남은 일을 기록
   → 필요한 경우 review.md 또는 Finish.md에 인수인계 내용 반영

7. 지식 공유와 개선
   → 재사용 가능한 프롬프트, 실패 사례, 운영 노하우를 TODO/문서/Prompt DB 후보로 남김
   → 다음 profile, rule, skill, adapter 개선에 반영
```

핵심 원칙은 다음과 같습니다.

```text
canonical rule source first
project scope by default
semantic equivalence across harnesses
capability-aware fallback with skip reason
evidence-first verification
```

## 주요 문서

```text
AGENTS.md
TODO.md
Finish.md
docs/report.html
docs/plans/codex/company-wide-agent-rollout/
```
