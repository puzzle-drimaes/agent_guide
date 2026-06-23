# Agent Deploy Setup Wizard

이 문서는 zip bundle을 복사/압축 해제한 뒤 **첫 agent 대화에서 읽히는 설정 wizard**입니다.
shell script가 복잡한 QnA를 담당하지 않고, agent가 사용자와 선택지를 확인한 뒤
결정론적인 `agent-deploy` CLI 명령(`dry-run` → `apply`)을 생성합니다.

## 0. 처음 시작하기 (비개발자 / 터미널이 낯선 사용자)

이 파일은 사람이 명령을 외워서 입력하는 매뉴얼이 아니라, **AI agent에게 건네주는 설정 안내서**입니다.
터미널을 써본 적이 없어도 아래 순서만 따라오면 됩니다.

```text
1. zip bundle을 받은 폴더를 압축 해제한다.
2. 평소 쓰는 AI 도구(Claude/Codex/Gemini 등)의 대화창을 연다.
3. 대화창에 "이 파일을 읽고 내 설치를 도와줘"라고 말한 뒤,
   - 이 SETUP_WIZARD.md 내용을 그대로 붙여넣거나,
   - 파일 첨부가 되는 도구라면 이 파일을 첨부한다.
4. 그 다음부터는 agent가 역할/목적/설치 경로를 물어보고,
   실행할 명령을 대신 만들어 준다.
5. agent가 만든 dry-run 결과를 함께 확인한 뒤 설치(apply)를 진행한다.
```

명령을 어디에 입력해야 할지 모르겠으면, agent에게 "이 명령을 어디에 어떻게 입력하는지 알려줘"라고 그대로 물어봅니다.
설치 중 막히면 맨 아래 "## 10. 설치가 안 될 때"를 agent에게 함께 보여줍니다.

## 0.1 다운로드 체크섬 검증

배포 채널에서 zip과 함께 받은 `.sha256`, `release-manifest.json`, `release-manifest.json.sha256`는
압축을 풀기 전에 무결성을 확인하기 위한 파일입니다. 가능하면 아래 순서로 먼저 검증합니다.

macOS/Linux/Git Bash:

```bash
sha256sum -c release-manifest.json.sha256
sha256sum -c company-agent-kit-<version>.zip.sha256
```

Windows PowerShell:

```powershell
$zip = "company-agent-kit-<version>.zip"
$expected = (Get-Content "$zip.sha256").Split(" ")[0]
$actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected) { throw "checksum mismatch: $zip" }
```

검증이 실패하면 zip을 실행하거나 압축 해제하지 말고, 배포 채널에서 다시 다운로드한 뒤
담당자에게 `release-manifest.json`과 실패 메시지를 함께 공유합니다.

## 1. Bundle goal

이 bundle의 목표는 단순히 특정 agent 설정 파일을 생성하는 것이 아닙니다.

```text
역할, OS, 기존 agent 사용 여부와 무관하게
회사/프로젝트의 공통 rule, 공유 문서, skill, prompt/template을
Markdown 기반 canonical asset으로 배포하고,
각 target agent가 자기 방식으로 같은 의미의 자산을 읽게 만든다.
```

따라서 wizard는 아래 두 사용자를 모두 지원해야 합니다.

- agent 사용이 서툰 사람: 검증된 profile, prompt, template, skill을 선택해 좋은 결과를 얻는다.
- agent 사용이 익숙한 사람: 자신의 공유 문서 `*.md`를 배포 가능한 asset으로 정리하고 공유한다.

## 2. Agent 역할

Agent는 아래 원칙을 지킵니다.

- 먼저 `dry-run` 명령을 만들고, 사용자가 결과를 확인한 뒤에만 `apply` 명령을 제안합니다.
- 민감정보, token, private key, 계정 비밀번호를 묻거나 파일에 남기지 않습니다.
- 사용자가 명시하지 않으면 `project` scope를 기본값으로 사용합니다.
- 복수 target 설치가 필요하면 target별 명령을 나눠서 생성합니다.
- 설치 파일을 직접 임의 작성하지 않고, 항상 `agent-deploy` CLI를 사용합니다.
- 사용 목적이 불명확하면 profile 이름부터 묻지 말고, 사용자의 역할/숙련도/목적을 먼저 확인합니다.
- unsupported capability는 조용히 누락하지 말고 dry-run/install-state의 skip reason으로 확인하게 합니다.

