# 00-D. 결정 필요 사항

## 목적

전사 Agent Installer와 공용 AI 계정 운영을 시작하기 전에 결정해야 할 항목을 한곳에 모은다.

이 문서는 `#ai-governance`에서 관리하는 결정 레지스터다. 모든 결정은 한 번 정하면 영구 고정되는 것이 아니라, 파일럿/분기 리뷰를 통해 변경할 수 있다.

## 결정 상태

상태값:

```text
Proposed  : 초안
Accepted  : 채택
Rejected  : 폐기
Deferred  : 나중에 결정
Needs Info: 추가 정보 필요
```

우선순위:

```text
P0: 착수 전 결정 필요
P1: Pilot 전 결정 필요
P2: 전사 rollout 전 결정 필요
P3: 운영 고도화 단계에서 결정
```

---

## P0. 착수 전 반드시 결정

### D01. 정규 소스 저장 위치

질문:

```text
회사 표준 rules/skills/agents/prompts/manifests의 원본 저장소를 어디에 둘 것인가?
```

선택지:

1. 별도 private repo `company-agent-kit`
2. 기존 모노레포 내 `agent-deploy/`
3. Notion/Drive 중심 관리

권장:

```text
별도 private repo `company-agent-kit`
```

이유:

- 접근 제어가 쉽다.
- 릴리스와 버전 관리가 명확하다.
- 여러 프로젝트에 독립적으로 배포할 수 있다.

결정 시점:

```text
Phase 1 시작 전
```

---

### D02. 1차 지원 대상 AI 도구

질문:

```text
처음부터 어떤 AI 도구를 1급 지원할 것인가?
```

선택지:

1. Codex + Claude
2. Codex + Claude + Gemini
3. Claude만 먼저
4. Codex만 먼저

권장:

```text
Codex + Claude를 먼저 안정화하고, Gemini는 Pilot 중 추가
```

이유:

- 현재 agent-deploy에는 Claude adapter가 있다.
- 목표에는 Codex가 중요하다.
- Gemini까지 동시에 하면 MVP 범위가 커질 수 있다.

결정 시점:

```text
Installer MVP 구현 전
```

---

### D03. 개발자/비개발자 전달 방식

질문:

```text
비개발자에게도 CLI 설치를 요구할 것인가?
```

선택지:

1. 모두 CLI 사용
2. 개발자 CLI, 비개발자 웹 생성기/zip/가이드
3. 비개발자는 Notion 문서만 제공

권장:

```text
개발자는 CLI 또는 bundle, 비개발자는 OS별 installer/bundle/Custom Instructions/Prompt DB 중심
```

원칙:

```text
같은 방향성은 같은 설치 방식이 아니라 같은 정규 방법론을 다른 표면으로 전달한다는 뜻이다.
```

결정 시점:

```text
비개발자 온보딩 설계 전
```

---

### D04. 배포 채널

질문:

```text
agent installer를 어떻게 배포할 것인가?
```

선택지:

1. 사설 npm registry
2. GitHub Releases
3. 내부 파일 서버
4. npm + GitHub Releases 병행
5. Windows installer exe + Linux/macOS zip bundle
6. 선택적 shell script/bootstrap

권장:

```text
Windows: installer exe
Linux/macOS: zip bundle
프로젝트 설치: shell script 또는 batch file
선택 옵션: 전역 설정 설치
배포 위치: GitHub Releases 또는 내부 파일 서버
```

결정 반영:

```text
exe/zip은 기본 배포 방식이다.
프로젝트별 bundle 설치를 기본으로 한다.
sh/bat은 bundle 내부 실행 entrypoint로 제공한다.
```

결정 시점:

```text
Pilot 전
```

---

### D04-B. 기본 설치 범위

질문:

```text
설정을 프로젝트별로 설치할 것인가, 사용자 전역 설정으로 설치할 것인가?
```

선택지:

1. 프로젝트별 설치만 지원
2. 사용자 전역 설치만 지원
3. 프로젝트별 설치를 기본으로 하고 사용자 전역 설정은 옵션으로 제공

결정:

