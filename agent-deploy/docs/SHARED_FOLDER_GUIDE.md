# 공유 폴더 운영 가이드 (AI-Knowhow)

이 문서는 Google Drive 공유 폴더에 스킬/프롬프트 `.md`를 올리고, 다른 사람이 선택해 자기 프로젝트에 적용하는 1차 도입 흐름의 운영 기준이다.
사용자용 짧은 안내는 공유 폴더 안의 `README — AI-Knowhow 사용 안내`에 있고, 적용 단계의 상세 규칙은 [ASSET_PACKS.md](ASSET_PACKS.md)에 있다.

## 위치

```text
공유 드라이브 "Drive" > AI-Knowhow/
  ├─ skills/    실행 가능한 스킬(.md / SKILL.md)
  ├─ prompts/   재사용 프롬프트(.md)
  └─ feedbacks/  설치/사용 피드백(.md)
```

폴더는 이름으로 검색하지 말고 아래 링크를 직접 열거나(사람), folder ID로 범위를 좁힌다(agent).

```text
AI-Knowhow(최상위)   https://drive.google.com/drive/folders/1krsWm7GBlwAk9M58HfW2kfWmkSuKBqQz
AI-Knowhow/skills    https://drive.google.com/drive/folders/1PZx9YNdpPZ2I2LX0zYC1k-XerQ0nEMys
AI-Knowhow/prompts   https://drive.google.com/drive/folders/1Cv104mmGpw9fqNQfuAttr_LfQl8Hxqee
AI-Knowhow/feedbacks https://drive.google.com/drive/folders/17uEEoB9LdLBx9yNvOX0xKT3hh1uKFcL6
```

> Drive에서 이름(예: "AI-Knowhow/prompts")으로 검색하면 동명 결과가 많이 나온다. 받을 `.md`는 위 folder ID 폴더를 직접 열거나, agent는 Drive 검색을 `parentId = '<folder ID>'`로 한정해 해당 폴더 안의 `.md`만 본다.

## 기본 방침

```text
- 1차 도입: 사용자 공유 채널은 Google Drive 하나로 둔다.
- Google Drive는 사람이 보고 올리고 내려받는 공유 입구다.
- 피드백은 agent가 `.md`로 정리해 Google Drive `AI-Knowhow/feedbacks/` 업로드를 먼저 제안한다.
- GitHub는 이력/중복/수동 병합을 위한 정본 관리 저장소다.
- 후보 등록에는 PR을 요구하지 않는다. prompts / skills branch에 후보를 모은다.
- 현재 작업 진행(WIP) 기간에는 `main` 직접 push를 GitHub에서 막지 않는다. 안정화 후 protected merge 전용으로 전환한다.
- 예외 없이 지킬 것 두 가지: 보안(금지 데이터 미업로드)과 출처 표기.
- frontmatter/파일명 규칙은 "권장"이다. 고르고 적용하기 쉽게 하려는 것일 뿐 의무가 아니다.
```

## 0. GitHub branch 정책

Google Drive만으로는 변경 이력과 중복 관리가 어렵기 때문에, 공유된 `.md`는 GitHub에도 남긴다. 단, 관리자가 매번 승인하는 PR 흐름은 운영하지 않는다.
세부 권한 설정과 운영자 체크리스트는 [GITHUB_BRANCH_POLICY.md](GITHUB_BRANCH_POLICY.md)를 기준으로 한다.

```text
main
  - 공식 배포본
  - 검증/정리된 prompt, skill만 포함
  - 현재 WIP 기간에는 direct push 허용(ruleset disabled)
  - 안정화 후 protected branch / ruleset으로 agent 직접 push 금지 전환
  - 전환 후 운영자가 필요할 때 prompts / skills branch에서 protected merge

prompts
  - prompt 공유 후보 수집 branch
  - 사원 agent가 정제 후 commit/push 가능
  - 아직 공식 asset 아님

skills
  - skill 공유 후보 수집 branch
  - 사원 agent가 정제 후 commit/push 가능
  - 아직 공식 asset 아님
```

