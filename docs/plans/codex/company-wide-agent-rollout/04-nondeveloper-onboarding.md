# 04. 비개발자 설치 경험 설계

## 목적

비개발자도 agent 설정을 설치하고 바로 업무에 사용할 수 있게 만든다.

## 원칙

```text
- CLI를 이해하는 사람 기준으로 만들지 않는다.
- 복사해서 붙여넣을 수 있는 한 줄 명령을 제공한다.
- 설치 후 다음 행동을 바로 안내한다.
- 실패했을 때 공유할 진단 정보를 제공한다.
- profile 설명은 직무 언어로 작성한다.
```

## 비개발자 설치 흐름

```text
1. 사내 Notion/Slack에서 본인 직무 선택
2. OS별 설치 명령 복사
3. Terminal 또는 PowerShell에 붙여넣기
4. installer가 target/profile 확인
5. 설치 완료 후 첫 사용 예시 출력
6. 문제 발생 시 doctor 결과를 #ai-help에 공유
```

## OS별 안내

### Windows

```powershell
npx agent-deploy apply --target claude --profile business --yes
```

### macOS

```bash
npx agent-deploy apply --target claude --profile business --yes
```

### Linux

```bash
npx agent-deploy apply --target claude --profile business --yes
```

## 설치 완료 메시지

예시:

```text
설치 완료: business profile for Claude

다음과 같이 시작하세요:
1. 회의록 정리:
   "다음 회의 내용을 의사결정/액션아이템/리스크로 정리해줘"

2. 고객 응대:
   "아래 고객 문의에 대해 정중하고 정확한 답변 초안을 만들어줘"

3. 프롬프트 자산화:
   "이 프롬프트가 반복 사용 가능하면 Notion 템플릿으로 정리해줘"

문제가 있으면 아래 결과를 #ai-help에 공유하세요:
agent-deploy doctor --target claude
```

## 비개발자용 명령

### profile 설명

```bash
agent-deploy explain --profile business
```

출력:

```text
business profile은 운영/CS/세일즈 업무를 위한 설정입니다.

포함:
- 고객 응대 초안
- 회의록 요약
- 제안서/FAQ 작성
- 출처 표기 rule
- 프롬프트 자산화 안내
```

### 예시 보기

```bash
agent-deploy examples --profile product
```

### 진단

```bash
agent-deploy doctor --target claude
```

진단 항목:

```text
- 설치 경로 존재 여부
- AGENTS.md/CLAUDE.md/GEMINI.md 존재 여부
- skills/rules 설치 여부
- install-state 존재 여부
- Node/npm 환경
- 권한 문제
```

## 문서 산출물

```text
docs/install-guide.md
docs/non-developer-guide.md
docs/troubleshooting.md
docs/profile-selection-guide.md
```

## 검증 방법

비개발자 3명을 대상으로 확인:

```text
- 설명만 보고 본인 profile 선택 가능
- OS별 명령을 복사해 설치 가능
- 설치 완료 후 첫 업무 수행 가능
- 실패 시 doctor 결과를 공유 가능
```

## 완료 기준

- 비개발자 3명이 도움 없이 설치한다.
- 설치 평균 시간이 10분 이하다.
- 실패 케이스의 원인이 doctor 출력으로 파악된다.
- profile별 첫 사용 예시가 제공된다.
