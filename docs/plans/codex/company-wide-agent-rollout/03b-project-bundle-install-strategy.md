# 03-B. 프로젝트 번들 설치 전략

## 목적

회사 표준 agent 설정을 **프로젝트별로 명시적으로 설치**한다. 사용자가 원하면 같은 설정을 사용자 전역에도 설치할 수 있는 옵션을 제공한다.

핵심은 다음이다.

```text
기본값:
  zip bundle을 프로젝트 또는 임시 위치에 풀고 SETUP_WIZARD.md 기반 첫 agent 대화로 프로젝트별 설정을 유도한다.

선택값:
  --scope user 옵션으로 사용자 전역 설정에도 설치한다.
```

---

## 1. 왜 프로젝트별 설정을 기본으로 하는가

### 1.1 프로젝트 문맥이 명확하다

프로젝트별 설정은 repo 안에 어떤 agent 규칙이 적용되는지 명확히 보인다.

```text
project/
  ├─ AGENTS.md
  ├─ CLAUDE.md
  ├─ GEMINI.md
  ├─ .codex/
  ├─ .claude/
  ├─ .gemini/
  └─ .agent-deploy/
```

장점:

```text
- 팀원이 같은 repo에서 같은 규칙을 본다.
- 설정 변경이 PR로 리뷰 가능하다.
- 프로젝트별 예외와 추가 규칙을 관리하기 쉽다.
- 공용 계정이더라도 프로젝트별 업무 방식이 명확하다.
```

### 1.2 IDE/CLI 차이를 프로젝트 안에서 흡수한다

각 IDE/CLI는 프로젝트 폴더의 설정을 읽는다.

```text
Codex:
  AGENTS.md, .codex/, .agents/skills/

Claude:
  CLAUDE.md, .claude/

Gemini:
  GEMINI.md, .gemini/

Cursor:
  .cursor/
```

따라서 같은 bundle이 프로젝트 안에 여러 target 설정을 생성하면, 어떤 도구를 쓰더라도 같은 프로젝트 표준을 따를 수 있다.

---

## 2. 배포 방식

## 2.1 OS 공통 zip bundle

기본 배포:

```text
company-agent-kit.zip
또는 company-agent-kit-<platform>.zip
```

제외:

```text
CompanyAgentKitSetup.exe
Windows installer exe packaging
```

bundle 구성:

```text
company-agent-kit/
  ├─ bin/
  │   └─ agent-deploy
  ├─ assets/
  ├─ manifests/
  ├─ docs/
  ├─ SETUP_WIZARD.md
  ├─ install.sh
  ├─ install.bat  # optional wrapper
  └─ README.md
```

사용 예:

```bash
unzip company-agent-kit-macos-arm64.zip
cd company-agent-kit
sh install.sh
```

## 2.2 SETUP_WIZARD.md 기반 agent setup flow의 역할

`SETUP_WIZARD.md`가 기본 설정 entrypoint다.

역할:

```text
- 첫 agent 대화에서 project path/profile/target/scope를 선택하게 한다.
- agent가 dry-run 명령을 먼저 생성하게 한다.
- dry-run 결과 확인 후 apply 명령을 생성하게 한다.
- 실패 시 doctor 또는 CLI fallback 안내를 제공한다.
```

주의:

```text
- 내부적으로는 같은 planner/apply 로직을 호출해야 한다.
- install.sh는 bootstrap 안내와 고급 사용자용 direct wrapper만 담당한다.
- install.bat은 필요 시 optional wrapper로만 유지한다.
- Windows installer exe는 현재 배포 범위에서 제외한다.
```

---

## 3. 설치 scope

## 3.1 project scope

기본값:

```bash
agent-deploy apply --scope project --target codex --profile developer --project .
```

설치 위치:

```text
project/
  ├─ AGENTS.md
  ├─ CLAUDE.md
  ├─ GEMINI.md
  ├─ .agents/
  ├─ .codex/
  ├─ .claude/
  ├─ .gemini/
  ├─ .cursor/
  └─ .agent-deploy/
      └─ install-state.json
```

원칙:

```text
- project scope는 기본이다.
- 프로젝트별 설정은 repo에서 확인 가능해야 한다.
- 프로젝트별 설정 변경은 PR로 리뷰 가능해야 한다.
```

## 3.2 user scope