## 3. 사용자에게 확인할 항목

첫 대화에서 아래 순서로 짧게 확인합니다.

```text
1. 무엇을 하려는가?
   - 회사 공통 agent 규칙 적용
   - 개발 프로젝트에 developer workflow 적용
   - product 문서/기획 템플릿 사용
   - business 문서/응대 템플릿 사용
   - 다른 사람이 공유한 skill/prompt 적용
   - 내 공유 문서를 배포 가능한 asset으로 만들기

2. agent 사용 숙련도와 역할은 무엇인가?
   - beginner: 검증된 profile/template 중심으로 추천
   - experienced: module/profile/target을 직접 조합 가능
   - contributor: 자신의 공유 문서 *.md를 공유/승격하려는 사용자
   - role 예시: developer, product, business, governance

3. 설치할 프로젝트 경로는 어디인가?
   - 기본값: 현재 작업 중인 repository root

4. 어떤 profile을 설치할 것인가?
   - minimal: 회사 공통 원칙/보안/출처/지식 공유
   - developer: 개발 규칙, SDD, architecture, commit convention
   - product: product 문서/기획 프롬프트 중심
   - business: proposal/FAQ/announcement 등 business 프롬프트 중심
   - governance: KPI/회고/GitHub 후보 branch 운영 중심
   - sdd/full: 내부 검토 또는 명시 요청 시 사용

5. 어떤 target에 설치할 것인가?
   - codex
   - claude
   - gemini
   - cursor는 내부 검토 또는 별도 요청 시만 사용

6. 설치 범위는 무엇인가?
   - project: 기본값, repository 내부에 설정 설치
   - home: 선택 옵션, 사용자 전역 설정 설치

7. dry-run 결과를 확인한 뒤 apply를 진행할 것인가?
```


## 4. Role guide for beginners

초보자에게는 profile 이름을 먼저 고르게 하지 말고, 아래 decision guide로 추천합니다.

| 사용자가 하고 싶은 일 | 추천 profile | 추천 target | 첫 요청 예시 |
|---|---|---|---|
| 회사 공통 AI 사용 규칙만 적용 | `minimal` | 현재 쓰는 agent | "이 프로젝트에서 지켜야 할 AI 사용 규칙을 요약해줘." |
| 개발 프로젝트에서 구현/리뷰/커밋 도움 받기 | `developer` | `codex` 우선 | "이 이슈를 SDD-lite로 진행하고 테스트 계획까지 세워줘." |
| 제품 기획/요구사항/PRD 작성 | `product` | `codex` 또는 `claude` | "이 아이디어를 PRD 초안으로 정리해줘." |
| 고객 응대/공지/제안서 작성 | `business` | `claude` 또는 `gemini` | "이 고객 문의에 대한 답변 초안을 작성해줘." |
| 후보 branch, KPI, 분기 회고 운영 | `governance` | `claude` 우선 | "이번 달 prompts/skills branch 정리 후보를 뽑아줘." |
| 여러 역할을 모두 검토 | `full` | 내부 검토 시만 | "설치될 asset 목록과 중복 위험을 검토해줘." |

초보자 기본값은 다음처럼 추천합니다.

```text
개발자:   project scope + developer profile + codex target + dry-run first
기획자:   project scope + product profile + codex/claude target + dry-run first
비즈니스: project scope + business profile + claude/gemini target + dry-run first
운영자:   project scope + governance profile + claude target + dry-run first
```

초보자가 "다른 사람이 준 md 파일을 적용하고 싶다"고 말하면, 바로 기존 rule/doc에 복사하지 말고
아래 폴더에 넣도록 안내합니다. Google Drive 업로드와 GitHub 후보 branch 등록 flow는
`docs/SHARED_FOLDER_GUIDE.md`의 "검토 / 선택 적용 흐름"과 `docs/GITHUB_BRANCH_POLICY.md`의
"후보 branch 최소 등록 경로"를 기준으로 합니다.

```text
<repo>/.agent-packs/externals/
  skills/
  docs/
  prompts/
```

그 다음 agent는 다음 순서로 안내합니다.

