# 운영자 알파 리허설 로그

작성일: 2026-06-24

문서 목적: 전사 Agent Bundle 베타 공지 전에 운영자가 최소 설치·진단·업데이트·복구·제거 dry-run 경로를 직접 확인한 결과를 기록한다.

## 1. 리허설 범위

기준 문서: [`docs/pilot-runbook.md`](pilot-runbook.md) 4장 "운영자 알파 리허설"

이번 기록은 Linux / Codex / developer profile 경로(3~8장)와 Windows(Command Prompt) 경로(10장)를 모두 확인한 결과다. Windows는 PowerShell wrapper 대신 `tests\dist_test.bat`(Command Prompt) 자동 리허설로 검증했다.

```text
목표 경로:
1. doctor
2. apply --dry-run
3. apply --backup
4. doctor
5. update --dry-run
6. repair --dry-run
7. uninstall --dry-run
```

## 2. 실행 환경

| 항목 | 값 |
|---|---|
| 실행일 | 2026-06-24 |
| OS | Linux |
| Shell | bash |
| Node.js | v22.23.0 |
| agent-deploy 실행 위치 | `agent-deploy/` |
| 테스트 프로젝트 | `/tmp/agent-bundle-alpha-codex-developer-20260624` |
| target | `codex` |
| profile | `developer` |
| scope | `project` |
| 민감정보 포함 여부 | 없음. `/tmp` 임시 프로젝트만 사용 |

## 3. 사전 검증

### 3.1 Manifest / asset validation

실행:

```bash
cd agent-deploy
npm run validate
```

결과: 통과

```text
manifest validation OK
rule drift check OK (8 canonical rules in sync with assets)
entry parity check OK (3 entry files cover 8 canonical rules)
asset schema validation OK (28 assets: agents, commands, skills, rules)
catalog parity check OK (10 catalog assets)
unicode safety scan OK (42 text assets, no invisible/bidi characters)
secret scan OK (42 text assets, no hardcoded credentials)
MCP governance validation OK (1 servers, env filter DISABLED_MCPS)
```

### 3.2 Smoke test

실행:

```bash
cd agent-deploy
npm test
```

결과: 통과

```text
1..84
# tests 84
# suites 0
# pass 83
# fail 0
# cancelled 0
# skipped 1
# todo 0
```

비고:

```text
- sandbox 내부 최초 실행에서는 child_process spawn 제약으로 EPERM 실패가 발생했다.
- 동일 테스트를 sandbox 밖 승인 실행으로 재시도했을 때 전체 통과했다.
- 실패 원인은 제품 기능 실패가 아니라 현재 Codex 실행 sandbox 제약으로 판단한다.
```

## 4. 리허설 실행 결과

### 4.1 doctor: apply 전

실행:

```bash
node src/cli.js doctor --project /tmp/agent-bundle-alpha-codex-developer-20260624
```

결과: 통과

```text
[ok] node: v22.23.0 (>= 18 required)
[ok] bundle: package.json (type: module)
[ok] bundle: src/cli.js
[ok] bundle: manifests/modules.json
[ok] bundle: manifests/profiles.json
[ok] bundle: schemas/install-state.schema.json
[ok] bundle: scripts/check-asset-schema.js
[ok] bundle: scripts/check-catalog-parity.js
[ok] bundle: assets/
[ok] project: /tmp/agent-bundle-alpha-codex-developer-20260624 (writable)

diagnosis: 모든 점검 통과
```

### 4.2 apply --dry-run

실행:

```bash
node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project /tmp/agent-bundle-alpha-codex-developer-20260624 \
  --dry-run
```

결과: 통과

```text
29 operation(s)
(dry-run: nothing written)
```

확인 내용:

```text
- AGENTS.md managed block append 예정
- .agents/rules/common 및 .agents/rules/developer 규칙 설치 예정
- .agents/skills 및 .agents/prompts 설치 예정
- .codex/agents 설치 예정
- .codex/config.toml MCP 설정 merge 예정
- Codex native slash-command 미지원 항목은 skip reason으로 기록됨
```

### 4.3 apply --backup

실행:

```bash
node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project /tmp/agent-bundle-alpha-codex-developer-20260624 \
  --backup
```

결과: 통과

```text
applied 29 operation(s) (scope: project).
state:  .agent-deploy/install-state.json
conflict policy: managed-overwrite (0 decision(s))
backup: .agent-deploy/backups/2026-06-24T01-10-28.374Z (0 file(s))
```

확인 내용:

