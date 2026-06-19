# agent-deploy — 사내 AI 코딩 에이전트 설정 배포 엔진 (레퍼런스 골격)

하나의 정규 소스(`assets/`)를 여러 AI 코딩 툴(Codex, Claude Code, Gemini, Cursor, …)의
네이티브 설정으로 **설치 시점에 변환·배포**하는 최소 골격입니다.

ECC( `manifests/` + `install-targets/` 어댑터 + `install-state` provenance +
비파괴 deepMerge )와 k-sdd( `pathSafety` + 선언적 매니페스트 )에서 추출한
핵심 기법만 골라 **의존성 0의 Node ESM**으로 재구성했습니다.

## 빠른 시작

### zip bundle + agent setup wizard (권장 배포 형태)

```bash
./install.sh
```

`install.sh`는 복잡한 QnA를 수행하지 않고 bundle 상태와 다음 단계를 안내합니다.
첫 agent 대화에서 `SETUP_WIZARD.md`를 읽히고, agent가 project path/profile/target/scope를
확인한 뒤 `dry-run` → `apply` 명령을 생성하게 합니다.

권장 기본 흐름:

```text
1. zip bundle 압축 해제
2. ./install.sh 로 bootstrap 안내 확인
3. 첫 agent 대화에 SETUP_WIZARD.md 제공
4. agent가 생성한 dry-run 명령 실행
5. dry-run 결과 확인 후 apply 명령 실행
```

### 직접 CLI

```bash
node src/cli.js list                                   # 타깃/프로파일/모듈 목록
node src/cli.js apply --target codex --profile developer --project /path/to/repo --dry-run
node src/cli.js apply --target codex --profile developer --project /path/to/repo
```

### 고급 사용자용 wrapper

`install.sh`에 인자를 넘기면 기존 direct apply wrapper처럼 사용할 수 있습니다.

```bash
./install.sh --target codex --profile developer --dry-run    # 현재 디렉터리를 project로 preview
./install.sh --target codex --profile developer              # 현재 디렉터리에 apply
./install.sh --target claude --profile developer --global    # home scope apply
```

### 개발/검증

```bash
node src/cli.js plan  --target cursor --profile core --project /path/to/repo
node src/cli.js apply --target claude --profile developer --scope home --home /tmp/fakehome
node scripts/validate-manifests.js                     # CI 불변식 검증
node --test                                            # plan→apply 라운드트립 테스트
```

### 설치 범위(scope)
- **project (기본)**: repo 내 `.claude/`, `.cursor/`, `.mcp.json` — 레포 단위 커밋·공유.
- **home/global (`--global`)**: 사용자 전역 `~/.claude/`, `~/.claude.json` — 어떤 IDE/CLI·프로젝트에서나 공유.
- 안전 경계(path-safety)는 scope의 base root(projectRoot 또는 home)로 적용.

같은 소스에서 타깃별로 다르게 떨어지는 것이 핵심입니다:

| 정규 소스 | Codex | Claude Code | Gemini | Cursor |
|-----------|-------|-------------|--------|--------|
| `assets/rules/**` | `.agents/rules/**` + `AGENTS.md` managed block | `.claude/rules/**` (구조 보존) | `.gemini/rules/**` + `GEMINI.md` managed block | `.cursor/rules/<flat>.mdc` (평탄화+.mdc) |
| `assets/skills/<n>/SKILL.md` | `.agents/skills/<n>/SKILL.md` | `.claude/skills/<n>/SKILL.md` | `.gemini/skills/<n>/SKILL.md` (fallback) | `.cursor/skills/<n>/SKILL.md` |
| `assets/agents/<a>.md` | `.codex/agents/<a>.md` | `.claude/agents/<a>.md` | `.gemini/agents/<a>.md` (fallback) | `.cursor/agents/<a>.md` |
| `assets/commands/plan.md` | **skip+reason** (Codex adapter엔 슬래시 명령 설치 표면 없음) | `.claude/commands/plan.md` | `.gemini/commands/plan.md` | **skip+reason** (Cursor엔 슬래시 명령 없음 — install-state에 기록) |
| `assets/mcp/servers.json` | `.codex/config.toml` 에 add-only TOML merge | `.mcp.json`(project)/`~/.claude.json`(home) 에 deepMerge | **skip+reason** (MCP 정책 미확정) | `.cursor/mcp.json` 에 deepMerge |

> 모듈은 카테고리 전체(`rules`)뿐 아니라 **서브경로(`rules/developer`)·단일 파일(`agents/x.md`)** 도 지정 가능 → 프로파일별 정밀 스코핑(예: architecture 자산은 `developer`에만).

