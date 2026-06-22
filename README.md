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

## Agent Deploy / Markdown asset 흐름

`agent-deploy/`는 단순 설정 파일 설치기가 아니라, 회사 표준 rule, skill, prompt/template,
공유 문서(`doc`)를 target agent별 네이티브 구조로 적용하는 Markdown asset 배포 엔진입니다.

외부에서 가져와 현재 프로젝트에 적용하려는 모든 Markdown 파일은 기존 rule/doc에 바로 섞지 않고
아래 격리 폴더에서 관리합니다.

```text
<repo>/.agent-packs/externals/
  skills/
  docs/
  prompts/
```

외부 Markdown 적용 lifecycle:

```text
1. Import
   → 외부에서 받은 *.md를 .agent-packs/externals/ 아래에 둔다.

2. Inspect / classify
   → agent가 prompt/template/skill/doc 중 asset type을 제안한다.

3. Validate
   → 민감정보, 출처/license, frontmatter, catalog/module/profile 정합성을 확인한다.

4. Resolve conflicts
   → 기존 문서/룰과 충돌하면 사용자 선택에 따라 처리한다.
   → keep-existing / add-namespaced / rename-proposed / replace-existing

5. Apply as shared asset
   → 승인된 파일은 target별 shared 영역에 적용한다.
   → .agents/shared/<pack-id>/, .claude/shared/<pack-id>/ 등

6. Promote
   → 반복 사용과 owner/reviewer 승인 후 canonical assets/manifests/catalog로 승격한다.
```

관련 문서:

```text
agent-deploy/README.md
agent-deploy/SETUP_WIZARD.md
agent-deploy/docs/ASSET_SCHEMA_AND_CATALOG.md
agent-deploy/docs/ASSET_PACKS.md
docs/specs/external-shared-asset-packs/
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
   → 자동화 테스트 또는 CI에서 최종 통과 여부 확인

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
docs/references_analysis.html  # ECC/k-sdd 참고자료 분석용
docs/plans/codex/company-wide-agent-rollout/
```
