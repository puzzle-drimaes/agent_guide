# 02-E. Git Commit Convention 계획

## 목적

사람과 AI agent가 동일한 Git commit message convention을 따르도록 회사 표준을 정의하고, installer profile과 hook/agent rule에 반영한다.

현재 문서에는 `conventional commit` 수준의 언급만 있었고, Jira 링크와 본문 구조까지 포함한 상세 규칙은 없었다. 따라서 아래 규칙을 회사 표준으로 추가한다.

---

## 1. 채택할 Commit Message Convention

## 1.1 메시지 구조

```text
[type] 제목 (기능 수정 내용을 요약)

1. 내용
- 버그 수정: 버그 현상 설명
- 기능 추가: 요구사항 설명

2. 수정 내역
- 수정한 기능에 대해 작성 (함수, 변수, 클래스 등)

3. 영향도
- 기존 코드 및 기능에 미치는 영향

jira : https://<YOUR_SPACE>.atlassian.net/browse/{TICKET-KEY}
```

## 1.2 Commit 라인 타입

| 타입 | 설명 |
|---|---|
| `feat` | 새로운 기능 추가 / 기능 수정 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링, 기능 변화 없음 |
| `chore` | 설정, 빌드, 패키지 등 기능 외적인 작업 |
| `docs` | 문서 작성 또는 수정 |
| `test` | 테스트 코드 추가/수정 |

## 1.3 작성 규칙

```text
1. 타입은 대괄호([])로 감싼다.
2. 타입 뒤에 한 칸 띄우고 제목을 작성한다.
3. 제목은 한글로 간결하게 작성한다.
4. 제목과 본문 사이에는 빈 줄을 둔다.
5. 본문은 번호 매기기로 구분한다.
   - 1. 내용
   - 2. 수정 내역
   - 3. 영향도
6. 마지막에 Jira 티켓 링크를 반드시 적는다.
```

---

## 2. 예시

### 2.1 버그 수정

```text
[fix] 건너뛴 목적지 표출 안되는 오류 수정

1. 내용
- 경로 탐색 후 건너뛴 목적지 버튼이 표시되지 않는 현상

2. 수정 내역
- RouteResultFragment.updateOppositeDestination() 조건문 수정
- isOppositeAvailable 플래그 초기화 로직 추가

3. 영향도
- 경로 결과 화면에만 영향
- 기존 목적지 설정 로직에는 영향 없음

jira : https://<YOUR_SPACE>.atlassian.net/browse/E51K-XXX
```

### 2.2 기능 추가

```text
[feat] 경유지 추가 시 경로 재탐색 기능 구현

1. 내용
- 경로 편집 화면에서 경유지 추가 시 자동으로 경로 재탐색 요청

2. 수정 내역
- RouteEditViewModel.addWaypoint() 함수 추가
- RouteRepository.requestRouteWithWaypoints() 구현
- WaypointAdapter 리스트 갱신 로직 추가

3. 영향도
- 경로 편집 화면 전체에 영향
- 기존 경로 탐색 API 호출 방식 변경 없음

jira : https://<YOUR_SPACE>.atlassian.net/browse/E51K-XXX
```

### 2.3 리팩토링

```text
[refactor] RouteManager를 UseCase 패턴으로 분리

1. 내용
- Clean Architecture 적용을 위한 RouteManager 리팩토링

2. 수정 내역
- GetRouteUseCase, SetDestinationUseCase 클래스 생성
- RouteRepository 인터페이스 정의
- RouteManager 의존성 제거

3. 영향도
- 경로 관련 모든 화면에서 UseCase 주입 방식으로 변경
- 기능 동작은 동일

jira : https://<YOUR_SPACE>.atlassian.net/browse/E51K-XXX
```

---

## 3. AI Agent 적용 규칙

AI agent는 commit 또는 PR 작성 시 다음을 따른다.

```text
- commit message는 반드시 회사 commit convention 형식으로 작성한다.
- Jira 티켓 키가 없으면 사용자에게 확인한다.
- Jira 티켓 키가 없는 상태에서 임의 키를 만들지 않는다.
- 변경 내용이 여러 type에 걸치면 가장 중요한 목적 기준으로 type을 고른다.
- 기능 변경과 리팩토링이 함께 있으면 가능하면 commit을 분리한다.
- 영향도는 실제 변경 범위를 기준으로 보수적으로 작성한다.
```

## 3.1 Jira 티켓 처리

원칙:

```text
Jira 링크 필수.
```

예외가 필요한 경우:

```text
- 문서 초안
- spike/prototype
- 긴급 hotfix
- 내부 agent 설정 변경
```

