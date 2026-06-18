# 03. Installer MVP 구현

## 목적

Windows, macOS, Linux에서 회사 표준 agent 설정을 프로젝트에 설치할 수 있는 installer를 만든다.

기본 설치 범위는 **프로젝트별 설정**이다. 사용자 전역 설정은 선택 옵션으로 제공한다.

## MVP 범위

필수 기능:

```text
agent-deploy list
agent-deploy plan
agent-deploy apply
agent-deploy doctor
--target
--profile
--dry-run
--json
--yes
install-state 기록
path-safety
```

초기 target:

```text
1. Codex
2. Claude
3. Gemini
```

## CLI UX

### 목록 조회

```bash
agent-deploy list
```

출력:

```text
targets:
  codex
  claude
  gemini

profiles:
  minimal
  developer
  product
  business
```

### 설치 계획 확인

```bash
agent-deploy plan --target codex --profile developer
```

확인할 내용:

```text
- 설치 target
- 설치 root
- 선택된 modules
- skip된 modules와 이유
- 파일별 operation
- merge-json 대상
- install-state 위치
```

### 실제 설치

```bash
agent-deploy apply --scope project --target codex --profile developer --project .
```

### 비개발자용 무인 설치

```bash
agent-deploy apply --scope project --target claude --profile business --project . --yes
```

### 선택적 전역 설치

```bash
agent-deploy apply --scope user --target codex --profile developer
```

원칙:

```text
project scope:
  기본값. 현재 프로젝트에 회사 표준 agent 설정을 명시적으로 설치한다.

user scope:
  선택 옵션. 여러 프로젝트/IDE/CLI에서 같은 기본 profile을 공유하고 싶은 사용자에게 제공한다.
```

## 구현 체크리스트

### 1. JSON 출력 안정화

`--json`은 항상 valid JSON만 출력한다.

금지:

```text
JSON 뒤에 "(dry-run: nothing written)" 같은 텍스트 붙이기
```

### 2. install-state safety

operation destination뿐 아니라 state file도 path safety를 적용한다.

필수:

```text
assertPathInsideRoot(statePath)
assertNoSymlinkEscape(statePath)
```

### 3. preflight 단계

write 전 확인:

```text
- 모든 source file 존재
- 모든 JSON parse 가능
- 모든 destination root 내부
- symlink escape 없음
- conflict policy 위반 없음
```

### 4. conflict policy

초기 정책:

```text
copy-file:
  default: overwrite
  option: skip

merge-json:
  default: conflict-error
  option: add-only 또는 overwrite
```

### 5. backup

MVP 이후 바로 추가:

```bash
agent-deploy apply --target codex --profile developer --backup
```

backup 위치:

```text
.agent-deploy/backups/<timestamp>/
```

## Windows 대응

원칙:

```text
- shell script 의존 금지
- Node.js path API 사용
- PowerShell 예시 제공
- 경로 구분자를 직접 문자열로 조립하지 않음
- Windows 기본 배포물은 installer exe
- 프로젝트 설치 entrypoint로 batch file 제공
- shell script는 Linux/macOS bundle entrypoint
```

## 배포 패키지

### Windows

```text
기본: installer exe
예: CompanyAgentKitSetup.exe
프로젝트 bundle entrypoint: install.bat
```

요구:

```text
- GUI 또는 콘솔 설치 선택 가능
- 프로젝트별 설정 설치를 기본값으로 제공
- 사용자 전역 설정 설치는 advanced option으로 제공
- 설치 후 doctor 실행 옵션
- 가능하면 code signing 적용
```

### Linux/macOS

```text
기본: zip bundle
예: company-agent-kit-linux-x64.zip
예: company-agent-kit-macos-arm64.zip
```

bundle 구성:

```text
company-agent-kit/
  ├─ bin/agent-deploy
  ├─ assets/
  ├─ manifests/
  ├─ docs/
  ├─ install.sh
  └─ install.bat
```

### 선택적 shell bootstrap

```bash
sh install.sh
```

주의:

```text
sh/bat은 bundle 내부 설치 entrypoint다.
Windows는 exe 배포가 기본이고, Linux/macOS는 zip bundle 배포가 기본이다.
```

## install-state 필드

```json
{
  "schemaVersion": "agentdeploy.install.v1",
  "installedAt": "...",
  "target": {
    "id": "codex-project",
    "target": "codex",
    "scope": "project",
    "root": "...",
    "statePath": "..."
  },
  "request": {
    "profile": "developer",
    "modules": [],
    "seedIds": []
  },
  "resolution": {
    "selectedModules": [],
    "skippedModules": []
  },
  "source": {
    "repoVersion": "0.1.0",
    "repoCommit": "...",
    "manifestVersion": 1
  },
  "operations": []
}
```

## 테스트

필수 테스트:

```text
- plan → apply roundtrip
- dry-run이 파일을 쓰지 않음
- --json 출력이 valid JSON
- unknown target/profile/module 에러
- dependency cycle 검출
- destination collision 검출
- symlink escape 차단
- install-state 기록
- merge-json이 user key를 보존
```

## 완료 기준

- Windows installer exe와 Linux/macOS zip bundle로 설치 가능하다.
- Windows/macOS/Linux에서 같은 프로젝트별 설정 구조가 만들어진다.
- 사용자 전역 설정은 선택 옵션으로 동작한다.
- Codex와 Claude target이 최소 동작한다.
- dry-run 결과와 실제 설치 결과가 일치한다.
- install-state가 남는다.
- CI에서 manifest validation과 smoke test가 통과한다.
