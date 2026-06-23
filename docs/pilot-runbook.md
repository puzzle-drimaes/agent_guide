# 전사 Agent Bundle 베타 실행 Runbook

이 문서는 운영자가 내일 바로 전사 베타 배포를 시작할 수 있게 만든 실행용 runbook이다.
기존의 “5명 Pilot 참가자 배정” 방식이 아니라, 준비된 bundle을 먼저 전사에 공개하고 실제 사용 피드백을 받아 개선하는 **전사 베타**를 기준으로 한다.

## 1. 이번 베타의 목적

```text
회사 구성원이 개발자/비개발자 여부와 관계없이,
본인이 쓰는 AI 도구와 OS에서,
회사 표준 agent rule, prompt, skill, Markdown 업무 자산을
project scope 중심으로 설치·사용·공유할 수 있는지 확인한다.
```

이번 베타는 완벽한 정량 평가가 아니라, 전사 배포 후 실제 사용에서 드러나는 설치 문제, 이해도 문제, 도구별 의미 차이, 공유 흐름 문제를 빠르게 발견하고 개선하는 것이 목적이다.

## 2. 1차 베타에서 하지 않는 것

아래 항목은 이번 버전의 실행 범위에서 제외한다.

```text
- 별도 Pilot 참가자 5명 모집/배정
- 참가자별 OS / target / profile 사전 지정
- D0 / D+7 / D+14 일정표 운영
- 스케줄러, 자동 리마인드, 자동 피드백 수집
- 직무별 실험군 구분
```

운영자는 사용자를 그룹으로 나누지 않는다. 사용자는 현재 본인이 쓰는 프로젝트와 AI 도구에서 SETUP_WIZARD 안내를 따라 설치한다.

## 3. 운영 원칙

### 3.1 Project scope 우선

기본 설치 범위는 project scope다.

```text
- 각 프로젝트에 필요한 AGENTS.md, CLAUDE.md, GEMINI.md, .codex/, .claude/, .gemini/ 등을 설치한다.
- user/global scope는 고급 사용자 또는 별도 확인이 필요한 선택 옵션으로만 다룬다.
- 사용자 파일을 덮어쓸 가능성이 있으면 dry-run, backup, conflict policy를 먼저 확인한다.
```

### 3.2 Target/profile은 사전 배정하지 않음

Codex, Claude, Gemini 같은 target과 developer/product/business/governance profile은 운영자가 참가자에게 미리 배정하지 않는다.

```text
- 사용자는 현재 쓰는 AI 도구에서 시작한다.
- agent가 SETUP_WIZARD를 보고 필요한 target/profile을 제안한다.
- 운영자는 사후 피드백에서 어떤 target/profile 조합이 실제로 쓰였는지만 관찰한다.
```

이 프로젝트의 목표는 사용자가 target/profile 구분을 많이 신경 쓰지 않아도 회사 표준 자산을 쓰게 하는 것이다. 따라서 베타 운영에서도 사전 실험군 구분을 만들지 않는다.

### 3.3 피드백은 agent가 Markdown으로 정리

사용자는 별도 설문을 먼저 작성하지 않는다. 사용 후 본인이 쓰는 agent에게 피드백 정리 프롬프트를 실행하게 하고, 결과 `.md`를 Google Drive `AI-Knowhow/feedback/`에 올린다.

```text
- Drive 커넥터가 있으면 agent가 업로드까지 돕는다.
- Drive 커넥터가 없으면 agent가 업로드용 .md 본문을 만들고, 사용자가 Drive 웹에서 올린다.
- 민감정보, token, credential, 고객 개인정보, 내부 기밀 원문은 피드백에 포함하지 않는다.
```

## 4. 운영자 알파 리허설

전사 공지 전에 운영자가 Windows와 Linux에서 최소 1회씩 직접 확인한다. 이 단계는 전사 사용자에게 요구하는 절차가 아니라, 운영자가 bundle의 기본 안전장치를 확인하는 알파테스트다.

### 4.1 준비

```text
1. 최신 bundle 또는 repo checkout을 준비한다.
2. 쓰기 가능한 임시 테스트 프로젝트를 만든다.
3. Node.js 18 이상을 확인한다.
4. 테스트 프로젝트에는 실제 업무 기밀이나 credential을 넣지 않는다.
```