```text
- project scope 내부에만 파일 생성
- 신규 임시 프로젝트라 backup 대상 파일은 0개
- install-state가 .agent-deploy/install-state.json에 생성됨
```

### 4.4 doctor: apply 후

실행:

```bash
node src/cli.js doctor --project /tmp/agent-bundle-alpha-codex-developer-20260624
```

결과: 통과

```text
diagnosis: 모든 점검 통과
```

### 4.5 update --dry-run

실행:

```bash
node src/cli.js update \
  --target codex \
  --profile developer \
  --scope project \
  --project /tmp/agent-bundle-alpha-codex-developer-20260624 \
  --dry-run
```

결과: 통과

```text
update dry-run: codex (project)
profile: developer
summary:
  unchanged: 28
  skip-record: 1
```

확인 내용:

```text
- install-state를 정상적으로 읽음
- 실제 파일 변경 없이 관리 파일 상태를 비교함
- Codex slash-command skip record가 유지됨
```

### 4.6 repair --dry-run

실행:

```bash
node src/cli.js repair \
  --target codex \
  --profile developer \
  --scope project \
  --project /tmp/agent-bundle-alpha-codex-developer-20260624 \
  --dry-run
```

결과: 통과

```text
repair dry-run: codex (project)
profile: developer
summary:
  present: 28
```

확인 내용:

```text
- 누락된 managed file 없음
- 실제 파일 변경 없이 상태만 출력함
```

### 4.7 uninstall --dry-run

실행:

```bash
node src/cli.js uninstall \
  --target codex \
  --profile developer \
  --scope project \
  --project /tmp/agent-bundle-alpha-codex-developer-20260624 \
  --dry-run
```

결과: 통과

```text
uninstall dry-run: codex (project)
profile: developer
summary:
  would-revert: 2
  would-delete: 26

install-state: would-delete ../.agent-deploy/install-state.json
```

확인 내용:

```text
- AGENTS.md append block과 .codex/config.toml merge는 revert 대상으로 분류됨
- copy-file 기반 managed file은 delete 대상으로 분류됨
- install-state 삭제 예정이 출력됨
- dry-run이므로 실제 삭제는 수행하지 않음
```

## 5. 생성 파일 표본

apply 후 확인된 주요 파일:

```text
/tmp/agent-bundle-alpha-codex-developer-20260624/AGENTS.md
/tmp/agent-bundle-alpha-codex-developer-20260624/.agent-deploy/install-state.json
/tmp/agent-bundle-alpha-codex-developer-20260624/.codex/config.toml
/tmp/agent-bundle-alpha-codex-developer-20260624/.codex/agents/code-reviewer.md
/tmp/agent-bundle-alpha-codex-developer-20260624/.codex/agents/architecture-reviewer.md
/tmp/agent-bundle-alpha-codex-developer-20260624/.agents/skills/agent-bundle-feedback/SKILL.md
/tmp/agent-bundle-alpha-codex-developer-20260624/.agents/prompts/dev-implementation.md
```

## 6. 통과 기준 판정

| 기준 | 결과 | 메모 |
|---|---:|---|
| dry-run이 실제 파일을 쓰지 않는다 | 통과 | apply/update/repair/uninstall dry-run에서 쓰기 없음 |
| apply가 project scope에만 설치한다 | 통과 | `/tmp/agent-bundle-alpha-codex-developer-20260624` 내부에만 생성 |
| doctor가 Node 버전, bundle 구조, project 쓰기 권한을 진단한다 | 통과 | apply 전/후 모두 통과 |
| update --dry-run이 install-state를 읽고 변경 예정 사항을 출력한다 | 통과 | unchanged 28, skip-record 1 |
| repair --dry-run이 managed file 상태를 출력한다 | 통과 | present 28 |
| uninstall --dry-run이 삭제/되돌림 대상을 출력하고 실제 삭제하지 않는다 | 통과 | would-revert 2, would-delete 26 |
| validation/test가 통과한다 | 통과 | validate OK, smoke test 83 pass / 1 skip |

## 7. 발견 사항과 후속 조치

### 7.1 발견 사항

```text
- Linux / Codex / developer / project scope 기준 운영자 알파 리허설은 통과했다.
- sandboxed test runner에서는 child_process spawn 제약으로 npm test가 실패할 수 있다.
- 이 경우 운영자 검증 로그에는 sandbox 제약 여부와 승인 실행 결과를 함께 남긴다.
- Windows(Command Prompt) 리허설은 2026-06-24 `tests\dist_test.bat` 자동 실행으로 통과했다(10장 참조). 초기 install.bat LF 줄바꿈 이슈는 CRLF 전환으로 해결했다.
```