브랜치 의미:

```text
Google Drive: 사람이 접근하는 공유 채널
GitHub main: 공식 배포본
GitHub prompts/skills: 사원 공유 후보를 모으는 수집 공간
```

## 1. 무엇을 어디에 올리나

```text
- skills/  : agent가 작업을 수행하는 절차/도구 사용 방식. 예) 코드 리뷰 체크리스트, 회의록 정리 절차.
- prompts/ : 복사해서 바로 쓰는 프롬프트 문장. 예) 주간 보고 작성, PRD 초안 요청.
- feedbacks/: 설치 실패, 사용 불편, 개선 제안, 좋은 사례. 예) pilot-install-windows-codex.md.
- 헷갈리면: "절차/도구 사용"이면 skills, "한 번 붙여넣어 쓰는 문장"이면 prompts.
```

GitHub 후보 branch에 남길 때의 최소 경로는 다음이다.

```text
prompts branch → uploads/prompts/<name>.md
skills branch  → uploads/skills/<skill-name>/SKILL.md
```

예시는 다음처럼 쓴다.

```text
uploads/prompts/customer-faq-draft.md
uploads/skills/meeting-followup/SKILL.md
```

## 2. 파일명 규칙 (권장)

```text
- 소문자 kebab-case, 영문/숫자/하이픈만. 예) code-review-checklist.md, weekly-report.md
- 스킬을 폴더로 묶을 때: skills/<skill-id>/SKILL.md
- 이름만 봐도 용도가 드러나게 짓는다.
- 버전/날짜/작성자를 파일명에 붙이지 않는다(버전은 frontmatter version으로 관리).
- 이름이 겹치면 더 구체적으로. 예) pr-review.md → frontend-pr-review.md
```

## 3. frontmatter 예시 (권장; 없어도 됨)

파일 맨 위에 한 블록 적어두면 고르는 사람과 agent가 분류·적용하기 쉽다. 처음엔 생략해도 되고, 나중에 agent가 draft로 채워줄 수 있다.

### 프롬프트 / 문서 — asset frontmatter

```yaml
---
id: weekly-report
asset_type: prompt          # prompt | template | doc
title: 주간 보고 작성 프롬프트
description: 주간 업무 로그를 요약/성과/리스크/다음주 계획으로 정리한다.
audience: ["business", "manager"]
owner: hong.gildong
stability: draft            # draft | beta | stable | deprecated
tags: ["report", "weekly"]
sensitivity: internal       # public | internal | confidential
# 외부 자료 기반이면 함께 적는다:
# source: <URL 또는 문서명>
# license: <라이선스>
---
```

```text
등록/승격 시 필수: id, asset_type, title, description, audience, owner, stability
(asset_type: doc 인 경우 promotion_status, sensitivity 도 필수)
그 외 필드는 선택. 공유 폴더 단계에서는 일부만 적어도 된다.
```

### 스킬 — SKILL.md frontmatter

```yaml
---
name: code-review-checklist
description: PR 변경을 회사 기준 체크리스트로 리뷰한다. Triggers on "코드 리뷰", "PR 리뷰".
allowed-tools: ["Read"]
argument-hint: "[diff / PR 링크]"
---
```

```text
스킬은 Claude-skill 형식(name/description/allowed-tools/argument-hint)을 쓴다.
name 은 폴더명과 같게 한다(skills/code-review-checklist/SKILL.md).
```

## 4. 올리기 전 체크 (보안 — 예외 없음)

```text
- 금지 데이터 제거 또는 placeholder 치환:
  고객 개인정보 / credential / token / private key / 미공개 계약·재무·법무 자료
  예) <고객명>, <API_KEY>, <사번>
- 외부 자료 기반이면 출처/라이선스 표기(frontmatter source/license 또는 본문).
- sensitivity 가 confidential 인 자료는 공유 폴더에 올리지 않는다(개인/팀 범위로만 유지).
```

