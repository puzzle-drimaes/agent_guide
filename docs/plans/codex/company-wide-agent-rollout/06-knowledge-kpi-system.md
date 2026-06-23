# 06. 지식 공유 룰과 KPI 시스템

## 목적

AI 사용 노하우가 개인 대화창 안에 갇히지 않고 회사 지식으로 자연스럽게 공유되게 한다.

## 1차 도입 방침 (2026-06-23 변경: Drive + GitHub branch 운영)

첫 도입 단계에서는 강제 절차를 두지 않는다. 핵심은 **사원들이 부담 없이 자신이 쓰던 .md(스킬/프롬프트)를 공유하고, 필요한 사람이 선택해 쓰는 문화**를 먼저 만드는 것이다.

```text
- 강제로 사용 기록을 남기게 하지 않는다.
- 회고 / 데모 / PR 노하우는 권장(best-effort)이며 의무가 아니다.
- 이 문서의 모든 KPI는 강제 목표가 아니라 참고지표다.
- 1차 도입에서는 Notion / Slack 운영은 미루고, Google Drive + GitHub branch만 사용한다.
- 예외 없이 지키는 것은 보안(금지 데이터 미입력)과 출처 표기뿐이다.
```

### 가볍게 공유하기 (먼저 도입)

```text
1. 공유 채널은 Google Drive 지정 폴더 하나로 둔다.
   - 폴더 예: AI-Knowhow/skills/, AI-Knowhow/prompts/
   - 정해진 양식 강제 없음. 단, agent가 업로드 전 최소 정제는 돕는다.
   - 올리기 전 민감정보 / credential / 고객 데이터만 제거한다.
2. 이력과 중복 관리는 GitHub branch로 한다.
   - `main`: 공식 배포본. protected branch로 운영하며 agent 직접 push 금지.
   - `prompts`: prompt 후보 수집 branch. 사원 agent가 정제 후 push 가능.
   - `skills`: skill 후보 수집 branch. 사원 agent가 정제 후 push 가능.
   - 후보 등록에는 PR을 요구하지 않는다. `main` 반영은 운영자가 필요할 때 protected merge로만 수행한다.
3. 사원들은 필요한 `.md`를 선택해 자기 프로젝트에 적용한다.
   - 기본은 `main` 기준으로 추천받는다.
   - `prompts` / `skills` branch 후보는 "검증 전 공유본"으로 표시하고 사용자 컨펌 후 적용한다.
   - 적용은 프로젝트의 `.agent-packs/externals/`에 넣고 agent가 검토/배치하게 한다
     (자세한 흐름: agent-deploy/docs/ASSET_PACKS.md).
4. 더 다듬어 표준으로 만들고 싶을 때만 수동 병합/승격 흐름으로 옮긴다
     (15-prompt-db-operations.md). 처음부터 강제하지 않는다.
```

파일명/frontmatter/검토·적용 흐름의 운영 기준은 `agent-deploy/docs/SHARED_FOLDER_GUIDE.md`에,
GitHub branch 권한 기준은 `agent-deploy/docs/GITHUB_BRANCH_POLICY.md`에 정리돼 있다.

### 운영 평가 (2026-06-23)

현재 방향은 "먼저 올리고, 필요한 사람이 고르고, 검증된 것만 승격"이라는 저마찰 루프가 명확하다는 장점이 있다. 다만 운영 문서 일부가 여전히 제출률·담당자·금지 표현 중심으로 읽혀, 공유가 자발적이라는 원칙을 약화시킬 수 있다.

개선 원칙:

```text
- 3단계로 분리한다: Drive 자유 공유 → GitHub prompts/skills 후보 축적 → protected main/company-* 승인 배포.
- 공유 폴더와 후보 branch 단계에서는 양식/기록/KPI를 강제하지 않는다.
- `main`은 branch protection/ruleset으로 직접 push를 막고, 후보 branch에서 검증된 변경만 운영자 merge로 반영한다.
- 계정 담당자와 governance는 감시자가 아니라 마중물·큐레이터 역할을 한다.
- KPI는 개인/팀 순위가 아니라 운영 건강도와 개선 후보를 보는 신호로만 사용한다.
- 강제 게이트는 보안, 출처, protected main 병합, company-* 승격에만 둔다.
```

이 공유 문화가 자리 잡은 뒤에 아래의 회고 / 데모 / 거버넌스 루틴을 **권장 수준**으로 얹는다.

## 권장 루틴 (best-effort)

아래 1~6은 강제 룰이 아니라 권장 루틴의 설명이다. 각 절의 KPI는 모두 참고지표이며 통과/실패 판정에 쓰지 않는다.
운영하면서 팀 단위로 바꿀 수 있고, 1차 도입에서는 변경 사항을 GitHub commit 또는 Drive 운영 메모에 남긴다.