### 7.2 후속 조치

```text
1. (완료) Windows 환경에서 `tests\dist_test.bat`로 doctor~uninstall dry-run 및 install.bat smoke를 실행하고 결과를 10장에 기록했다.
2. 전사 베타 공지 전 배포 bundle 경로와 담당자/문의 경로를 docs/pilot-runbook.md 5장 공지문에 채운다.
3. 실패 사례가 나오면 Google Drive AI-Knowhow/feedback/ 형식의 .md로 별도 남긴다.
```

## 8. 최종 판정

```text
판정: 통과

Linux / Codex / developer / project scope 리허설과 Windows(Command Prompt) 리허설이 모두 통과했다.
Windows는 `tests\dist_test.bat` 자동 리허설(10장)로 doctor~uninstall dry-run 및 install.bat smoke를 확인했다.
전사 베타 공지 전 docs/pilot-runbook.md 5장 공지문(배포 경로/담당자)만 채우면 된다.
```

## 9. Windows 테스트 방법

권장(자동): Command Prompt에서 `tests\dist_test.bat`를 실행하면 doctor~uninstall dry-run과 install.bat smoke까지 한 번에 검증되고 `tests\results\dist-test-windows-*.log`가 남는다. 10장 결과는 이 경로로 기록되었다.

아래 9.1~9.8은 개별 CLI를 수동으로 확인할 때 쓰는 fallback 절차다. PowerShell test wrapper는 execution-policy/console-encoding 이슈로 제거되었으므로 명령은 Command Prompt에서 실행하는 것을 권장한다.

### 9.1 준비물

```text
- Windows 10/11 또는 회사 표준 Windows 개발 환경
- PowerShell 5 이상 또는 PowerShell 7
- Node.js 18 이상
- 최신 agent-deploy bundle 또는 repo checkout
- 실제 업무 파일이 없는 임시 테스트 프로젝트 경로
```

사전 확인:

```powershell
node --version
npm --version
Get-ExecutionPolicy
```

확인 기준:

```text
- node --version이 v18 이상이어야 한다.
- Windows 리허설은 install.bat 또는 node src\cli.js 직접 실행으로 진행할 수 있다.
- 테스트 프로젝트는 반드시 $env:TEMP 아래 새 폴더를 사용한다.
```

### 9.2 경로 변수 설정

PowerShell을 열고 아래 값을 환경에 맞게 수정한다.

```powershell
$ErrorActionPreference = "Stop"
$DEPLOY = "C:\path\to\agent-deploy"
$PROJECT = Join-Path $env:TEMP "agent-bundle-alpha-codex-developer"

New-Item -ItemType Directory -Force $PROJECT | Out-Null
Set-Location $DEPLOY
```

예시:

```powershell
$DEPLOY = "C:\Users\<user>\Downloads\agent-deploy"
$PROJECT = Join-Path $env:TEMP "agent-bundle-alpha-codex-developer"
```

### 9.3 선택: 로그 저장 시작

명령 출력 전문을 남기려면 transcript를 켠다.

```powershell
$LOG = Join-Path $env:TEMP "agent-bundle-alpha-rehearsal.log"
Start-Transcript -Path $LOG -Force
```

리허설 종료 후에는 아래 명령으로 종료한다.

```powershell
Stop-Transcript
```

### 9.4 사전 검증

repo checkout에는 test 파일이 있으므로 전체 검증을 실행한다.

```powershell
npm run validate
npm test
```

bundle에 test 파일이 포함되지 않은 경우에는 `npm test`가 실패할 수 있다. 이때는 아래처럼 기록한다.

```text
- npm run validate: 통과 / 실패
- npm test: bundle에 test 파일이 없어 생략 또는 실패
- 생략/실패 사유: 배포 bundle에는 test 디렉터리가 포함되지 않음
```

### 9.5 Windows 리허설 명령

아래 명령을 순서대로 실행한다.

```powershell
node src\cli.js doctor --project $PROJECT

node src\cli.js apply `
  --target codex `
  --profile developer `
  --scope project `
  --project $PROJECT `
  --dry-run

node src\cli.js apply `
  --target codex `
  --profile developer `
  --scope project `
  --project $PROJECT `
  --backup

node src\cli.js doctor --project $PROJECT

node src\cli.js update `
  --target codex `
  --profile developer `
  --scope project `
  --project $PROJECT `
  --dry-run

node src\cli.js repair `
  --target codex `
  --profile developer `
  --scope project `
  --project $PROJECT `
  --dry-run

node src\cli.js uninstall `
  --target codex `
  --profile developer `
  --scope project `
  --project $PROJECT `
  --dry-run
