# agent_guide

사내 Agent Installer / Agent Deploy 표준을 설계하고 검증하는 저장소입니다.

이 저장소의 목표는 회사 구성원이 Claude, Codex, Gemini, Kiro 등 어떤 AI 도구를 사용하더라도 동일한 agent 사용 룰과 개발 기준을 적용할 수 있도록 배포 체계와 운영 문서를 준비하는 것입니다.

## Repository

| 항목 | 값 |
|---|---|
| Remote | `https://github.com/puzzle-drimaes/agent_guide.git` |
| Default branch | `main` |

## 구성

```text
agent-deploy/   사내 AI Markdown asset 배포 엔진 구현체
docs/           분석 리포트, rollout 계획, runbook, 사용자/운영 문서
references/     ECC, k-sdd 참고 소스(기본은 직접 수정 금지)
.agents/        현재 프로젝트에 먼저 적용한 agent 사용 룰
```

## 현재 구현 상태

`agent-deploy/`는 prototype 단계를 넘어, 베타 배포에 필요한 기본 설치/검증/운영 명령을 갖춘 레퍼런스 구현입니다.

```text
지원 target: codex, claude, gemini, cursor, kiro
지원 profile: minimal, core, developer, product, business, governance, sdd, full
기본 scope: project
운영 명령: list, plan, apply, update, repair, uninstall, doctor
배포 산출물: release/company-agent-kit-<version>.zip + .sha256 + release-manifest.json
검증: npm --prefix agent-deploy run validate, npm --prefix agent-deploy test (87 smoke tests)
```

운영자가 Windows/Linux 배포 경로를 확인할 때는 `tests/README.md`의 distribution test를 사용합니다.

## 설치 프로세스

기본 설치는 **project scope**입니다. user/global scope는 고급 사용자 또는 별도 확인이 필요한 경우에만 선택합니다.

```text
1. 배포본 받기
   → release/company-agent-kit-<version>.zip 과 .sha256, release-manifest.json을 받는다.

2. 무결성 확인
   → 가능하면 압축 해제 전 SHA-256 checksum을 확인한다.

3. 압축 해제
   → zip을 풀면 company-agent-kit/ bundle root가 생긴다.
   → 실제 설치 대상은 company-agent-kit/ 자체가 아니라 적용할 project root다.

4. 첫 agent 대화 시작
   → agent-deploy/SETUP_WIZARD.md 또는 bundle 안의 SETUP_WIZARD.md를 agent에게 전달한다.
   → agent가 목적, target, profile, scope, 기존 agent 설정 여부를 확인하게 한다.

5. dry-run 먼저 실행
   → agent가 만든 명령에서 --dry-run으로 생성/수정/skip 파일 목록을 확인한다.
   → 기존 agent 설정이 있으면 --conflict-policy preserve-existing을 기본으로 둔다.

6. 승인 후 apply
   → dry-run 결과가 예상과 맞으면 --backup을 붙여 apply한다.
   → apply 후 install-state와 backup 위치를 확인한다.

7. 진단과 유지보수
   → 문제가 있으면 doctor로 환경/경로를 진단한다.
   → 재적용 전에는 update --dry-run, 누락/드리프트 확인은 repair --dry-run,
     제거 전에는 uninstall --dry-run을 먼저 실행한다.
```

대표 명령:

```bash
cd <repo>/company-agent-kit

node src/cli.js doctor --project ..

node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project .. \
  --conflict-policy preserve-existing \
  --dry-run

node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project .. \
  --conflict-policy preserve-existing \
  --backup
```

관련 문서:

```text
agent-deploy/README.md
agent-deploy/SETUP_WIZARD.md
docs/pilot-runbook.md
tests/README.md
```

## 에이전트 사용법

설치 후 agent 사용은 단순히 AI 도구를 실행하는 것이 아니라, 작업 요청 → 기준 정리 → 실행 → 검증 → 보고로 이어지는 반복 흐름입니다.

```text
1. 작업 요청
   → 사용자가 목표를 말하면 agent가 작업 목적과 영향 범위를 분석한다.
   → agent는 SDD-none / SDD-lite / SDD-full 중 적절한 깊이를 직접 판단한다.

2. 기준 정리
   → 성공 기준, 제약, 변경 범위를 먼저 명시한다.
   → 큰 작업은 docs/specs/<feature-name>/ 아래에 산출물을 남긴다.

3. 구현 또는 문서화
   → canonical rules를 우선 확인한다.
   → target별 차이는 adapter가 흡수하고, 사용자는 같은 의미의 workflow를 따른다.
   → 보안, 출처, 아키텍처, commit 규칙을 유지한다.

4. 검증
   → 테스트, dry-run, diff, install-state, skip reason을 확인한다.
   → 자동화 테스트 또는 CI에서 최종 통과 여부를 확인한다.

5. 보고
   → 변경 요약, 검증 결과, 남은 일을 기록한다.
   → 필요한 경우 review.md, TODO.md, Finish.md에 인수인계 내용을 남긴다.
```

핵심 원칙은 다음과 같습니다.

```text
canonical rule source first
project scope by default
semantic equivalence across harnesses
capability-aware fallback with skip reason
evidence-first verification
```

## 지식 공유 방법

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

공유 Markdown 적용 lifecycle:

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

피드백과 공유 후보는 Google Drive `AI-Knowhow`와 GitHub 후보 branch를 함께 사용합니다.

```text
feedback       → AI-Knowhow/feedbacks/<date>-<role>-<target>-<topic>.md
prompt/template → AI-Knowhow/prompts/<name>.md, prompts branch uploads/prompts/<name>.md
skill          → AI-Knowhow/skills/<skill-name>/SKILL.md, skills branch uploads/skills/<skill-name>/SKILL.md
```

공유 전에는 반드시 민감정보/credential/customer data를 제거하고, 외부 자료 기반이면 출처와 라이선스를 남깁니다.

관련 문서:

```text
agent-deploy/docs/SHARED_FOLDER_GUIDE.md
agent-deploy/docs/ASSET_SCHEMA_AND_CATALOG.md
agent-deploy/docs/ASSET_PACKS.md
docs/specs/external-shared-asset-packs/
```

## 주요 문서

```text
AGENTS.md                                      # 이 저장소의 agent 작업 규칙
TODO.md                                       # 남은 작업과 현재 구현 상태
Finish.md                                     # 완료 이력
agent-deploy/README.md                        # CLI/배포/자산 흐름
agent-deploy/SETUP_WIZARD.md                  # 첫 agent 대화용 설치 wizard
agent-deploy/docs/SHARED_FOLDER_GUIDE.md      # Google Drive AI-Knowhow 운영
docs/pilot-runbook.md                         # 전사 베타 배포 runbook
docs/references_analysis.html                 # ECC/k-sdd 참고자료 분석용
docs/plans/codex/company-wide-agent-rollout/  # rollout 의사결정/계획
tests/README.md                               # OS별 distribution test 안내
```
