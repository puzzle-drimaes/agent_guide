# 03-B. 프로젝트 번들 설치 전략

## 목적

회사 표준 agent 설정을 **프로젝트별로 명시적으로 설치**한다. 사용자가 원하면 같은 설정을 사용자 전역에도 설치할 수 있는 옵션을 제공한다.

핵심은 다음이다.

```text
기본값:
  bundle을 프로젝트에 풀고 install.sh 또는 install.bat으로 프로젝트별 설정을 설치한다.

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

## 2.1 Windows

기본 배포:

```text
CompanyAgentKitSetup.exe
```

역할:

```text
- bundle 압축 해제
- 프로젝트 경로 선택
- profile 선택
- target 선택
- install.bat 또는 내부 installer 실행
- doctor 실행
```

보조 entrypoint:

```bat
install.bat
```

사용 예:

```bat
install.bat --scope project --target codex --profile developer --project .
```

## 2.2 Linux/macOS

기본 배포:

```text
company-agent-kit-linux-x64.zip
company-agent-kit-macos-arm64.zip
```

bundle 구성:

```text
company-agent-kit/
  ├─ bin/
  │   └─ agent-deploy
  ├─ assets/
  ├─ manifests/
  ├─ docs/
  ├─ install.sh
  ├─ install.bat
  └─ README.md
```

사용 예:

```bash
unzip company-agent-kit-macos-arm64.zip
cd company-agent-kit
sh install.sh --scope project --target codex --profile developer --project /path/to/project
```

## 2.3 sh/bat의 역할

`sh` 또는 `bat`은 여러 방법 중 하나다.

역할:

```text
- bundle 내부 installer를 쉽게 실행한다.
- 사용자의 OS별 명령 차이를 숨긴다.
- project path/profile/target 선택을 도와준다.
```

주의:

```text
- sh/bat 자체가 유일한 설치 방법은 아니다.
- 내부적으로는 같은 planner/apply 로직을 호출해야 한다.
- dry-run과 doctor를 지원해야 한다.
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
2. bundle 압축 해제 또는 exe 실행
3. 프로젝트 경로 선택
4. profile 선택
5. target 선택
6. dry-run 표시
7. 사용자 확인
8. project scope로 파일 설치
9. doctor 실행
10. 완료 메시지 출력
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
- [ ] Windows installer exe flow 정의
- [ ] Linux/macOS zip bundle 구조 정의
- [ ] install.sh 작성
- [ ] install.bat 작성
- [ ] project scope install-state 경로 확정
- [ ] user scope install-state 경로 확정
- [ ] dry-run 후 apply flow 구현
- [ ] doctor가 project/user scope 모두 검사
- [ ] update/repair/uninstall이 scope를 인식하도록 설계
```

---

## 완료 기준

```text
- Windows에서 exe로 프로젝트별 agent 설정을 설치할 수 있다.
- Linux/macOS에서 zip bundle + install.sh로 프로젝트별 설정을 설치할 수 있다.
- install.bat으로 Windows 프로젝트 설치가 가능하다.
- 사용자 전역 설정은 선택 옵션으로 제공된다.
- project scope와 user scope의 install-state가 구분된다.
- 어떤 IDE/CLI를 쓰더라도 프로젝트 폴더 안의 표준 설정을 우선 사용한다.
```