```text
프로젝트별 설정을 기본으로 한다.
사용자 전역 설정은 선택 옵션으로 제공한다.
```

의미:

```text
각 프로젝트에 명시적으로 회사 표준 agent 설정을 설치한다.
사용자가 원하면 전역 설정에도 같은 profile을 설치해 여러 프로젝트/CLI/IDE에서 공유할 수 있다.
```

프로젝트 기본 설치 위치:

```text
project/.agent-deploy/
project/AGENTS.md 또는 CLAUDE.md 또는 GEMINI.md
project/.codex/
project/.claude/
project/.gemini/
project/.cursor/
```

선택적 전역 설치 위치:

```text
Windows: %APPDATA%\\CompanyAgentKit 또는 %USERPROFILE%\\.company-agent
macOS: ~/Library/Application Support/CompanyAgentKit 또는 ~/.company-agent
Linux: ${XDG_CONFIG_HOME:-~/.config}/company-agent-kit 또는 ~/.company-agent
```

결정 시점:

```text
Installer MVP 구현 전
```

---

### D05. 지식 DB 위치

질문:

```text
노하우, 프롬프트, 회고, 출처 메타데이터를 어디에 저장할 것인가?
```

선택지:

1. Notion
2. GitHub repo
3. Slack Canvas
4. Notion + GitHub 병행

권장:

```text
Notion: 프롬프트 DB, 회고, 노하우
GitHub: installer assets, audit 가능한 변경 이력
Slack: 알림과 회고 수집 입구
```

결정 시점:

```text
주간 회고와 Prompt DB 설계 전
```

---

### D06. 공용 계정 매핑 방식

질문:

```text
20명 내외 구성원을 9개 AI 계정에 어떻게 매핑할 것인가?
```

선택지:

1. 팀별 계정 배정
2. 업무 유형별 계정 배정
3. 초기 담당자 중심 느슨한 공유
4. 완전 자유 사용

권장:

```text
업무 유형별 계정 배정 + 계정별 초기 담당자 1명 + 공동 사용자 N명
```

필수 기록:

```text
계정 + 작성자 + 사용 목적 + profile + 재사용 가능 노하우
```

결정 시점:

```text
Pilot 대상 선정 전
```

---

### D07. 민감정보 입력 금지 범위

질문:

```text
어떤 정보를 AI 도구에 입력 금지할 것인가?
```

초기 금지 권장:

```text
- 고객 개인정보
- API key, token, password, private key
- 미공개 계약 조건
- 민감한 재무 정보
- 법무 검토 전 외부 공개 불가 자료
- 사내 계정 credential
```

결정 시점:

```text
전 직원 교육 전
```

---

## P1. Pilot 전 결정

### D08-A. Installer 내부 아키텍처 패턴

질문:

```text
agent installer 내부 구현에 어떤 아키텍처 패턴을 적용할 것인가?
```

선택지:

1. 단순 script 구조
2. Clean Architecture
3. Hexagonal Architecture / Ports and Adapters
4. MVVM
5. Layered Architecture

권장:

```text
Clean Architecture + Hexagonal Architecture를 조합한다.
MVVM은 Windows GUI installer 또는 웹 설정 생성기 UI에만 적용한다.
```

이유:

```text
- installer의 핵심은 UI가 아니라 manifest 해석, plan 생성, apply 실행, adapter 변환이다.
- 하네스별 차이는 target adapter로 격리해야 한다.
- CLI, exe GUI, shell/batch, web generator가 같은 core use case를 호출해야 한다.
- Clean/Hexagonal 구조가 testability와 adapter 확장성에 가장 적합하다.
```

결정:

```text
Core domain:
  manifest, profile, module, asset, install plan, operation, install state

Use cases:
  list, plan, apply, sync, update, repair, uninstall, doctor

Ports:
  FileSystemPort, PackageSourcePort, TargetAdapterPort, StateStorePort, LoggerPort

Adapters:
  CLI, Windows installer UI, shell/batch, Codex, Claude, Gemini, Cursor, filesystem
```

결정 시점:

```text
Installer MVP 구현 전
```

---

### D08-B. 개발 프로젝트 코딩 아키텍처 표준