## 4-1. 피드백 업로드 흐름

피드백은 대화창에 흩어지지 않게 agent가 `.md` 파일로 정리해 `feedbacks/` 폴더 업로드를 유도한다. 제출은 강제가 아니며, 사용자가 동의할 때만 업로드한다.

권장 파일명:

```text
feedbacks/YYYY-MM-DD-<role>-<target>-<short-topic>.md

예:
feedbacks/2026-06-23-business-claude-install-error.md
feedbacks/2026-06-23-product-codex-prompt-request.md
```

권장 템플릿:

```md
---
id: feedback-YYYY-MM-DD-short-topic
asset_type: feedback
title: 피드백 제목
audience: ["governance"]
owner: <작성자 또는 담당자>
stability: draft
tags: ["pilot-feedback"]
sensitivity: internal
---

# 피드백

## 상황
- 역할/profile:
- AI 도구/target:
- OS:
- 발생 시점:

## 내용
- 무엇이 막혔나 / 무엇이 좋았나:
- 재현 절차 또는 사용 흐름:
- 기대한 동작:
- 실제 결과:

## 첨부/근거
- 오류 메시지 또는 화면 설명:
- 관련 파일/명령:

## 제안
- 원하는 개선:
- 우선순위: 낮음 / 보통 / 높음 / blocker

## 보안 확인
- 민감정보/credential/고객 개인정보 제거 여부: 예
- 외부 자료 출처 표기 필요 여부:
```

agent 동작 기준:

```text
1. 사용자가 설치 오류, 사용 불편, 개선 제안, 좋은 사례를 말하면 피드백 업로드를 제안한다.
2. agent는 민감정보/credential/고객 데이터를 제거하거나 placeholder로 바꾼다.
3. agent는 위 템플릿으로 `.md`를 작성하고 사용자에게 업로드 전 확인을 받는다.
4. Google Drive 커넥터가 있으면 `AI-Knowhow/feedbacks/`에 직접 업로드한다.
   - `.md` 원형 유지를 위해 가능하면 disableConversionToGoogleType: true 를 사용한다.
5. 커넥터가 없으면 파일 내용을 제공하고 사용자가 Drive 웹에서 업로드하도록 안내한다.
6. blocker는 운영자가 바로 볼 수 있도록 파일명이나 tags에 `blocker`를 포함한다.
```

## 5. 검토 / 선택 적용 흐름

올리는 쪽(사원 A):

```text
1. agent에게 "이 prompt/skill을 공유해줘"라고 명시하거나, scheduler가 공유 후보를 제안한다.
2. agent가 공유 전 정제를 수행한다.
   - prompt / skill 분류
   - 민감정보·credential·고객 데이터 제거 또는 placeholder 치환
   - 출처/라이선스 보강
   - frontmatter 또는 한 줄 설명 보강
   - 기존 파일명과 충돌하면 overwrite하지 않고 더 구체적인 이름 제안
3. Google Drive의 skills/ 또는 prompts/ 에 `.md`를 업로드한다.
4. GitHub에도 남긴다.
   - prompt면 `prompts` branch의 `uploads/prompts/<name>.md`에 commit/push
     예: `uploads/prompts/customer-faq-draft.md`
   - skill이면 `skills` branch의 `uploads/skills/<skill-name>/SKILL.md`에 commit/push
     예: `uploads/skills/meeting-followup/SKILL.md`
   - 후보 branch 안에서는 위 `uploads/...` 경로를 최소 규칙으로 사용한다
   - 후보 asset은 `main`보다 `prompts`/`skills` branch에 남기는 것을 권장한다
   - 단, 현재 WIP 기간에는 운영 문서/설정 정리를 위해 `main` 직접 push를 차단하지 않는다
   - `main` 승격 또는 공식 반영 검토는 PR/MR template 없이 운영자가 후보 branch commit과 Drive 운영 메모를 기준으로 수동 판단한다
```