예시:

```bash
mkdir -p /tmp/agent-bundle-beta-smoke
cd /path/to/agent-deploy
node src/cli.js doctor --project /tmp/agent-bundle-beta-smoke
```

Windows PowerShell 예시:

```powershell
New-Item -ItemType Directory -Force $env:TEMP\agent-bundle-beta-smoke
cd C:\path\to\agent-deploy
node src\cli.js doctor --project $env:TEMP\agent-bundle-beta-smoke
```

### 4.2 Linux 리허설 명령

아래 예시는 Codex + developer profile 기준이다. 운영자는 필요하면 Claude/Gemini 또는 product/business/governance profile도 같은 방식으로 반복 확인한다.

```bash
PROJECT=/tmp/agent-bundle-beta-smoke
cd /path/to/agent-deploy

node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project "$PROJECT" \
  --dry-run

node src/cli.js apply \
  --target codex \
  --profile developer \
  --scope project \
  --project "$PROJECT" \
  --backup

node src/cli.js doctor --project "$PROJECT"

node src/cli.js update \
  --target codex \
  --profile developer \
  --scope project \
  --project "$PROJECT" \
  --dry-run

node src/cli.js repair \
  --target codex \
  --profile developer \
  --scope project \
  --project "$PROJECT" \
  --dry-run

node src/cli.js uninstall \
  --target codex \
  --profile developer \
  --scope project \
  --project "$PROJECT" \
  --dry-run
```

### 4.3 Windows 리허설 명령

PowerShell 기준 예시:

```powershell
$PROJECT = "$env:TEMP\agent-bundle-beta-smoke"
New-Item -ItemType Directory -Force $PROJECT
cd C:\path\to\agent-deploy

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

### 4.4 리허설 통과 기준

```text
- dry-run이 실제 파일을 쓰지 않는다.
- apply가 project scope에만 설치한다.
- doctor가 Node 버전, bundle 구조, 대상 프로젝트 쓰기 권한을 진단한다.
- update --dry-run이 install-state를 읽고 변경 예정 사항을 출력한다.
- repair --dry-run이 누락/변경된 managed file 상태를 출력한다.
- uninstall --dry-run이 삭제/되돌림 대상을 출력하되 실제 삭제하지 않는다.
- 실패가 있으면 명령, OS, Node 버전, 출력 전문, workaround를 feedback .md로 남긴다.
```

## 5. 전사 공지문

아래 문안을 사내 게시판, 메일, Drive 운영 메모 등 현재 회사가 쓰는 공지 채널에 그대로 게시한다. 배포 링크, 담당자, 문의 경로만 회사 상황에 맞게 채운다.

```md
# 전사 Agent Bundle 베타 안내

회사 표준 AI agent 설정과 업무용 Markdown 자산을 전사 베타로 배포합니다. 이번 베타는 개인 평가가 아니라 설치 안내, 공통 rule, prompt, skill, 공유 문서 흐름을 실제 업무에서 개선하기 위한 운영 테스트입니다.

개발자/비개발자 구분 없이 본인이 쓰는 AI 도구와 프로젝트에서 사용해 보면 됩니다. 별도 참가자 배정은 없고, 가능한 사람부터 사용 후 피드백을 남겨 주세요.

## 대상

- Codex, Claude, Gemini 등 AI 도구를 업무에 쓰는 구성원
- 회사 표준 prompt/skill/rule을 프로젝트에 적용해 보고 싶은 구성원
- 본인이 만든 `.md` 업무 자산을 공유하거나 재사용해 보고 싶은 구성원

## 진행 방법

1. 배포된 `agent-deploy` bundle을 내려받습니다.
   - 배포 위치: `<bundle 링크 또는 Drive/GitHub Releases 위치>`
2. bundle 안의 `SETUP_WIZARD.md`를 엽니다.
3. 본인이 쓰는 AI 도구에 `SETUP_WIZARD.md` 내용을 전달하고, 설치 안내를 요청합니다.
4. agent가 제안한 명령 중 `dry-run`을 먼저 실행해 어떤 파일이 생기는지 확인합니다.
5. 문제가 없으면 `apply`를 실행합니다.
6. 설치 후 실제 업무에서 prompt, skill, rule을 사용해 봅니다.
7. 사용 후 아래 "피드백 정리 프롬프트"를 agent에게 실행해 결과를 `.md`로 정리합니다.
8. 정리된 `.md`를 Google Drive `AI-Knowhow/feedback/` 폴더에 업로드합니다.

