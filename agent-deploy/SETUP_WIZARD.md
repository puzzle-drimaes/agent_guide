# Agent Deploy Setup Wizard

이 문서는 zip bundle을 복사/압축 해제한 뒤 **첫 agent 대화에서 읽히는 설정 wizard**입니다.
shell script가 복잡한 QnA를 담당하지 않고, agent가 사용자와 선택지를 확인한 뒤
결정론적인 `agent-deploy` CLI 명령(`dry-run` → `apply`)을 생성합니다.

## 1. Agent 역할

Agent는 아래 원칙을 지킵니다.

- 먼저 `dry-run` 명령을 만들고, 사용자가 결과를 확인한 뒤에만 `apply` 명령을 제안합니다.
- 민감정보, token, private key, 계정 비밀번호를 묻거나 파일에 남기지 않습니다.
- 사용자가 명시하지 않으면 `project` scope를 기본값으로 사용합니다.
- 복수 target 설치가 필요하면 target별 명령을 나눠서 생성합니다.
- 설치 파일을 직접 임의 작성하지 않고, 항상 `agent-deploy` CLI를 사용합니다.

## 2. 사용자에게 확인할 항목

첫 대화에서 아래 순서로 짧게 확인합니다.

```text
1. 설치할 프로젝트 경로는 어디인가?
   - 기본값: 현재 작업 중인 repository root

2. 어떤 profile을 설치할 것인가?
   - minimal: 회사 공통 원칙/보안/출처/지식 공유
   - developer: 개발 규칙, SDD, architecture, commit convention
   - product: product 문서/기획 프롬프트 중심
   - business: proposal/FAQ/announcement 등 business 프롬프트 중심

3. 어떤 target에 설치할 것인가?
   - codex
   - claude
   - gemini
   - cursor는 내부 검토 또는 별도 요청 시만 사용

4. 설치 범위는 무엇인가?
   - project: 기본값, repository 내부에 설정 설치
   - home: 선택 옵션, 사용자 전역 설정 설치

5. dry-run 결과를 확인한 뒤 apply를 진행할 것인가?
```

## 3. 권장 기본값

사용자가 잘 모르면 아래 기본값을 제안합니다.

```text
scope: project
profile: developer
target: codex
first command: apply --dry-run
```

비개발자에게는 다음 profile을 우선 제안합니다.

```text
product role: product
business role: business
```

## 4. 명령 생성 규칙

bundle root가 현재 디렉터리라고 가정하면 다음 형식을 사용합니다.

### 목록 확인

```bash
node src/cli.js list
```

### dry-run

```bash
node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project /path/to/project \
  --dry-run
```

### apply

```bash
node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project /path/to/project
```

### home scope 선택 시

```bash
node src/cli.js apply \
  --target claude \
  --profile developer \
  --scope home \
  --dry-run
```

## 5. 복수 target 설치

현재 wizard는 target별 실행을 기본으로 안내합니다.

```bash
node src/cli.js apply --target codex --profile developer --scope project --project /path/to/project --dry-run
node src/cli.js apply --target claude --profile developer --scope project --project /path/to/project --dry-run
node src/cli.js apply --target gemini --profile developer --scope project --project /path/to/project --dry-run
```

dry-run 결과를 각각 확인한 뒤 같은 순서로 `--dry-run`을 제거한 apply 명령을 제안합니다.

## 6. Agent 응답 형식

Agent는 설치 전 최종 확인을 아래 형식으로 요약합니다.

```text
선택 요약:
- project: /path/to/project
- scope: project
- profile: developer
- targets: codex, claude

먼저 실행할 dry-run:
<명령>

확인 필요:
- dry-run 결과에서 생성/수정 파일 목록이 예상과 맞는지 확인해 주세요.
- 승인하면 apply 명령을 이어서 제안하겠습니다.
```

## 7. install.sh의 역할

`install.sh`는 QnA wizard가 아닙니다. 기본 역할은 다음 안내를 출력하는 bootstrap입니다.

- 현재 bundle 위치 확인
- `SETUP_WIZARD.md` 위치 안내
- Node.js 사용 가능 여부 확인
- 직접 CLI를 실행해야 할 때의 fallback 예시 제공

인자를 넘겨 실행하는 경우에는 고급 사용자용 direct apply wrapper로 사용할 수 있지만,
Pilot 기본 흐름은 `SETUP_WIZARD.md`를 agent 대화에 제공하는 방식입니다.
