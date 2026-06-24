# agent-deploy — 사내 AI Markdown Asset 배포 엔진 (레퍼런스 구현)

하나의 정규 소스(`assets/`)에 있는 회사 AI 업무 자산을 여러 AI 툴(Codex, Claude Code,
Gemini, Cursor, …)의 네이티브 설정으로 **설치 시점에 변환·배포**하는 레퍼런스 구현입니다.

이 bundle의 1차 goal은 단순한 coding agent 설정 배포가 아니라, 역할/OS/기존 agent와
무관하게 다음 Markdown 기반 자산을 각 프로젝트에 안전하게 적용하는 것입니다.

```text
공통 rule + 공유 문서 + skill + prompt/template + 개인/팀 공유 문서
  → target별 adapter
  → AGENTS.md / CLAUDE.md / GEMINI.md / native config
```

최종 기준은 파일 구조의 동일성이 아니라 **semantic equivalence**입니다. 각 target의 파일명,
import 방식, capability는 달라도 같은 canonical asset set을 읽고 같은 의미의 규칙과 workflow를
적용해야 합니다.

ECC( `manifests/` + `install-targets/` 어댑터 + `install-state` provenance +
비파괴 deepMerge )와 k-sdd( `pathSafety` + 선언적 매니페스트 )에서 추출한
핵심 기법만 골라 **의존성 0의 Node ESM**으로 재구성했습니다.

## 빠른 시작

> 👉 **비개발자·처음 사용자라면** 터미널 대신 `INSTALL_GUIDE.html`을 웹 브라우저로 먼저 여세요.
> 그림과 함께 "설치 없이 바로 쓰기"와 "정식 설치" 두 가지 길을 쉬운 말로 안내합니다.
> (텍스트 버전은 `docs/non-developer-guide.md`)

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
node src/cli.js doctor --project /path/to/repo         # Node/번들/대상 경로 진단
node src/cli.js apply --target codex --profile developer --project /path/to/repo --dry-run
node src/cli.js apply --target codex --profile developer --project /path/to/repo --backup
node src/cli.js update --target codex --profile developer --project /path/to/repo --dry-run
node src/cli.js repair --target codex --profile developer --project /path/to/repo --dry-run
node src/cli.js uninstall --target codex --profile developer --project /path/to/repo --dry-run
```

이미 `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.codex/`, `.claude/`, `.gemini/` 등
agent 설정이 있는 프로젝트에 처음 적용할 때는 기존 설정을 우선하는 병합 정책을 권장합니다.

```bash
node src/cli.js apply \
  --target codex \
  --profile developer \
  --project /path/to/repo \
  --conflict-policy preserve-existing \
  --dry-run

node src/cli.js apply \
  --target codex \
  --profile developer \
  --project /path/to/repo \
  --conflict-policy preserve-existing \
  --backup