## 피드백 요청

좋은 사례, 헷갈린 점, 설치 실패, 도구별 차이, 비개발자가 이해하기 어려운 표현을 모두 남겨 주세요. 실패 사례도 운영 개선에 중요합니다.

피드백은 아래 방식 중 편한 방법으로 남기면 됩니다.

- Drive 커넥터가 있는 agent: agent에게 `AI-Knowhow/feedback/` 업로드까지 요청
- Drive 커넥터가 없는 agent: agent가 만든 `.md` 내용을 복사해 Drive 웹에서 직접 업로드

## 꼭 지켜야 할 보안 기준

- 고객 개인정보, credential, token, private key, 비밀번호, 세션 쿠키를 입력하거나 업로드하지 마세요.
- 내부 기밀 원문은 그대로 붙여넣지 말고 요약하거나 `<고객명>`, `<프로젝트명>` 같은 placeholder로 바꿔 주세요.
- 외부 자료를 참고했다면 출처를 남겨 주세요.
- 문제가 생기면 화면만 캡처하지 말고, 실행한 명령과 출력 내용을 agent에게 전달해 피드백 `.md`로 정리해 주세요.

## 문의

- 운영 담당: `<담당자 또는 팀>`
- 문의 경로: `<메일/게시판/Drive 운영 메모 등>`
```

## 6. 사용자용 피드백 정리 프롬프트

전사 공지에 아래 프롬프트를 함께 넣는다. 사용자는 설치 또는 실제 사용 후 본인이 쓰는 agent에게 그대로 붙여넣는다.

```md
아래 항목에 따라 이번 Agent Bundle 사용 경험을 `.md` 문서로 정리해줘.

중요:
- 고객 개인정보, credential, token, private key, 비밀번호, 세션 쿠키는 포함하지 마.
- 내부 기밀 원문은 그대로 넣지 말고 요약하거나 `<프로젝트명>`, `<고객명>` 같은 placeholder로 바꿔줘.
- 외부 자료를 사용한 내용이 있으면 출처를 남겨줘.
- 마지막에 Google Drive `AI-Knowhow/feedback/` 폴더에 올릴 파일명도 제안해줘.

## 1. 기본 정보

- 작성일:
- OS:
- 사용한 AI 도구:
- 설치한 프로젝트 경로 또는 설명:
- 설치 scope: project / user-global / 모르겠음
- 사용한 target/profile을 알면 적어줘:

## 2. 설치 결과

- 설치 시도 여부:
- dry-run 성공 여부:
- apply 성공 여부:
- doctor 실행 여부와 결과:
- update --dry-run / repair --dry-run / uninstall --dry-run을 실행했다면 결과:
- 대략 소요 시간:
- 막힌 단계:
- 해결 방법 또는 아직 막힌 점:

## 3. 실제 사용 사례

- 어떤 업무에 사용했나:
- 사용한 prompt / skill / rule:
- 결과물이 실제 업무에 도움이 되었나:
- 다시 쓰고 싶은 부분:
- 불편하거나 과한 부분:

## 4. 이해도와 사용성

- SETUP_WIZARD 안내가 이해됐나:
- 비개발자도 이해하기 어려운 표현이 있었나:
- target/profile/프로젝트 scope 중 헷갈린 개념이 있었나:
- AI가 안내를 잘못했거나 불필요하게 복잡하게 만든 부분:

## 5. 도구별 의미 동등성

- 같은 rule/prompt인데 Codex, Claude, Gemini 등에서 다르게 동작한 사례가 있나:
- 있다면 어떤 도구에서 무엇이 달랐나:
- 회사 표준 방식이 응답에 잘 반영됐나:

## 6. 공유/재사용 후보

- 공유해도 되는 `.md` 산출물이 있나:
- 다른 팀도 쓸 수 있을 것 같은 prompt/skill/rule 아이디어:
- Google Drive 또는 GitHub 후보 branch에 올리고 싶은 항목:
- 공유 전에 제거해야 할 민감정보 또는 출처 보강 필요 여부:

