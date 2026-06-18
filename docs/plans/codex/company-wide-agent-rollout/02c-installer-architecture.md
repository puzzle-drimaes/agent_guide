# 02-C. Installer 내부 아키텍처

## 목적

`agent-deploy` 또는 향후 `company-agent-kit` installer의 내부 아키텍처 패턴을 정한다.

결론:

```text
Installer core는 Clean Architecture + Hexagonal Architecture(Ports and Adapters)로 설계한다.
MVVM은 Windows GUI installer나 웹 설정 생성기 같은 UI shell에만 적용한다.
```

---

## 1. 왜 Clean/Hexagonal Architecture인가

이 프로젝트의 핵심 복잡도는 화면이 아니라 다음에 있다.

```text
- profile/module/manifest 해석
- bundle asset 렌더링
- target adapter 변환
- project/user scope 처리
- dry-run plan 생성
- 안전한 file operation
- install-state/provenance 기록
- update/repair/uninstall lifecycle
- Claude/Codex/Gemini/Cursor 하네스 차이 흡수
```

따라서 UI 패턴인 MVVM을 core 전체에 적용하기보다, core는 Clean/Hexagonal 구조로 두고 UI만 얇게 둔다.

---

## 2. 아키텍처 원칙

## 2.1 Core는 UI를 모른다

core는 다음 실행 표면을 몰라야 한다.

```text
- CLI
- Windows installer exe UI
- install.sh
- install.bat
- web generator
- CI
```

모든 UI는 같은 use case를 호출한다.

```text
planInstall()
applyInstall()
doctorInstall()
updateInstall()
repairInstall()
uninstallInstall()
```

## 2.2 Core는 하네스 구현을 모른다

core는 Claude/Codex/Gemini의 파일 구조를 직접 알지 않는다.

core가 아는 것:

```text
TargetAdapterPort
```

하네스별 구현:

```text
CodexTargetAdapter
ClaudeTargetAdapter
GeminiTargetAdapter
CursorTargetAdapter
```

## 2.3 모든 write는 plan을 통한다

파일을 직접 쓰는 코드는 금지한다.

```text
request
  → resolve profile/modules
  → build plan
  → preflight
  → apply operations
  → write install-state
```

## 2.4 project scope가 기본이다

기본 설치:

```text
project scope
```

선택 설치:

```text
user scope
```

scope는 domain model에 포함해야 한다.

---

## 3. Layer 구조

권장 구조:

```text
src/
  ├─ domain/
  │   ├─ Asset.js
  │   ├─ Module.js
  │   ├─ Profile.js
  │   ├─ InstallRequest.js
  │   ├─ InstallPlan.js
  │   ├─ InstallOperation.js
  │   ├─ InstallState.js
  │   └─ TargetCapability.js
  │
  ├─ usecases/
  │   ├─ listCatalog.js
  │   ├─ buildPlan.js
  │   ├─ applyPlan.js
  │   ├─ doctor.js
  │   ├─ update.js
  │   ├─ repair.js
  │   └─ uninstall.js
  │
  ├─ ports/
  │   ├─ FileSystemPort.js
  │   ├─ TargetAdapterPort.js
  │   ├─ StateStorePort.js
  │   ├─ PackageSourcePort.js
  │   ├─ LoggerPort.js
  │   └─ PromptPort.js
  │
  ├─ adapters/
  │   ├─ filesystem/
  │   ├─ state-store/
  │   ├─ targets/
  │   │   ├─ codex.js
  │   │   ├─ claude.js
  │   │   ├─ gemini.js
  │   │   └─ cursor.js
  │   └─ package-source/
  │
  ├─ interfaces/
  │   ├─ cli/
  │   ├─ windows-installer/
  │   ├─ shell/
  │   ├─ batch/
  │   └─ web-generator/
  │
  └─ main/
      ├─ compositionRoot.js
      └─ registry.js
```

---

## 4. Domain Model

### InstallRequest

```json
{
  "scope": "project",
  "projectRoot": "/path/to/project",
  "target": "codex",
  "profile": "developer",
  "modules": [],
  "dryRun": false,
  "actor": {
    "track": "developer",
    "aiAccountId": "AI-01"
  }
}
```

### InstallPlan

```json
{
  "request": {},
  "selectedModules": [],
  "skippedModules": [],
  "operations": [],
  "warnings": []
}
```

### InstallOperation

```json
{
  "kind": "copy-file",
  "scope": "project",
  "moduleId": "developer-skills",
  "sourceRel": "skills/company-code-review/SKILL.md",
  "dest": ".agents/skills/company-code-review/SKILL.md",
  "strategy": "managed-overwrite",
  "ownership": "managed"
}
```