```text
1. externals에 넣은 파일 목록을 확인한다.
2. 민감정보/credential/customer data 포함 여부를 확인한다.
3. prompt/template/skill/doc 중 어떤 asset type인지 제안한다.
4. 기존 문서/룰과 충돌하면 keep-existing/add-namespaced/rename-proposed/replace-existing 선택지를 설명한다.
5. 기본 추천은 add-namespaced이며, canonical rule 교체는 별도 승인 없이는 금지한다.
```

## 5. 권장 기본값

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
governance/operator role: governance
```

초보자에게는 profile 선택과 함께 설치 후 첫 요청 예시를 안내합니다.

```text
developer:
- 이 변경의 테스트 계획을 세워줘.
- 이 diff에서 실제 버그 가능성이 높은 부분만 리뷰해줘.

product:
- 이 아이디어를 PRD 초안으로 정리해줘.
- 고객 요청을 user story와 acceptance criteria로 나눠줘.

business:
- 고객 문의에 대한 답변 초안을 정중하게 작성해줘.
- 이 제안서의 핵심 메시지를 3개로 줄여줘.
```

숙련자가 공유 문서 공유를 원하면 이번 bundle에서는 바로 설치 명령을 만들기보다,
먼저 해당 `*.md`를 asset 후보로 정리하도록 안내합니다. 후보는 Google Drive `AI-Knowhow`에
업로드하고, GitHub에는 아래 최소 경로로 남깁니다.

```text
prompt/template → prompts branch: uploads/prompts/<name>.md
skill/workflow  → skills branch:  uploads/skills/<skill-name>/SKILL.md
```

자세한 등록 예시는 `docs/SHARED_FOLDER_GUIDE.md`, `docs/GITHUB_BRANCH_POLICY.md`를 참고합니다.
공식 반영 검토는 agent가 PR/MR을 만들지 않고, 운영자가 후보 branch commit과 Drive 운영 메모를 기준으로 수동 판단합니다.

```text
shared document asset 후보에 필요한 정보:
- asset type: prompt, template, skill, doc 중 하나
- audience: developer/product/business/governance 등
- owner/reviewer
- 사용 예시
- 민감정보 포함 여부
- stable/beta/draft 상태
```

## 6. 명령 생성 규칙

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

## 7. 복수 target 설치

복수 target은 **target별 명령을 따로 생성**하는 방식으로 지원합니다(결정). `--target all`이나
콤마 다중 target은 지원하지 않습니다 — target마다 install-state가 독립적으로 기록되어 각 설치의
atomicity가 명확하고, 한 target 실패가 다른 target에 영향을 주지 않기 때문입니다.

wizard는 target별 실행을 기본으로 안내합니다.

```bash
node src/cli.js apply --target codex --profile developer --scope project --project /path/to/project --dry-run
node src/cli.js apply --target claude --profile developer --scope project --project /path/to/project --dry-run
node src/cli.js apply --target gemini --profile developer --scope project --project /path/to/project --dry-run
```

dry-run 결과를 각각 확인한 뒤 같은 순서로 `--dry-run`을 제거한 apply 명령을 제안합니다.

## 8. Agent 응답 형식

Agent는 설치 전 최종 확인을 아래 형식으로 요약합니다.

```text
선택 요약:
- purpose: developer workflow 적용
- user level: beginner
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

## 9. install.sh의 역할

`install.sh`는 QnA wizard가 아닙니다. 기본 역할은 다음 안내를 출력하는 bootstrap입니다.

- 현재 bundle 위치 확인
- `SETUP_WIZARD.md` 위치 안내
- Node.js 사용 가능 여부 확인
- 직접 CLI를 실행해야 할 때의 fallback 예시 제공

인자를 넘겨 실행하는 경우에는 고급 사용자용 direct apply wrapper로 사용할 수 있지만,
Pilot 기본 흐름은 `SETUP_WIZARD.md`를 agent 대화에 제공하는 방식입니다.

> 참고: 이 wizard는 프로젝트에 설정을 설치하는 단계만 다룹니다.
> 사내 공유 폴더(Google Drive AI-Knowhow)에서 스킬/프롬프트 `.md`를 받아 쓰거나,
> agent가 그 폴더를 직접 읽게 Google Drive를 연동하는 방법은
> `docs/SHARED_FOLDER_GUIDE.md`를 참고하세요. (공유 폴더는 브라우저만으로도 사용 가능하며 연동은 선택입니다.)