## 현재 core profiles

- `minimal`: company 공통 룰(`company-ai-principles`, `security`, `source-attribution`, `knowledge-sharing`)만 설치.
- `core`: `minimal` + code-review agent + MCP baseline.
- `sdd`: `minimal` + harness engineering / SDD rules + 관련 workflow skills.
- `developer` / `full`: `minimal` + language, architecture, harness engineering, SDD, commit convention rules + review/SDD/harness/commit skills.

## 4-레이어 파이프라인

```
[정규 소스]         [매니페스트]              [타깃 어댑터]            [적용]
assets/rules/       modules.json    ──►      claude.js   ──►         copy-file
assets/agents/      profiles.json            cursor.js               merge-json (deepMerge)
assets/commands/    (profile→modules         (정규→네이티브            + path-safety 검사
assets/mcp/          →deps→target필터)         레이아웃 매핑)            + provenance 기록
```

| 파일 | 역할 | 추출 출처 |
|------|------|-----------|
| `src/targets/helpers.js` | 어댑터 팩토리 + 디렉토리/머지 op 생성 | ECC `install-targets/helpers.js` |
| `src/targets/{claude,cursor}.js` | 툴별 네이티브 레이아웃 매핑 | ECC `cursor-project.js` 등 |
| `src/targets/registry.js` | 어댑터 등록부 | ECC `registry.js` |
| `src/manifest.js` | profile/module 해석 + 의존성 확장 + 순환 검출 | ECC `install-manifests.js` |
| `src/json-merge.js` | 비파괴 deepMerge | ECC `apply.js` |
| `src/path-safety.js` | 경로/심볼릭 링크 escape 차단 | k-sdd `pathSafety.ts` |
| `src/state.js` | provenance(설치 상태) 기록 | ECC `install-state` |
| `src/planner.js` / `src/apply.js` | 계획/적용 분리 | ECC `install-plan`/`install-apply` |
| `scripts/validate-manifests.js` | CI 불변식 검증 | ECC `validate-install-manifests.js` |

## 확장 방법

**새 AI 툴 추가** → `src/targets/<tool>.js` 어댑터 1개 작성 + `registry.js`에 등록.
`planOperations(input, adapter)`에서 정규 소스 경로(`rules`/`agents`/`commands`/`mcp`)를
그 툴의 네이티브 위치로 매핑하면 끝. **다른 파일은 건드릴 필요 없음.**

**새 자산/모듈 추가** → `assets/`에 콘텐츠를 두고 `manifests/modules.json`에
모듈(=경로 묶음 + `targets` + `dependencies`)을 선언, 필요하면 `profiles.json`에 묶기.
**코드 수정 없음** — 데이터만 추가.

## 적용된 재사용 기법 (사내 도입 체크리스트)

- **타깃 어댑터 패턴** — 1정의 → N툴, 신규 툴은 어댑터 1개로 확장.
- **계층형 매니페스트** — components/modules/profiles를 데이터로 큐레이션(팀별 프로파일).
- **의존성 해석 + 순환 검출** — 모듈 의존성을 자동 확장, 사이클 차단.
- **타깃별 모듈 필터** — `targets`에 없는 모듈은 skip하고 provenance에 사유 기록.
- **비파괴 deepMerge** — 개발자 기존 `.mcp.json`/설정 보존하며 사내 표준만 주입.
- **계획/적용 분리 + `--dry-run`** — 변경 검토 후 적용.
- **path-safety + symlink-escape 가드** — 루트 밖/심볼릭 링크 탈출 차단.
- **provenance(install-state)** — repoVersion/commit/manifestVersion + 선택·스킵 모듈 + 모든 파일 연산 기록 → 재설치/롤백/감사 결정론적.
- **CI 불변식 검증** — 경로 실존·타깃 유효·의존성·순환·dest 충돌을 머지 전 차단.

## 프로덕션 전 보강 포인트 (의도적으로 생략한 것)

- 스키마 검증을 런타임에 강제(현재 `schemas/`는 문서용) — AJV 또는 무의존 폴백 검증기.
- `--backup` / uninstall(=provenance 역재생) / 카테고리별 덮어쓰기 정책(k-sdd `policies.ts`).
- 멱등 재설치 시 고아 파일 정리(이전 state와 diff).
- npm 패키징(`bin`은 준비됨) + 태그 기반 멱등 publish + provenance(ECC/k-sdd `publish.yml`).
- 에어갭 환경: 오프라인 미러/사전 번들(설치 시 네트워크 금지).