```

`preserve-existing`은 기존 root instruction에는 관리 블록을 append하고, JSON/TOML 설정은
비파괴 merge하며, 이미 존재하는 복사 대상(rule/skill/prompt 등)은 덮어쓰지 않고 skip으로 기록합니다.

### 고급 사용자용 wrapper

`install.sh`에 인자를 넘기면 기존 direct apply wrapper처럼 사용할 수 있습니다.

```bash
./install.sh --target codex --profile developer --dry-run    # 현재 디렉터리를 project로 preview
./install.sh --target codex --profile developer              # 현재 디렉터리에 apply
./install.sh --target claude --profile developer --global    # home scope apply
```

### Windows

`install.sh`는 Git Bash/WSL용입니다. Windows 기본 환경에서는 cmd(`install.bat`)를 쓰세요.
(전제: Node.js LTS >=18)

```bat
install.bat --target codex --profile developer --dry-run
```

cmd wrapper가 환경 정책 때문에 막히면 launcher 없이 Node CLI를 직접 실행합니다.

```bat
node src\cli.js apply --target codex --profile developer --project "%CD%" --dry-run
```

자세한 안내는 `SETUP_WIZARD.md` 9.1을 참고하세요.

### 개발/검증

```bash
node src/cli.js plan  --target cursor --profile core --project /path/to/repo
node src/cli.js apply --target claude --profile developer --scope home --home /tmp/fakehome
node scripts/validate-manifests.js                     # CI 불변식 검증
node --test                                            # plan→apply 라운드트립 테스트
```

### 배포본 빌드와 release manifest(bundle build, 메인테이너용)

OS 공통 zip + SHA-256 체크섬 + release manifest를 생성합니다(의존성 0 · 재현 가능 빌드).

```bash
npm run bundle                                         # 저장소 루트 release/ 에 zip + .sha256 + manifest 생성
```

산출물(버전 포함 정식본 + 고정 alias, 동일 바이트):

```text
release/company-agent-kit-<version>.zip        release/company-agent-kit-<version>.zip.sha256
release/company-agent-kit.zip                  release/company-agent-kit.zip.sha256
release/release-manifest.json                  release/release-manifest.json.sha256
```

zip 내부 최상위 폴더는 `company-agent-kit/`로 고정이며, 압축 해제 후 그 안에서 `./install.sh`를
실행합니다. `release-manifest.json`은 아래 정보를 담습니다.

```text
- schemaVersion: agentdeploy.release-manifest.v1
- package name/version
- zip 내부 top-level directory
- 각 zip/sidecar의 sizeBytes, sha256, role
- checksum algorithm과 sidecar format
```

배포 채널에 올리기 전/내려받은 뒤 체크섬을 검증하세요.

```bash
cd release
sha256sum -c release-manifest.json.sha256              # manifest 무결성 확인
sha256sum -c company-agent-kit-<version>.zip.sha256    # 버전 zip 무결성 확인
sha256sum -c company-agent-kit.zip.sha256              # alias zip 무결성 확인
```

Windows cmd에서는 다음처럼 SHA-256 값을 출력한 뒤 `.sha256` 파일의 첫 번째 값과 비교합니다.

```bat
certutil -hashfile company-agent-kit-<version>.zip SHA256
type company-agent-kit-<version>.zip.sha256
```

### 설치 범위(scope)
- **project (기본)**: repo 내 `.claude/`, `.cursor/`, 선택 MCP config(`.mcp.json` 등) — 레포 단위 커밋·공유.
- **home/global (`--global`)**: 사용자 전역 `~/.claude/`, `~/.claude.json` — 어떤 IDE/CLI·프로젝트에서나 공유.
- 안전 경계(path-safety)는 scope의 base root(projectRoot 또는 home)로 적용.

같은 소스에서 타깃별로 다르게 떨어지는 것이 핵심입니다:

| 정규 소스 | Codex | Claude Code | Gemini | Cursor |
|-----------|-------|-------------|--------|--------|
| `assets/rules/**` | `.agents/rules/**` + `AGENTS.md` managed block | `.claude/rules/**` (구조 보존) | `.gemini/rules/**` + `GEMINI.md` managed block | `.cursor/rules/<flat>.mdc` (평탄화+.mdc) |
| `assets/skills/<n>/SKILL.md` | `.agents/skills/<n>/SKILL.md` | `.claude/skills/<n>/SKILL.md` | `.gemini/skills/<n>/SKILL.md` (fallback) | `.cursor/skills/<n>/SKILL.md` |
| `assets/agents/<a>.md` | `.codex/agents/<a>.md` | `.claude/agents/<a>.md` | `.gemini/agents/<a>.md` (fallback) | `.cursor/agents/<a>.md` |
| `assets/commands/plan.md` | **skip+reason** (Codex adapter엔 슬래시 명령 설치 표면 없음) | `.claude/commands/plan.md` | `.gemini/commands/plan.md` | **skip+reason** (Cursor엔 슬래시 명령 없음 — install-state에 기록) |
| `assets/mcp/servers.json` | allowlist/`DISABLED_MCPS` 필터 후 `.codex/config.toml` 에 add-only TOML merge | allowlist/`DISABLED_MCPS` 필터 후 `.mcp.json`(project)/`~/.claude.json`(home) 에 deepMerge | **skip+reason** (stable project-scope MCP contract 전까지) | allowlist/`DISABLED_MCPS` 필터 후 `.cursor/mcp.json` 에 deepMerge |

> 모듈은 카테고리 전체(`rules`)뿐 아니라 **서브경로(`rules/developer`)·단일 파일(`agents/x.md`)** 도 지정 가능 → 프로파일별 정밀 스코핑(예: architecture 자산은 `developer`에만).

## 현재 core profiles

- `minimal`: company 공통 룰(`company-ai-principles`, `security`, `source-attribution`, `knowledge-sharing`)만 설치.
- `core`: `minimal` + code-review agent + prompt/shared document capture skills + prompt library. MCP는 기본 제외이며 `developer`/`full` 또는 `--module mcp-baseline`에서만 명시적으로 설치.
- `sdd`: `minimal` + harness engineering / SDD rules + 관련 workflow skills.
- `developer`: `minimal` + language, architecture, harness engineering, SDD, commit convention rules + review/SDD/harness/commit skills + MCP baseline(allowlist/filter 적용).
- `product`: `minimal` + product prompt/template + meeting/spec authoring skills.
- `business`: `minimal` + business prompt/template + meeting/customer-response skills.
- `governance`: `minimal` + KPI/quarterly review/prompt DB curation + shared document promotion skills.
- `full`: 모든 1차 role asset을 포함하는 내부 검토용 profile.

## Markdown asset taxonomy

모든 자산은 `*.md` 중심으로 관리하되, 성격은 구분합니다.

| Type | 의미 | 현재 위치 |
|---|---|---|
| `rule` | 반드시 따라야 하는 회사/프로젝트 규칙 | `assets/rules/` |
| `skill` | agent가 특정 작업을 수행할 때 따르는 절차/전문성 | `assets/skills/*/SKILL.md` |
| `prompt` | 특정 결과물을 만들기 위한 재사용 요청문 | `assets/prompts/` |
| `template` | 초보자가 채워 넣어 좋은 결과를 얻는 문서 골격 | 현재 `assets/prompts/`에 포함, 향후 `assets/templates/` 분리 검토 |
| `doc` | 숙련자/팀의 재사용 가능한 작업 노하우 | 향후 `assets/docs/` 또는 외부 asset pack으로 추가 |
| `agent` | target이 지원할 때 사용하는 전문 subagent 정의 | `assets/agents/` |
| `command` | slash command 또는 instruction-backed command | `assets/commands/` |

초보자는 검증된 `template/prompt/skill`을 선택해 바로 결과를 얻고, 숙련자는 자신의
`doc`를 Markdown asset으로 정리해 공유·검증·승격할 수 있어야 합니다.

schema/catalog 초안:

```text
docs/ASSET_SCHEMA_AND_CATALOG.md
docs/ASSET_PACKS.md
schemas/asset-frontmatter.schema.json
schemas/asset-catalog.schema.json
assets/catalog.draft.json
```


## Markdown asset lifecycle

외부에서 가져온 Markdown과 내부에서 관리하는 canonical asset은 같은 파일처럼 보이더라도 lifecycle이 다릅니다.
기본 원칙은 **외부 제안은 격리하고, 검증 후 공유 영역에 적용하며, 충분히 검증된 것만 canonical asset으로 승격**하는 것입니다.

```text
1. Import
   외부에서 받은 *.md를 <repo>/.agent-packs/externals/ 아래에 둔다.