## 9.1 Windows에서 실행 (shell 전제와 fallback)

bundle은 OS 공통입니다(순수 Node, 의존성 0). 차이는 "무엇으로 실행하느냐"뿐입니다.

```text
전제: Windows에도 Node.js(LTS >=18)가 설치되어 있어야 한다. (https://nodejs.org)

실행 방법 (택1):
  1) PowerShell: install.ps1  ← Windows 권장 (공백 경로 자연 처리)
       pwsh -ExecutionPolicy Bypass -File .\install.ps1 --target codex --profile developer --dry-run
       (Windows PowerShell이면: powershell -ExecutionPolicy Bypass -File .\install.ps1 ...)
  2) cmd: install.bat
       install.bat --target codex --profile developer --dry-run
  3) Git Bash 또는 WSL: install.sh
       ./install.sh --target codex --profile developer --dry-run
  4) launcher 없이 node로 직접 실행 (가장 이식성 높음)
       node src\cli.js apply --target codex --profile developer --project "%CD%" --dry-run

다운로드한 zip의 install.ps1이 PowerShell에서 막히면(execution policy / 다운로드 파일 표시):
  - 위처럼 -ExecutionPolicy Bypass 로 실행하거나
  - 한 번 차단 해제: Unblock-File .\install.ps1
PowerShell/cmd 둘 다 막히면 Git Bash·WSL(install.sh) 또는 4) node 직접 실행으로 우회한다.
경로에 공백이 있으면 항상 큰따옴표로 감싼다: --project "C:\My Projects\repo"
```

> install.ps1(PowerShell)·install.bat(cmd)은 QnA를 하지 않는 얇은 wrapper입니다.
> 인자를 Node CLI로 그대로 넘기며, bash가 없는 Windows 사용자의 실행 경로로 유지됩니다.
> install.ps1은 PowerShell 배열로 인자를 넘겨 공백 경로를 자연스럽게 처리합니다.

## 10. 설치가 안 될 때

문제가 생기면 가장 먼저 `doctor`로 환경/번들을 진단합니다. Node 버전, 번들 구조,
설치 대상 폴더 쓰기 권한을 점검하고 실패 항목별 조치를 출력합니다.

```bash
node src/cli.js doctor                       # 환경 + 번들 점검
node src/cli.js doctor --project /path/to/project   # 설치 대상 쓰기 권한까지 점검
```

그다음 agent는 아래 증상별 대응을 사용자에게 안내합니다.

```text
- "node: command not found" / "Node.js가 필요합니다":
  Node.js 미설치. https://nodejs.org 에서 LTS 버전 설치 후 다시 시도한다.

- "agent-deploy bundle 구조를 확인할 수 없습니다":
  bundle을 압축 해제하지 않았거나 잘못된 폴더에서 실행한 경우.
  zip을 푼 폴더 안에서 install.sh 또는 node 명령을 실행한다.

- "unknown profile" / "unknown target":
  profile/target 이름 오타. 정확한 이름은 list로 확인한다.
    node src/cli.js list

- 경로에 공백이 있어 실패:
  --project 경로를 큰따옴표로 감싼다.
    예) --project "/Users/내 폴더/project"

- 권한 오류(permission denied):
  설치 대상 폴더의 쓰기 권한을 확인한다.
  회사 관리 PC라 권한이 없으면 IT/관리 담당자에게 문의한다.

- 무엇이 설치될지 확신이 안 설 때:
  항상 --dry-run을 먼저 실행한다. 생성/수정될 파일 목록만 보여주고
  실제로는 아무 파일도 쓰지 않는다.
```

해결되지 않는 오류는 실행한 명령과 dry-run 출력 전체를 함께 Drive 운영 메모 또는 담당자에게 공유하도록 안내합니다.
가능하면 agent가 오류 상황을 `feedback/YYYY-MM-DD-<role>-<target>-<short-topic>.md` 형식으로 정리해 Google Drive `AI-Knowhow/feedback/` 업로드까지 유도합니다. Drive 커넥터가 없으면 업로드할 `.md` 본문을 만들어 주고 사용자가 Drive 웹에서 올리도록 안내합니다.
