# Knowledge Sharing Rules

## 목적

공용 AI 계정의 핵심 목적은 비용 절감보다 지식 공유화다.

## 운영 원칙

기록을 강제하지 않는다. 부담 없는 공유를 먼저 만들고, 검증된 것만 표준 asset으로 승격한다.

1차 도입에서는 실시간 메신저/Notion 운영을 제외하고 Google Drive + GitHub branch만 사용한다.

```text
Google Drive              →  GitHub prompts/skills branch  →  GitHub main / company-* asset
사람/agent 공유 채널        후보 수집·이력 관리              공식 배포·승격
```

## Branch 정책

```text
main
  - 공식 배포본
  - 검증/정리된 prompt, skill만 포함
  - agent 직접 push 금지
  - 운영자가 필요할 때 수동 병합

prompts
  - prompt 공유 후보 수집 branch
  - 사원 agent가 정제 후 commit/push 가능
  - 아직 공식 asset 아님

skills
  - skill 공유 후보 수집 branch
  - 사원 agent가 정제 후 commit/push 가능
  - 아직 공식 asset 아님
```

## 기본 루프 (1차 도입: 강제 아님, 권장)

1. 공유하고 싶은 스킬/프롬프트 `.md`는 agent가 먼저 정제한다.
2. agent는 민감정보 제거, 출처 표기, frontmatter/한 줄 설명, 파일명 충돌 회피를 돕는다.
3. 정제된 `.md`는 Google Drive 공유 폴더에 올린다.
4. prompt는 GitHub `prompts` branch, skill은 `skills` branch에 commit/push한다.
5. 다른 사람이 후보 branch 자료를 적용할 때는 "검증 전 공유본"이라고 표시하고 사용자 컨펌을 받는다.
6. 충분히 검증되면 운영자가 `main`으로 수동 병합하거나 company-* asset/skill로 승격한다.
7. 설치/사용 피드백은 agent가 `.md`로 정리해 Google Drive `AI-Knowhow/feedback/` 업로드를 먼저 제안한다.

## 단계별 게이트

- Drive 공유: 양식은 권장만 한다. 단, 민감정보 제거와 출처 표기는 지킨다.
- 후보 branch: agent push 가능. 단, `main` 직접 push, force-push, 기존 파일 무단 overwrite는 금지한다.
- 적용: 후보 branch 자료는 요약/diff/충돌 여부를 보여준 뒤 사용자 확인을 받는다.
- main 병합/승격: 사용 횟수/사용자 수/성공률/owner/reviewer 확인 후 수동으로 진행한다.

## 예외 없이 지키는 것

- 보안: 금지 데이터(고객 개인정보 / credential / token 등) 미입력·미업로드.
- 출처: 외부 자료는 source attribution rule에 맞춰 기록.
- branch: agent는 `main`에 직접 push하지 않음.
- 승격: 검증되지 않은 프롬프트를 공식 배포본 또는 company-* 표준 asset처럼 안내하지 않음.

## Agent가 도와야 할 일

- 사용자가 원하거나 재사용 가치가 분명할 때만 노하우를 한 줄로 요약 제안한다 (강제 아님).
- 공유 폴더에 올릴 `.md` 후보가 있으면 민감정보 제거를 돕고 정리한다.
- 설치 오류, 사용 불편, 개선 제안, 좋은 사례는 사용자 확인 후 피드백 `.md`로 정리해 `feedback/` 업로드를 유도한다.
- prompt 후보는 `prompts` branch, skill 후보는 `skills` branch에만 commit/push하도록 안내한다.
- 후보 branch 자료를 적용할 때는 검증 전 공유본임을 알리고 요약/diff/충돌 여부를 제시한다.
- main 병합 또는 company-* 승격 후보는 보안/출처/owner/reviewer/checklist 충족 여부를 확인한다.
- 출처가 있는 지식은 source attribution rule에 맞춰 기록한다.