2. Inspect / classify
   agent가 prompt/template/skill/doc 중 asset type을 제안하고 frontmatter 초안을 만든다.

3. Validate
   민감정보, 출처/license, frontmatter schema, catalog/module/profile 정합성을 확인한다.

4. Resolve conflicts
   기존 문서/룰과 충돌하면 사용자에게 선택지를 제시한다.
   - keep-existing
   - add-namespaced
   - rename-proposed
   - replace-existing (canonical rule은 별도 승인 없이는 금지)

5. Apply as shared asset
   승인된 파일은 target별 shared 영역에 적용한다.
   - .agents/shared/<pack-id>/...
   - .claude/shared/<pack-id>/...
   - .gemini/shared/<pack-id>/...
   - .cursor/shared/<pack-id>/...

6. Promote
   반복 사용, owner/reviewer 승인, 안정성 확인 후 assets/ + manifests/ + catalog에 반영한다.
```

Lifecycle별 책임:

| 단계 | 관리 위치 | 의미 | 기존 rule/doc 영향 |
|---|---|---|---|
| 제안 | `.agent-packs/externals/` | 외부에서 가져온 모든 Markdown 후보 | 없음 |
| 적용 | `<target>/shared/<pack-id>/` | 프로젝트에서 agent가 참고하는 shared asset | 직접 덮어쓰기 없음 |
| 승격 | `agent-deploy/assets/` + `manifests/` + `catalog` | 회사/팀이 승인한 canonical asset | 리뷰 후 반영 |

`externals`는 다운로드 폴더가 아니라 **프로젝트에 적용하려는 외부 Markdown의 검역/검토 구역**입니다.
사용자는 여기에 파일을 넣고, agent는 검증·충돌 해결·dry-run을 거쳐 적용 여부를 결정해야 합니다.

## 4-레이어 파이프라인

```
[정규 소스]         [매니페스트]              [타깃 어댑터]            [적용]
assets/rules/       modules.json    ──►      claude.js   ──►         copy-file
assets/prompts/      profiles.json            codex.js                append-markdown
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