## 7. 개선 요청

- 가장 먼저 고쳐야 할 문제 1개:
- 없어도 되는 복잡한 절차:
- 추가되면 좋을 prompt/skill/template:
- 전사 확대 전에 운영자가 알아야 할 리스크:

위 내용을 바탕으로 업로드 가능한 Markdown 문서를 만들어줘.
파일명은 `YYYY-MM-DD_agent-bundle-feedback_<간단한-주제>.md` 형식으로 제안해줘.
```

## 7. 운영자 취합 체크리스트

운영자는 개별 사용자를 사전 배정하지 않고, 업로드된 피드백 `.md`와 직접 문의를 기준으로 아래 항목을 취합한다.

| 항목 | 확인 방법 | 판단 기준 |
|---|---|---|
| 설치 성공률 | 피드백 `.md`의 dry-run/apply 결과 | 추세 확인. 1차 베타에서는 통과/실패 기준으로 쓰지 않음 |
| 설치 평균 소요 시간 | 사용자가 적은 대략 시간 | 너무 오래 걸리는 단계 식별 |
| project scope 설정 | 설치 결과와 install-state 확인 | user/global scope가 의도치 않게 쓰였는지 확인 |
| 도구별 의미 동등성 | Codex/Claude/Gemini 차이 사례 | 같은 rule/prompt가 다른 의미로 해석되는지 확인 |
| 비개발자 이해도 | 헷갈린 표현, wizard 이해도 | target/profile/scope 용어 개선 후보 수집 |
| 공유 `.md` 업로드 사례 | Drive `AI-Knowhow/feedback/`, 공유 폴더 | 재사용 가능한 prompt/skill/template 후보 식별 |
| 보안 위험 신호 | 민감정보 입력/업로드 언급 | 즉시 governance 담당 확인 |
| blocker | 설치 실패, target 불일치, 권한 문제 | workaround 유무와 재발 빈도 기록 |

## 8. 피드백 처리 원칙

```text
1. 모든 피드백은 개인 평가가 아니라 운영 개선 자료로만 쓴다.
2. 민감정보가 포함된 피드백은 공유하지 말고 정제본을 다시 만든다.
3. blocker는 재현 명령, OS, target, profile, 출력, workaround를 묶어 기록한다.
4. 같은 문제가 2건 이상 반복되면 우선순위를 올린다.
5. prompt/skill 공유 후보는 검증 전에는 공식 표준 asset처럼 안내하지 않는다.
6. 검증된 후보만 GitHub prompts/skills branch 또는 main 승격 대상으로 분류한다.
```

## 9. 운영자 일일 점검

스케줄러는 쓰지 않는다. 운영자가 가능한 날에 수동으로 아래만 확인한다.

```text
- 신규 feedback .md가 올라왔는가?
- 설치 실패 또는 보안 위험 신호가 있는가?
- 같은 blocker가 반복되는가?
- SETUP_WIZARD 또는 공지문에 바로 고칠 표현이 있는가?
- 공유 가능한 prompt/skill/template 후보가 있는가?
- 전사 공지에 추가 FAQ가 필요한가?
```

## 10. 종료 판단

이번 베타는 고정된 D+7/D+14 종료 일정을 두지 않는다. 운영자가 충분한 실제 사례가 모였다고 판단하면 아래 기준으로 다음 단계를 결정한다.

```text
- 설치 실패의 주요 원인과 workaround가 문서화됐다.
- project scope 기본 설치가 큰 혼선 없이 확인됐다.
- Codex/Claude 중심 사용에서 의미 동등성 이슈가 식별됐다.
- Gemini 사용 사례가 있으면 차이점이 기록됐다.
- 비개발자가 이해하기 어려운 표현과 절차가 수집됐다.
- 공유 가능한 .md 후보와 재사용 사례가 최소한 일부 확인됐다.
- 민감정보/credential 업로드 위험에 대한 대응 기준이 확인됐다.
```

결과는 `Finish.md`와 관련 운영 문서에 요약하고, 실제 수정이 필요한 항목은 `TODO.md` 또는 별도 spec으로 넘긴다.