질문:

```text
AI agent가 회사 개발 프로젝트에서 코드를 작성할 때 어떤 아키텍처 패턴과 계층 규칙을 기본으로 따르게 할 것인가?
```

선택지:

1. 모든 프로젝트에 Clean Architecture 강제
2. 모든 UI 프로젝트에 MVVM 강제
3. 프로젝트 유형별 기본 패턴 지정
4. 프로젝트마다 완전 자율

권장:

```text
프로젝트 유형별 기본 패턴을 지정한다.
단, 공통 원칙은 "의존성 방향, 경계 분리, 테스트 가능성, 도메인 보호"로 통일한다.
```

기본값:

```text
Backend/API/Service:
  Clean Architecture 또는 Hexagonal Architecture

Frontend Web:
  Feature-based architecture + presentation/application/domain/infrastructure 경계
  React 계열은 MVVM을 강제하지 않고 container/view/hook/service 분리

Mobile/Desktop App:
  MVVM + Clean Architecture 조합

CLI/Automation:
  Command/UseCase/Adapter 분리

Data/ML Pipeline:
  pipeline stage 분리 + config/io/domain logic 분리
```

AI agent rule:

```text
프로젝트에 기존 아키텍처가 있으면 기존 구조를 우선한다.
새 프로젝트 또는 구조가 불명확한 경우 위 기본값을 따른다.
아키텍처 변경은 명시적 승인 없이 수행하지 않는다.
```

결정 시점:

```text
developer profile 작성 전
```

---

### D08-C. Git Commit Convention 표준

질문:

```text
AI agent와 사람이 작성하는 모든 commit message에 어떤 규칙을 적용할 것인가?
```

결정:

```text
제공된 회사 Git Commit Message Convention을 기본 표준으로 채택한다.
```

핵심:

```text
- 제목은 `[type] 한글 요약` 형식
- 본문은 `1. 내용`, `2. 수정 내역`, `3. 영향도` 순서
- 마지막에 Jira 링크 필수
- 허용 type은 feat, fix, refactor, chore, docs, test
```

미결정:

```text
- Jira space key 기본값
- Jira 티켓이 없는 작업의 예외 정책
- merge commit/squash commit에 적용할지 여부
- 자동 검증 hook을 강제할지 soft warning으로 둘지
```

권장:

```text
developer profile에는 commit convention rule을 필수 포함한다.
pre-commit 또는 commit-msg hook으로 형식 검증을 제공하되,
초기 Pilot에서는 warning, 전사 rollout 이후에는 required로 전환한다.
```

결정 시점:

```text
developer profile 작성 전
```

---

### D08. 1차 profile 범위

질문:

```text
Pilot에 어떤 profile을 포함할 것인가?
```

권장:

```text
minimal
developer
product
business
```

보류:

```text
design
manager
sdd
governance
```

---

### D09. installer 실행 방식

질문:

```text
Pilot 사용자는 어떤 방식으로 installer를 실행할 것인가?
```

선택지:

1. repo checkout 후 `node src/cli.js`
2. `npx company-agent-kit`
3. OS별 binary
4. zip/web generator

권장:

```text
개발자 Pilot: npx 또는 repo checkout
비개발자 Pilot: zip/web generator가 준비되지 않았다면 가이드 기반 수동 적용
```

---

### D10. provenance 식별자

질문:

```text
install-state에 누구/어떤 계정/어떤 머신에서 설치했는지 기록할 것인가?
```

권장 필드:

```json
{
  "actor": {
    "userId": "slack-or-employee-id",
    "aiAccountId": "AI-03",
    "track": "developer-or-non-dev",
    "machineLabel": "optional"
  }
}
```

주의:

```text
개인정보를 과도하게 수집하지 않는다.
필요 최소한의 감사/운영 정보만 기록한다.
```

---

### D11. Prompt DB 승인 방식

질문:

```text
등록된 프롬프트가 언제 회사 표준 skill로 승격되는가?
```

권장:

```text
1. Prompt DB 등록
2. 사용 횟수/성공률 태깅
3. 월간 데모 또는 분기 리뷰에서 검증
4. owner 지정
5. assets/skills/company-* 로 PR
6. installer 배포
```