**공유 문서 추가** → 개인/팀 문서를 바로 target 파일에 복사하지 않고, 먼저 asset type,
owner, audience, stability, review status를 정한 뒤 module/profile에 연결합니다. Pilot 단계에서는
`prompts/` 또는 별도 외부 asset pack으로 시작하고, 운영 단계에서 `assets/docs/`와 catalog를
도입합니다.

**외부/shared asset pack 적용** → 기본 bundle은 base layer로 두고, 승인된 shared pack 또는
project-local pack을 read-only overlay로 합성합니다. 충돌은 자동 병합하지 않고 실패시키며,
자세한 설계는 `docs/ASSET_PACKS.md`와 `../docs/specs/external-shared-asset-packs/`를 따릅니다.

## 적용된 재사용 기법 (사내 도입 체크리스트)

- **타깃 어댑터 패턴** — 1정의 → N툴, 신규 툴은 어댑터 1개로 확장.
- **계층형 매니페스트** — components/modules/profiles를 데이터로 큐레이션(팀별 프로파일).
- **의존성 해석 + 순환 검출** — 모듈 의존성을 자동 확장, 사이클 차단.
- **타깃별 모듈 필터** — `targets`에 없는 모듈은 skip하고 provenance에 사유 기록.
- **MCP governance + 비파괴 merge** — allowlist, filesystem 기본 제외, npx version pin, `${ENV}` placeholder, `DISABLED_MCPS` 필터 적용 후 기존 `.mcp.json`/설정 보존.
- **계획/적용 분리 + `--dry-run`** — 변경 검토 후 적용.
- **path-safety + symlink-escape 가드** — 루트 밖/심볼릭 링크 탈출 차단.
- **provenance(install-state)** — repoVersion/commit/manifestVersion + 선택·스킵 모듈 + 모든 파일 연산 기록 → 재설치/롤백/감사 결정론적.
- **CI 불변식 검증** — 경로 실존·타깃 유효·의존성·순환·dest 충돌·MCP governance를 머지 전 차단.

## 프로덕션 전 보강 포인트

- schema/catalog 검증을 더 엄격한 blocking 정책으로 승격 — 현재는 무의존 검증기와 non-blocking warning을 병행.
- `prompts/templates/docs` frontmatter schema와 asset catalog를 blocking validation으로 승격.
- 외부 asset pack 적용(`--pack`)과 검증(`scripts/check-pack.js`)은 기본 구현됨. 개인/팀 공유 문서 승격 workflow의 운영 자동화는 추가 보강 필요.
- update/repair/uninstall의 운영 UX와 정책 옵션 추가 보강(현재 기본 구현은 fail-closed + dry-run 우선).
- 멱등 재설치/업데이트 시 고아 파일 정리(이전 state와 diff).
- npm 패키징(`bin`은 준비됨) + 태그 기반 멱등 publish + provenance(ECC/k-sdd `publish.yml`).
- 에어갭 환경: 오프라인 미러/사전 번들(설치 시 네트워크 금지).