쓰는 쪽(사원 B):

```text
1. 기본은 GitHub main 또는 Drive의 공식/정리본 기준으로 추천받는다.
2. 사용자가 원하면 prompts / skills branch의 후보도 조회할 수 있다.
3. 후보 branch 자료는 반드시 "검증 전 공유본"이라고 표시한다.
4. `AI-Knowhow/skills` 또는 `AI-Knowhow/prompts`가 비어 있으면
   agent가 Google Drive에서 가져올지 묻는다.
   - agent가 직접 가져오려면 Google Drive MCP/커넥터가 연결돼 있어야 한다.
   - 연결이 없으면 사용자가 Drive 웹에서 `.md`를 내려받아 AI-Knowhow에 직접 넣는다.
5. Drive에서 받을 때 agent는 `.md` 파일 직접 다운로드를 우선한다.
   - 직접 다운로드 후 보안 검사(추천): Drive의 `.md` 원본을 AI-Knowhow 검역 위치에 저장한 뒤 로컬 파일에서 credential/customer data/민감정보/출처 누락을 점검하고 필요한 경우 redaction/sanitized copy 생성
   - 원본 그대로 받기: Drive의 `.md` 원본을 AI-Knowhow에만 저장하고, 검증 전 공유본으로 표시
   - 피할 방식: 큰 `.md`를 base64 문자열이나 대화창 텍스트로 옮겨 적어 수동 디코딩하는 방식
6. agent가 적용 전 아래를 보여준다.
   - 무엇을 하는 asset인지 요약
   - 내 프로젝트 어디에 들어갈지
   - 기존 파일과 충돌 여부
   - 보안/출처 문제 여부
   - 적용 diff 또는 파일 목록
7. 사용자가 컨펌하면 내 프로젝트의 아래 위치에 넣는다.
     <repo>/AI-Knowhow/skills/    (스킬)
     <repo>/AI-Knowhow/prompts/   (프롬프트)
8. agent가 프로젝트에 맞게 검토/배치한다.
   - 민감정보 포함 여부 확인
   - frontmatter 없으면 draft frontmatter 제안(원본 룰/문서는 함부로 바꾸지 않음)
   - 기존 문서와 충돌하면 keep-existing / add-namespaced / rename-proposed / replace-existing
     중 선택지를 제시(기본 추천 add-namespaced)
   - shared/<pack-id>/ 아래 target별 위치에 배치
```

상세 규칙(conflict 정책, target별 배치 경로, 안전 규칙)은 [ASSET_PACKS.md](ASSET_PACKS.md) 참고.

## 6. 수동 병합 / 승격 (선택)

```text
- prompts / skills branch는 후보 수집 공간이다.
- 운영자는 주기적으로 후보를 훑어 중복/저품질/오래된 파일을 정리한다.
- 여러 사람이 반복해서 잘 쓰는 프롬프트나 스킬만 main으로 반영한다. 현재 WIP 기간 이후에는 protected merge로 전환한다.
- 검증되면 company-* asset(skill/prompt)으로 승격한다.
- 승격 시에는 전체 frontmatter와 승인 체크리스트(ASSET_PACKS.md)를 충족해야 한다.
- 공유 폴더와 후보 branch 단계는 강제가 없지만, main 반영/승격 단계는 보안/출처/리뷰 게이트를 거친다.
```

## 7. Google Drive 연동과 운영 주의점 (선택)

### 연동이 필요한가?

```text
- 필요 없음: 사람이 Drive 웹/앱에서 직접 .md를 올리고 내려받는다(브라우저만 있으면 됨).
- 필요함:   agent가 이 폴더를 "직접" 읽고/쓰게 하려는 경우만 AI 도구에 Drive 커넥터를 연동한다.
```

즉 1차 도입의 기본 흐름(사람이 내려받아 AI-Knowhow에 넣기)은 연동 없이도 동작한다. 연동은 편의 기능이다.