---

### D12. KPI 목표값

질문:

```text
초기 KPI 목표를 어느 수준으로 둘 것인가?
```

권장 초기값:

```text
PR 노하우 작성률: 80% 이상
주간 회고 제출 계정: 7/9 이상
Prompt DB 등록: 월 10개 이상
출처 표기율: 90% 이상
Pilot 설치 성공률: 80% 이상
```

---

## P2. 전사 Rollout 전 결정

### D13. 보안 게이트 수준

질문:

```text
installer release 전에 어떤 보안 검사를 필수화할 것인가?
```

권장:

```text
- manifest validation
- frontmatter schema validation
- unicode safety
- workflow security validation
- secret scan
- MCP allowlist check
```

---

### D14. artifact signing 여부

질문:

```text
OS별 binary와 release artifact에 서명할 것인가?
```

권장:

```text
Pilot에서는 선택, 전사 rollout 전에는 도입
```

결정 이유:

- Windows SmartScreen/Gatekeeper 차단 가능성 감소
- 배포물 변조 방지
- 사내 신뢰 체계 확보

---

### D15. update/uninstall/repair 지원 범위

질문:

```text
전사 rollout 전에 설치 생애주기 기능을 어디까지 지원할 것인가?
```

권장 v1:

```text
update: 지원
repair: 지원
uninstall: 최소 지원
rollback: v1.1 이후
```

---

### D16. MCP 기본 포함 여부

질문:

```text
MCP 서버를 기본 profile에 포함할 것인가?
```

권장:

```text
minimal에는 MCP 제외
developer/business 등 필요한 profile에만 명시적으로 포함
filesystem MCP는 기본 제외
```

주의:

```text
npx -y 기반 MCP는 공급망/보안 리스크가 있으므로 allowlist와 버전 고정이 필요하다.
```

---

## P3. 운영 고도화 단계 결정

### D17. 에어갭/오프라인 지원

질문:

```text
인터넷 접근이 제한된 환경을 지원해야 하는가?
```

필요 시:

```text
- offline bundle
- 내부 registry mirror
- MCP 서버 내부 배포
- docs/assets zip 배포
```

---

### D18. usage dashboard 범위

질문:

```text
사용량을 어디까지 수집할 것인가?
```

권장:

```text
개인 감시가 아니라 운영 개선 목적의 aggregate metric만 수집한다.
```

수집 후보:

```text
- profile 설치 수
- 계정별 회고 제출 여부
- PR 노하우 작성률
- Prompt DB 사용 횟수
- 출처 표기율
```

---

### D19. 신규 AI 도구 추가 기준

질문:

```text
Cursor, OpenCode, Copilot, Windsurf를 언제 추가할 것인가?
```

권장 기준:

```text
- 실제 사용자 3명 이상
- 해당 도구에서 표준 방법론 주입 가능
- adapter 유지 책임자 존재
- 보안/설치 테스트 가능
```

---

## 결정 회의 운영 방식

### 회의 전

```text
- 각 D 항목의 권장안을 읽고 의견 작성
- 반대가 있으면 대안과 이유를 남김
```

### 회의 중

```text
- P0만 먼저 결정
- P1/P2는 담당자와 결정 시점만 지정
- 결론이 안 나면 Needs Info로 남김
```

### 회의 후

```text
- 결정 결과를 이 문서에 반영
- #ai-governance에 변경 요약 공유
- 필요한 경우 manifests/profile/rules 문서에 반영
```

## P0 결정 체크리스트

```text
- [ ] D01 정규 소스 저장 위치
- [ ] D02 1차 지원 대상 AI 도구
- [ ] D03 개발자/비개발자 전달 방식
- [ ] D04 배포 채널
- [ ] D04-B 기본 설치 범위
- [ ] D05 지식 DB 위치
- [ ] D06 공용 계정 매핑 방식
- [ ] D07 민감정보 입력 금지 범위
```

P0가 완료되어야 installer MVP와 Pilot 준비를 안정적으로 시작할 수 있다.