선택 옵션:

```bash
agent-deploy apply --scope user --target codex --profile developer
```

사용 시나리오:

```text
- 여러 프로젝트에서 같은 개인 기본 설정을 쓰고 싶다.
- CLI를 프로젝트 밖에서 자주 사용한다.
- 비개발자가 특정 프로젝트 폴더 없이 AI 도구를 사용한다.
```

전역 저장 위치:

```text
Windows: %APPDATA%\CompanyAgentKit 또는 %USERPROFILE%\.company-agent
macOS: ~/Library/Application Support/CompanyAgentKit 또는 ~/.company-agent
Linux: ${XDG_CONFIG_HOME:-~/.config}/company-agent-kit 또는 ~/.company-agent
```

주의:

```text
user scope는 project scope를 대체하지 않는다.
project scope가 있으면 project scope가 더 구체적인 문맥이다.
```

---

## 4. 설정 우선순위

권장 우선순위:

```text
1. 도구/플랫폼의 상위 정책
2. 프로젝트별 설정
3. 사용자 전역 설정
4. 도구 기본값
```

프로젝트별 설정은 전역 설정보다 구체적이다. 단, 프로젝트 설정이 회사의 최소 보안 기준을 약화시키면 안 된다.

금지:

```text
- 보안 rule 제거
- 민감정보 입력 허용
- 출처 표기 rule 제거
- 공용 계정 지식 공유 rule 제거
```

---

## 5. 설치 흐름

### 5.1 프로젝트 설치 기본 흐름

```text
1. bundle 다운로드
2. bundle 압축 해제
3. 첫 agent 대화에서 SETUP_WIZARD.md 읽기
4. agent가 프로젝트 경로 질문
5. agent가 profile 질문
6. agent가 target 질문
7. agent가 dry-run 명령 생성
8. 사용자가 dry-run 결과 확인
9. 사용자 승인 후 apply 명령 실행
10. doctor 안내
11. 완료 메시지 확인
```

### 5.2 전역 설정 옵션 흐름

```text
1. 사용자가 "전역 설정도 설치" 옵션 선택
2. OS별 전역 root 확인
3. user scope plan 생성
4. dry-run 표시
5. 사용자 확인
6. 전역 설정 설치
7. doctor 실행
```

---

## 6. install-state

project scope state:

```text
project/.agent-deploy/install-state.json
```

user scope state:

```text
Windows: %APPDATA%\CompanyAgentKit\install-state.json
macOS: ~/Library/Application Support/CompanyAgentKit/install-state.json
Linux: ~/.config/company-agent-kit/install-state.json
```

권장 필드:

```json
{
  "schemaVersion": "agentdeploy.install.v1",
  "scope": "project",
  "projectRoot": "...",
  "profile": "developer",
  "targets": ["codex", "claude"],
  "actor": {
    "track": "developer",
    "aiAccountId": "AI-01"
  },
  "operations": []
}
```

---

## 7. 구현 체크리스트

```text
- [ ] --scope project 기본값 적용
- [ ] --scope user 선택 옵션 구현
- [x] Windows installer exe 제외 결정
- [x] OS 공통 zip bundle 구조 정의
- [x] release manifest/checksum sidecar 생성
- [x] 다운로드 전 checksum 검증 안내
- [x] SETUP_WIZARD.md 기반 agent setup flow 작성
- [ ] install.bat optional wrapper 여부 결정
- [ ] project scope install-state 경로 확정
- [ ] user scope install-state 경로 확정
- [ ] dry-run 후 apply flow 구현
- [ ] doctor가 project/user scope 모두 검사
- [ ] update/repair/uninstall이 scope를 인식하도록 설계
```

---

## 완료 기준

```text
- OS 공통 zip bundle + SETUP_WIZARD.md 기반 agent setup flow로 프로젝트별 agent 설정을 설치할 수 있다.
- Windows installer exe 없이도 Windows/macOS/Linux 사용자에게 동일한 bundle 설치 절차를 안내할 수 있다.
- install.bat은 optional wrapper로 유지할지 결정되어 있다.
- 사용자 전역 설정은 선택 옵션으로 제공된다.
- project scope와 user scope의 install-state가 구분된다.
- 어떤 IDE/CLI를 쓰더라도 프로젝트 폴더 안의 표준 설정을 우선 사용한다.
```