---

## 5. Use Cases

## 5.1 listCatalog

목적:

```text
사용 가능한 target/profile/module 목록을 보여준다.
```

## 5.2 buildPlan

목적:

```text
설치 요청을 받아 실제 operation 목록을 생성한다.
파일을 쓰지 않는다.
```

흐름:

```text
load manifests
  → validate request
  → resolve profile
  → expand dependencies
  → filter by target capability
  → call target adapter
  → return plan
```

## 5.3 applyPlan

목적:

```text
plan을 안전하게 실행한다.
```

흐름:

```text
preflight
  → backup if needed
  → execute operations
  → write install-state
```

## 5.4 doctor

목적:

```text
설치 상태와 target별 설정 접근성을 확인한다.
```

## 5.5 update/repair/uninstall

목적:

```text
설치 생애주기를 관리한다.
```

---

## 6. Ports

### FileSystemPort

역할:

```text
- read file
- write file
- copy file
- ensure dir
- check symlink
- path safety
- backup
```

### TargetAdapterPort

역할:

```text
- target capability 제공
- target별 operation plan 생성
- fallback/skip reason 제공
```

### StateStorePort

역할:

```text
- install-state read/write
- previous state diff
- drift check
```

### PackageSourcePort

역할:

```text
- bundle asset root 확인
- manifest 로드
- package version/source metadata 제공
```

### LoggerPort

역할:

```text
- CLI 출력
- JSON 출력
- installer UI progress
- log file
```

### PromptPort

역할:

```text
- CLI prompt
- Windows GUI 선택
- non-interactive --yes
```

---

## 7. Adapters

## 7.1 UI adapters

```text
CLI adapter:
  node/bin 실행, 개발자/CI 친화

Windows installer adapter:
  exe, GUI 또는 console wizard

Shell adapter:
  install.sh

Batch adapter:
  install.bat

Web generator adapter:
  비개발자용 bundle/config 생성
```

모든 UI adapter는 core use case만 호출한다.

## 7.2 Target adapters

```text
CodexTargetAdapter
ClaudeTargetAdapter
GeminiTargetAdapter
CursorTargetAdapter
```

역할:

```text
canonical asset
  → target native layout
```

---

## 8. MVVM 적용 위치

MVVM은 다음에만 적용한다.

```text
Windows installer GUI
Web 설정 생성기
```

예:

```text
View:
  profile 선택 화면
  target 선택 화면
  dry-run 결과 화면

ViewModel:
  selectedProfile
  selectedTargets
  selectedProjectPath
  planPreview
  validationErrors

Model:
  core use case 결과
```

금지:

```text
domain/usecase를 ViewModel에 종속시키지 않는다.
```

---

## 9. Dependency Rule

의존성 방향:

```text
interfaces → usecases → domain
adapters   → ports/usecases/domain
domain     → no dependency
```

금지:

```text
domain이 fs, process, path, console, UI, target adapter를 직접 import
```

허용:

```text
usecase가 port interface를 통해 filesystem/state/target adapter 사용
```

---

## 10. Test Strategy

### Domain tests

```text
- profile dependency expansion
- target filtering
- conflict policy
- operation ownership
```

### Use case tests

```text
- buildPlan dry-run
- applyPlan preflight
- update diff
- repair drift
- uninstall managed files only
```

### Adapter tests

```text
- Codex layout
- Claude layout
- Gemini layout
- Cursor layout
- unsupported capability fallback
```

### Integration tests

```text
- project scope install
- user scope install
- install.sh
- install.bat
- Windows exe smoke
- Linux/macOS bundle smoke
```

---

## 11. Architecture Decision

채택:

```text
Core:
  Clean Architecture + Hexagonal Architecture

Target integration:
  Adapter pattern

UI:
  CLI는 thin interface
  Windows/Web UI는 MVVM 가능

Data flow:
  Manifest → Plan → Preflight → Apply → State
```

비채택:

```text
Installer 전체에 MVVM 적용
단일 거대 script
하네스별 중복 코드베이스
UI가 직접 파일 write
```

---

## 완료 기준

```text
- CLI, exe, sh, bat이 같은 core use case를 호출한다.
- target adapter 추가 시 domain/usecase 수정이 거의 없다.
- dry-run과 apply가 같은 plan model을 사용한다.
- file write는 FileSystemPort를 통해서만 수행된다.
- Windows GUI 또는 웹 생성기가 생겨도 core를 재사용한다.
- test에서 domain/usecase를 filesystem 없이 검증할 수 있다.
```