```text
① 개발 PR 노하우 (개발팀 선택, 공유 asset 승인 PR 아님)
② 주간 회고 (후속 단계, 1차 도입에서는 Drive 메모로 대체 가능)
③ 월 1회 사내 데모데이 (후속 단계)
④ 분기 거버넌스 리뷰
⑤ 프롬프트 자산화 (Drive + GitHub prompts branch)
⑥ 외부 자료 출처 표기 (필수)
```

---

## 1. 개발 PR 노하우 (선택)

### 목적

개발 과정에서 얻은 AI 활용 노하우를 개발 프로젝트의 일반 Pull Request 단위로 축적한다. 이 항목은 공유 asset을 승인하기 위한 PR 운영을 뜻하지 않는다. 1차 지식 공유 운영에서는 asset 승인 PR을 만들지 않고 `prompts` / `skills` branch에 후보를 모은다.

### 개발 PR 템플릿

```md
## AI 활용 노하우

- 사용한 AI 도구:
- 사용한 profile:
- 효과 있었던 프롬프트:
- 실패했던 프롬프트:
- 다음에 재사용할 팁:
- 관련 링크:
```

### KPI

```text
- 개발 PR 중 AI 노하우 항목 작성률(참고)
- 재사용 가능한 프롬프트 후보 등록 수
- 개발 PR당 평균 AI-assisted cycle time
```

---

## 2. 주간 회고 (권장 cadence, 강제 아님)

### 운영

```text
- 1차 도입에서는 Slack을 쓰지 않고 Drive README 또는 주간 메모 `.md`로 대체할 수 있다.
- 나눌 내용이 있는 사람이 자유롭게 공유 (당번/의무 작성 아님)
- 계정 담당자는 공유 분위기를 이끄는 마중물 역할 (감시자가 아님)
- PMO 또는 AI governance 담당자가 가끔 좋은 사례를 모아 요약
- Slack 리마인더는 후속 단계에서 검토한다.
```

### 폼 항목

```text
- 이번 주 가장 유용했던 AI 사용 사례
- 실패/오답/위험했던 사례
- 새로 등록할 프롬프트
- 계정/도구 사용상 불편
- 다음 주 실험 제안
```

### KPI

```text
- 주간 Drive 메모/공유 반응 수(참고)
- 계정별 active usage(가능한 범위의 참고지표)
- 실패 사례 등록 수
- 개선 action 생성 수
```

---

## 3. 월 1회 사내 데모데이

### 운영

```text
- 월 1회 60~90분
- 계정별 또는 팀별 15분 발표
- 성공 사례뿐 아니라 실패 사례 포함
- 1차 도입에서는 발표 자료를 Drive `.md` 또는 슬라이드로 저장한다.
- Notion 저장은 후속 단계에서 검토한다.
```

### KPI

```text
- 데모 발표 수
- 발표 후 재사용된 프롬프트 수
- 타팀 확산 사례 수
```

---

## 4. 분기 거버넌스 리뷰

### 검토 항목

```text
- 9개 계정 배분이 적절한가?
- 사용량이 낮은 계정은 왜 낮은가?
- 새 AI 도구를 추가할 필요가 있는가?
- 보안 사고/위험 사례가 있었는가?
- installer profile을 수정해야 하는가?
- 삭제해야 할 prompt/rule이 있는가?
```

### KPI

```text
- 계정별 사용률
- profile별 설치 수
- 등록 prompt 재사용률
- AI 관련 보안/출처 위반 건수
- 업무 시간 절감 추정치
```

---

## 5. 프롬프트 자산화

> 운영 기준(필드 타입/등록·승격 기준/owner·reviewer 역할/상태 전이)은
> [15-prompt-db-operations.md](15-prompt-db-operations.md)에 구체화돼 있다.

### GitHub frontmatter / 이후 Notion 전환 필드

```text
- 이름
- 목적
- 대상 직무
- AI 도구
- 권장 profile
- 프롬프트 본문
- 입력 예시
- 출력 예시
- 성공률
- 사용 횟수
- 작성자
- 최종 수정일
- 출처/라이선스
```

### KPI

```text
- 등록 prompt 수
- 월간 재사용 횟수
- 성공률 태깅 비율
- deprecated prompt 정리 수
```

---

## 6. 외부 자료 출처 표기

### 필수 항목

```text
- 제목
- URL
- 작성자/기관
- 접근일
- 라이선스
- 어떤 부분을 참고했는지
```

### KPI

```text
- 외부 자료 포함 산출물 중 출처 표기율
- 라이선스 미확인 자료 수
- 출처 누락 수정 건수
```

## 완료 기준

- Drive + GitHub `main`/`prompts`/`skills` branch 운영 기준이 정리된다.
- 개발 PR 노하우 항목은 선택 운영으로 분리된다.
- prompt/skill 후보 frontmatter 템플릿이 있다.
- 운영 건강도 대시보드 초안이 있다.
