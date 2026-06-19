# External / Shared Asset Packs — Requirements

## 1. 목적

`agent-deploy`가 기본 bundle의 `assets/`만 설치하는 구조에서 확장되어, 회사 승인 shared pack과
project-local 또는 team-local asset pack을 안전하게 적용할 수 있어야 한다.

이 설계는 아직 구현이 아니라 적용 방식의 기준이다. 이후 구현은 이 요구사항을 기준으로 CLI,
manifest loader, validation, install-state를 확장한다.

## 2. 범위

### In scope

- 외부/shared asset pack의 파일 구조 정의
- pack manifest, asset catalog, module/profile 병합 규칙 정의
- dry-run/apply 흐름에서 pack을 선택하고 검증하는 방식 정의
- 보안/민감정보/출처/license 검증 기준 정의
- install-state provenance에 pack 정보를 남기는 방식 정의
- 기존 bundled asset과 pack asset의 충돌 처리 기준 정의

### Out of scope

- 네트워크 다운로드 구현
- private registry/package manager 구현
- Windows GUI installer
- pack 서명/암호학적 검증 구현
- uninstall/rollback 구현

## 3. 사용자 시나리오

### R1. 회사 승인 shared pack 적용

운영자가 `company-agent-kit` 기본 bundle 외에 승인된 shared pack을 배포하면, 사용자는 dry-run으로
변경 내용을 확인한 뒤 project scope에 적용할 수 있어야 한다.

```text
agent-deploy plan  --target codex --profile developer --pack ./packs/frontend
agent-deploy apply --target codex --profile developer --pack ./packs/frontend --dry-run
```

### R2. project-local pack 적용

팀은 repository 내부의 project-local pack을 사용해 팀 전용 prompt, template, doc을 설치할 수
있어야 한다. 기본값은 project scope이고, user/global scope에는 명시적 opt-in이 필요하다.

### R3. candidate shared document pack 검토

숙련자가 작성한 공유 문서는 바로 기본 profile에 들어가지 않고 `candidate` 또는 `reviewing` 상태의
pack으로 검증된다. 검증 후 shared pack 또는 bundled asset으로 승격할 수 있어야 한다.

### R4. 충돌을 안전하게 차단

서로 다른 pack 또는 bundled asset이 같은 module id, asset id, target destination을 덮어쓰려 하면
기본 동작은 실패해야 한다. override는 v1에서 제공하지 않는다.

### R5. Markdown 파일 drop-in 제안

외부에서 가져와 현재 프로젝트에 적용하려는 모든 Markdown은 특정 `externals` 폴더에서 관리되어야 한다.
다른 구성원이 공유하고 싶은 skill 또는 문서도 먼저 이 폴더에 넣고, agent는 이를 candidate asset pack으로
해석해 검증/요약/적용 후보를 만든다. externals 파일은 기존 문서, canonical rule, entry file을 직접 덮어쓰면 안 된다.

권장 위치:

```text
<repo>/.agent-packs/externals/
```

### R6. 충돌 시 사용자 결정

drop-in 제안 파일이 기존 문서/룰/asset id/module/profile/install destination과 충돌하면 agent는
자동으로 덮어쓰지 않는다. agent는 충돌 내용과 선택지를 설명하고, 사용자의 답변에 따라
`keep-existing`, `add-namespaced`, `rename-proposed`, `replace-existing` 중 하나를 적용해야 한다.
canonical rule 대체는 별도 승인 workflow 없이는 금지한다.

## 4. 기능 요구사항

| ID | 요구사항 |
|---|---|
| FR-1 | pack은 자체 `pack.json`, `assets/`, `manifests/`, 선택적 `schemas/`를 가져야 한다. |
| FR-2 | pack은 하나 이상의 module을 제공해야 하며, module path는 pack 내부 `assets/` 아래만 가리켜야 한다. |
| FR-3 | pack은 자체 profile을 제공할 수 있으나 bundled profile을 직접 수정할 수 없다. |
| FR-4 | 승인된 shared pack만 builtin profile extension을 선언할 수 있다. |
| FR-5 | 모든 pack asset은 기존 frontmatter schema와 catalog parity 검증을 통과해야 한다. |
| FR-6 | `confidential` 공유 문서는 기본 profile/profile extension에 자동 포함되면 안 된다. |
| FR-7 | plan/apply 결과와 install-state에는 사용한 pack id, version, source, digest가 남아야 한다. |
| FR-8 | pack 검증은 apply 전에 실행되고, 오류가 있으면 파일 쓰기를 시작하지 않아야 한다. |
| FR-9 | symlink, absolute path, `..` escape, 숨김 실행 파일, hook/script 자동 실행은 v1에서 금지한다. |
| FR-10 | dry-run은 bundled asset과 pack asset을 합친 최종 module/profile 선택 결과를 보여줘야 한다. |
| FR-11 | `<repo>/.agent-packs/externals/`의 Markdown 파일을 candidate pack으로 해석할 수 있어야 한다. |
| FR-12 | 충돌 해결 결과는 install-state 또는 pack provenance에 기록되어야 한다. |

## 5. 비기능 요구사항

| ID | 요구사항 |
|---|---|
| NFR-1 | zero-dependency validation 우선. 외부 validator 도입 전에도 최소 검증 가능해야 한다. |
| NFR-2 | pack을 읽는 단계는 read-only여야 한다. pack 원본을 수정하지 않는다. |
| NFR-3 | 설치는 기존 path-safety, symlink guard, install-state 원칙을 우회하지 않는다. |
| NFR-4 | 오류 메시지는 pack id, module id, asset path를 포함해야 한다. |
| NFR-5 | multi-pack 순서가 결과에 영향을 줄 때는 명시적으로 fail-fast한다. |

## 6. 성공 기준

- pack 구조와 merge policy가 문서화되어 다음 구현자가 CLI/manifest loader 작업을 시작할 수 있다.
- shared pack과 project-local pack의 차이가 명확하다.
- 보안상 위험한 자동 실행/경로 탈출/민감 공유 문서 자동 배포가 설계에서 차단된다.
- 기존 bundled install flow는 pack을 사용하지 않을 때 그대로 유지된다.