### 연동하기 (사용자별 1회)

회사 MCP baseline(`assets/mcp/servers.json`)에 넣는 방식이 아니라, **각 사용자가 자기 AI 도구에서 Google 계정을 OAuth로 연동**한다. (서버 토큰 방식이 아니라 개인 OAuth 커넥터다.)

```text
1. 자기 AI 도구의 커넥터/통합 설정을 연다.
   예) Claude: 설정 → Connectors → Google Drive → Connect (Google 로그인/동의)
       Codex/Gemini 등은 각 도구의 커넥터 설정을 따른다.
2. 전사 공유 드라이브("Drive")에 본인 계정(또는 공용 계정)이 멤버로 추가돼 있어야 한다.
   - 멤버가 아니면 연동해도 이 폴더가 보이지 않는다. 관리자에게 공유 요청.
3. 연동 후 agent에게 "AI-Knowhow/prompts 의 .md 목록을 보여줘" 같은 요청으로 접근을 확인한다.
4. 민감정보 입력 금지 규칙은 연동 여부와 무관하게 그대로 적용된다.
```

설치 wizard에서 AI-Knowhow가 비어 있을 때 agent가 Drive에서 공유 `.md`를 직접 가져오려면 이 연동이 필요하다.
Drive MCP/커넥터가 없거나 권한이 부족하면, agent는 연결 절차를 안내한 뒤 사용자가 브라우저로 `.md`를
내려받아 `AI-Knowhow/`에 넣는 수동 fallback을 안내한다.

연결 확인용 요청 예시는 다음과 같다.

```text
- AI-Knowhow/prompts 폴더의 .md 목록을 보여줘.
- AI-Knowhow/skills 폴더의 .md 목록을 보여줘.
- 선택한 .md 파일을 원형 그대로 다운로드해서 `AI-Knowhow/`에 저장하고 로컬에서 보안 검사해줘.
```

### 접근 권한

```text
- MCP는 "연동한 한 계정"의 권한으로 동작한다.
- 전사 공유가 되려면 그 공유 드라이브에 구성원/공용 계정이 멤버로 추가돼 있어야 한다.
- 권한이 없으면 목록/다운로드/업로드가 모두 실패한다.
```

### .md 라운드트립 (중요)

이 폴더의 핵심 흐름은 "올린 .md를 내려받아 `AI-Knowhow/`에 넣기"다. 따라서 파일이 진짜 `.md`로 유지돼야 한다.

```text
- agent(MCP)가 받을 때도 본문/base64 수동 복사보다 `.md` 파일 직접 다운로드를 우선한다.
- 다운로드한 원본은 AI-Knowhow 검역 위치에 둔 뒤, 로컬에서 보안/출처 검사를 수행한다.
- 사람이 Drive 웹/앱에서 .md를 드래그 업로드 → .md 그대로 유지된다(권장 방식).
- agent(MCP)가 text/plain으로 올리면 Google Docs로 자동 변환된다.
  → agent가 .md 원형으로 올릴 때는 반드시 disableConversionToGoogleType: true 를 준다.
- 이미 Google Docs로 변환된 파일은 다운로드 시 텍스트로 export해 .md로 되돌려 쓴다.
```

### 수정/삭제는 새로 올리기 + 수동 정리

```text
- 현재 MCP에는 파일 덮어쓰기(수정)와 삭제(휴지통) 도구가 없다.
- 내용 갱신: 새 파일 업로드 + 구파일 수동 정리. 버전은 frontmatter version으로 관리한다.
- 같은 이름이 중복되면 더 구체적인 이름으로 올리고, 오래된 파일은 사람이 정리한다.
```

### 자동화(예약/백그라운드) 제약

```text
- 대화형으로 인증된 커넥터는 cron/headless 실행에서 빠질 수 있다.
- 예약 동기화 등 무인 자동화가 필요하면 별도 서비스 계정 방식을 검토한다(1차 도입 범위 밖).
```
