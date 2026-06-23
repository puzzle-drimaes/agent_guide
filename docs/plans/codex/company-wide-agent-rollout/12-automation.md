# 12. 운영 자동화

## 목적

수동 운영 부담을 줄이고, 지식 공유를 거들어준다.

## 1차 도입 방침 (2026-06-23)

1차 도입에서는 **회고/노하우 작성을 자동으로 강제·추적하지 않는다.** 자동화는 Google Drive + GitHub branch 흐름을 쉽게 만드는 쪽만 먼저 한다. Notion/Slack 자동화는 후속 단계로 미룬다.

```text
- 먼저: 공유 폴더(Google Drive) 업로드 안내, 신규 .md 알림, GitHub prompts/skills branch commit 보조.
- 나중에: 회고 폼/PR 노하우 reminder는 강제 발송·제출률 추적 없이 가벼운 권유 수준으로만.
- 제출률/작성률은 KPI 목표가 아니라 참고지표다(D12 강등).
```

## 자동화 후보

| 자동화 | 설명 |
|---|---|
| PR 공유 문서 bot | PR merge 시 AI 노하우 작성 reminder |
| Weekly reminder | Drive 운영 메모 기반의 가벼운 회고 권유(후속: Slack) |
| Candidate branch sync | Drive 업로드본을 GitHub prompts/skills branch 후보로 기록 |
| Installer update check | profile/rule 업데이트 알림 |
| Usage dashboard | 계정별/profile별 사용 지표 |
| Source check reminder | 외부 자료 출처 누락 경고 |

## 우선순위 (1차 도입 기준 재정렬)

```text
1. 공유 폴더 운영 보조 (업로드 안내 / 신규 .md 알림)
2. Installer update notification
3. Candidate frontmatter template (반복 사용분 정리용)
4. PR 공유 문서 reminder (가벼운 권유, 강제 아님)
5. Weekly reminder (가벼운 리마인더, 제출률 추적 없음; Slack은 후속)
6. Governance dashboard (참고지표 위주)
```

## 1. Weekly reminder (가벼운 리마인더)

동작:

```text
주 1회 (권장 cadence)
  → Drive 운영 메모에 "나눌 내용 있으면 공유해요" 가벼운 리마인더
  → 개인 mention / 당번 지정 / 제출 현황 추적 없음
  → 나온 좋은 사례만 가끔 모아 요약
```

폼 항목:

```text
- 가장 유용했던 사례
- 실패/위험 사례
- 등록할 프롬프트
- 불편한 점
- 다음 주 실험 제안
```

## 2. PR 공유 문서 reminder (가벼운 권유)

동작:

```text
PR opened 또는 merged
  → AI 활용 노하우 section은 선택 입력 (필수 아님, merge 차단 안 함)
  → 공유할 게 있으면 적도록 가볍게 권유
  → 적은 내용은 공유 폴더 / GitHub 후보 branch에만 기록
```

## 3. Candidate frontmatter template

초기에는 수동 등록으로 시작하고, 이후 자동화한다.

필드:

```text
name
purpose
role
tool
profile
prompt
input example
output example
success rate
usage count
source/license
owner
```

## 4. Installer update notification

동작:

```text
profile/rule 변경 PR merge
  → Drive 운영 메모 또는 GitHub commit으로 변경 알림
  → 사용자에게 update command 안내
```

예:

```bash
agent-deploy apply --target codex --profile developer
```

## 5. Governance dashboard

표시 항목 (참고지표 위주, 개인 추적/순위 매기기 아님):

```text
- profile별 설치 수
- OS별 설치 성공률
- 공유 폴더 .md 수 / 재사용 사례 수
- prompts/skills branch 후보 등록 수
- 출처 누락 건수
```

## 완료 기준

- 공유 폴더 업로드/적용이 쉽게 일어나도록 보조된다.
- installer update가 공지된다.
- (선택) 가벼운 회고 리마인더와 PR 노하우 권유가 동작한다.
- prompts/skills branch 후보와 main 공식본이 실제로 재사용된다.
