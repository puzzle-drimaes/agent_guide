# 12. 운영 자동화

## 목적

수동 운영 부담을 줄이고, 지식 공유를 자동화한다.

## 자동화 후보

| 자동화 | 설명 |
|---|---|
| PR knowhow bot | PR merge 시 AI 노하우 작성 reminder |
| Weekly Slack form | 매주 금 16:00 회고 폼 발송 |
| Prompt DB sync | Slack/Notion에서 prompt 자산화 |
| Installer update check | profile/rule 업데이트 알림 |
| Usage dashboard | 계정별/profile별 사용 지표 |
| Source check reminder | 외부 자료 출처 누락 경고 |

## 우선순위

```text
1. Weekly Slack form
2. PR knowhow reminder
3. Prompt DB template
4. Installer update notification
5. Governance dashboard
```

## 1. Weekly Slack form

동작:

```text
매주 금 16:00
  → #ai-knowhow에 회고 폼 발송
  → 계정 담당자 mention
  → 제출 현황 기록
```

폼 항목:

```text
- 가장 유용했던 사례
- 실패/위험 사례
- 등록할 프롬프트
- 불편한 점
- 다음 주 실험 제안
```

## 2. PR knowhow reminder

동작:

```text
PR opened 또는 merged
  → AI 활용 노하우 section 확인
  → 비어 있으면 reminder
  → merged 후 Notion DB 후보로 기록
```

## 3. Prompt DB template

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
  → #ai-governance에 변경 알림
  → 사용자에게 update command 안내
```

예:

```bash
agent-deploy apply --target codex --profile developer
```

## 5. Governance dashboard

표시 항목:

```text
- profile별 설치 수
- OS별 설치 성공률
- 계정별 회고 제출률
- Prompt DB 등록 수
- PR knowhow 작성률
- 출처 누락 건수
```

## 완료 기준

- 주간 회고가 자동 발송된다.
- PR 노하우 누락이 자동으로 드러난다.
- Prompt DB가 실제로 재사용된다.
- installer update가 공지된다.