```

### 9.6 설치 결과 확인

`apply --backup` 후 아래 파일이 생겼는지 확인한다.

```powershell
Test-Path (Join-Path $PROJECT "AGENTS.md")
Test-Path (Join-Path $PROJECT ".agent-deploy\install-state.json")
Test-Path (Join-Path $PROJECT ".codex\config.toml")
Test-Path (Join-Path $PROJECT ".agents\skills\agent-bundle-feedback\SKILL.md")
```

필요하면 생성 파일 목록을 확인한다.

```powershell
Get-ChildItem -Path $PROJECT -Recurse -File |
  Select-Object -ExpandProperty FullName
```

### 9.7 통과 기준

```text
- doctor가 Node 버전, bundle 구조, project 쓰기 권한을 모두 ok로 표시한다.
- apply --dry-run은 operation 목록을 출력하고 실제 파일을 만들지 않는다.
- apply --backup은 project scope 아래에만 파일을 만든다.
- update --dry-run은 install-state를 읽고 변경 예정 사항을 출력한다.
- repair --dry-run은 managed file 상태를 출력한다.
- uninstall --dry-run은 would-revert / would-delete 대상을 출력하고 실제 삭제하지 않는다.
- 오류가 있으면 명령, PowerShell 버전, Node 버전, 출력 전문, workaround를 함께 기록한다.
```

### 9.8 실패 시 기록할 정보

실패가 발생하면 아래 정보를 그대로 남긴다.

```powershell
$PSVersionTable
node --version
npm --version
Get-Location
Write-Output $PROJECT
```

추가로 다음을 기록한다.

```text
- 실패한 명령:
- 오류 메시지:
- 재현 가능 여부:
- workaround:
- 민감정보 제거 여부: 예
```

## 10. Windows 리허설 결과

실행 방식: Command Prompt에서 `tests\dist_test.bat` 자동 리허설.

| 항목 | 값 |
|---|---|
| 실행일 | 2026-06-24 |
| OS / Shell | Windows / Command Prompt (cmd.exe) |
| Node.js | v26.3.1 |
| npm | 11.16.0 (`C:\Program Files\nodejs\npm.cmd`) |
| repo | `C:\works\repo\agent_guide` |
| agent-deploy | `C:\works\repo\agent_guide\agent-deploy` |
| target / profile / scope | codex / developer / project |
| 테스트 프로젝트 | `%TEMP%\agent-bundle-dist-test-20260624043426` |
| install.bat smoke 프로젝트 | `%TEMP%\agent bundle install-bat 20260624043426` (공백 포함 경로) |
| 로그 | `tests\results\dist-test-windows-20260624043426.log` |

사전 검증:

```text
- npm run validate: 통과
- npm test: 생략 (DIST_TEST_RUN_NPM_TEST=0, 배포 경로 점검만 수행)
```

리허설 결과:

```text
- doctor before apply: 통과 (모든 점검 통과)
- apply --dry-run: 통과 (29 operation(s), 실제 쓰기 없음)
- apply --backup: 통과 (applied 29 operation(s), install-state 생성)
- doctor after apply: 통과
- update --dry-run: 통과 (unchanged 28, skip-record 1)
- repair --dry-run: 통과 (present 28)
- uninstall --dry-run: 통과 (would-revert 2, would-delete 26, 실제 삭제 없음)
- install.bat smoke (공백 경로): 통과 (-> 프로젝트 설치 정상, applied 29 operation(s))
```

최종 판정: 통과 (DIST TEST PASS)

발견 사항:

```text
- 초기에 install.bat이 LF 줄바꿈 + goto/label 조합으로 cmd 파서가 깨져 설치가 실패했다.
  (set "DIR=%~dp0"가 손상되어 cli.js를 cwd 기준으로 잘못 탐색 → Cannot find module)
- install.bat을 CRLF로 전환하고 chcp 65001을 추가해 해결했으며,
  .gitattributes(*.bat eol=crlf)로 재발을 방지했다.
- 공백이 포함된 프로젝트 경로(%TEMP%\agent bundle install-bat ...)에서도 정상 설치됨을 확인했다.
```

후속 조치:

```text
- 배포 번들은 CRLF install.bat을 포함한다 (`npm run bundle` 재생성, zip 내부 CRLF 확인 완료).
- Git Bash 경로는 tests/dist_test.sh의 install.sh smoke로 별도 통과 확인했다 (dist-test-windows-gitbash-20260624-043406.log).
```