예외 정책은 별도로 결정해야 한다.

권장 예외 표기:

```text
jira : N/A (사유: 내부 문서 초안)
```

단, 이 예외는 팀 합의 후 허용한다.

## 3.2 Commit 분리 기준

AI agent는 다음 경우 commit 분리를 제안해야 한다.

```text
- 기능 추가와 리팩토링이 섞임
- 테스트 추가와 실제 구현이 지나치게 큼
- 문서 변경과 코드 변경이 독립적임
- 여러 Jira 티켓 변경이 한 commit에 섞임
```

---

## 4. Installer Asset 반영 계획

## 4.1 Rule 파일

생성할 asset:

```text
assets/rules/developer/git-commit-convention.md
```

포함 내용:

```text
- 메시지 구조
- 허용 type
- Jira 링크 필수
- 예시
- AI agent commit 작성 규칙
```

## 4.2 Skill 파일

생성 후보:

```text
assets/skills/commit-message-writer/SKILL.md
```

역할:

```text
- diff와 Jira ticket을 바탕으로 commit message 초안 작성
- 변경 type 추천
- 영향도 문장 작성
- convention 위반 여부 점검
```

## 4.3 Hook 파일

생성 후보:

```text
assets/hooks/commit-msg/validate-company-commit.js
```

검증:

```text
- 첫 줄이 `[feat|fix|refactor|chore|docs|test] 제목` 형식인지
- `1. 내용`, `2. 수정 내역`, `3. 영향도`가 있는지
- 마지막에 `jira : https://.../browse/...`가 있는지
- 제목이 비어 있지 않은지
```

초기 정책:

```text
Pilot:
  warning

전사 rollout 이후:
  required 또는 repo별 선택
```

---

## 5. Profile 반영

추가 module:

```text
commit-convention-rules
commit-message-skill
commit-msg-hook
```

profile 포함:

```text
developer:
  commit-convention-rules
  commit-message-skill

sdd:
  commit-convention-rules
  commit-message-skill

governance:
  commit-convention-rules

optional:
  commit-msg-hook
```

`minimal`에는 포함하지 않는다. 비개발자에게는 PR/commit 규칙이 직접 필요하지 않을 수 있다.

---

## 6. 검증 계획

## 6.1 정규식 검증 초안

첫 줄:

```regex
^\[(feat|fix|refactor|chore|docs|test)\] .+
```

본문 필수 섹션:

```regex
^1\. 내용
^2\. 수정 내역
^3\. 영향도
```

Jira:

```regex
^jira : https://.+\.atlassian\.net/browse/[A-Z][A-Z0-9]+-\d+
```

프로젝트별 Jira key가 `E51K-XXX`처럼 숫자가 아닌 placeholder를 사용할 수 있다면 실제 hook 정규식은 회사 Jira key 규칙 확정 후 조정한다.

## 6.2 테스트 케이스

```text
- 정상 feat 메시지 통과
- 정상 fix 메시지 통과
- type 대괄호 누락 실패
- 본문 섹션 누락 실패
- Jira 링크 누락 실패
- 허용되지 않은 type 실패
- 제목 빈 값 실패
- 예외 정책 N/A 허용 여부 테스트
```

---

## 7. Rollout 단계

### Phase 1: 문서화

```text
- commit convention rule 문서 작성
- developer profile에 포함
- AI agent가 commit 작성 시 참조하게 함
```

### Phase 2: Skill 추가

```text
- commit-message-writer skill 추가
- PR/commit 전 diff 기반 메시지 초안 작성 지원
```

### Phase 3: Soft validation

```text
- commit-msg hook을 warning 모드로 배포
- 위반 사례 수집
- Jira 예외 정책 정리
```

### Phase 4: Required validation

```text
- 팀 합의 후 required 모드 전환
- CI 또는 git hook에서 검증
- emergency bypass 정책 정의
```

---

## 8. 결정 필요

아래 항목은 `00-open-decisions.md`와 함께 확정해야 한다.

```text
- Jira space URL
- 기본 Jira project key
- Jira 없는 commit 예외 허용 여부
- merge commit/squash commit 적용 방식
- hook 강제 시점
- emergency bypass 방식
```

---

## 완료 기준

```text
- developer profile에 commit convention rule이 포함된다.
- AI agent가 commit message를 회사 형식으로 작성한다.
- Jira 티켓이 없으면 agent가 사용자에게 확인한다.
- commit-message-writer skill이 제공된다.
- commit-msg hook warning 모드가 Pilot에서 동작한다.
- 전사 rollout 전 required 전환 여부가 결정된다.
```
