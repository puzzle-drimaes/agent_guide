# 13. Governance와 Roadmap

## 목적

초기 룰을 고정된 정답으로 보지 않고, 회사에 맞게 계속 바꾼다.

## 분기 Governance Review

### 검토 안건

```text
1. 계정 재배분
2. profile별 사용량
3. prompt DB 품질
4. 실패 사례 분석
5. 보안/출처 위반 검토
6. 신규 AI 도구 추가 여부
7. installer 개선 사항
8. 폐기할 rule/prompt 결정
```

### 의사결정 예시

```text
- 사용률 낮은 계정은 다른 팀에 재배정
- 중복 prompt는 통합
- 위험한 MCP는 기본 profile에서 제거
- developer profile에 새 review skill 추가
- business profile의 말투 rule 수정
```

## RACI 초안

| 업무 | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Agent installer 개발 | 개발 리드 | CTO/기술 책임 | PMO | 전 직원 |
| Profile/rule 정의 | AI governance | PMO | 각 팀 리드 | 전 직원 |
| 공용 계정 배분 | PMO | 경영진 | 팀 리드 | 전 직원 |
| 보안 기준 | 보안/개발 리드 | CTO | PMO | 전 직원 |
| 주간 회고 운영 | 계정 담당자 | PMO | 팀원 | #ai-knowhow |
| 데모데이 | PMO | 경영진 | 계정 담당자 | 전 직원 |
| 분기 리뷰 | PMO | 경영진 | 팀 리드 | 전 직원 |

## KPI 대시보드

### Adoption

```text
- 전체 직원 중 installer 설치율
- profile별 설치 수
- OS별 설치 성공률
- target별 설치 수
```

### Usage

```text
- 계정별 active usage
- 주간 회고 제출률
- 데모데이 발표 수
- prompt DB 등록 수
```

### Quality

```text
- PR knowhow 작성률
- prompt 재사용률
- 실패 사례 등록 수
- 출처 표기율
- 보안/민감정보 위반 건수
```

### Business Impact

```text
- 반복 업무 시간 절감 추정
- PR cycle time 변화
- 문서 작성 리드타임 변화
- CS 응답 초안 작성 시간 변화
```

## 30/60/90일 Roadmap

### 30일

```text
- 공통 원칙 확정
- minimal/developer/product/business profile 초안 작성
- Codex/Claude target installer MVP
- Pilot 2주 운영
- 첫 weekly 회고 실행
```

### 60일

```text
- Gemini target 추가
- 비개발자 설치 가이드 완성
- Prompt DB 운영 시작
- PR knowhow template 적용
- 첫 데모데이 진행
```

### 90일

```text
- 분기 governance review 진행
- 계정 재배분
- profile/rule v2 배포
- usage dashboard 초안
- 신규 AI 도구 추가 여부 결정
```

## Risk와 대응

| Risk | 설명 | 대응 |
|---|---|---|
| 공용 계정 책임 불명확 | 누가 관리하는지 모름 | 계정별 초기 담당자 지정 |
| 개인 노하우 은닉 | 좋은 프롬프트가 공유되지 않음 | weekly 회고와 prompt DB KPI |
| 비개발자 설치 실패 | CLI 사용 어려움 | OS별 한 줄 설치, doctor 명령 |
| 도구별 동작 차이 | Claude/Codex/Gemini가 다르게 행동 | 공통 rule + target adapter |
| 보안 정보 입력 | 고객정보/credential 입력 위험 | security rule + 교육 + reminder |
| 프롬프트 DB 오염 | 품질 낮은 prompt 누적 | 월간 정리, 성공률 태깅 |
| 룰 과잉 | 사용자가 부담을 느낌 | 분기 리뷰에서 삭제 가능 |
| 계정 수 부족 | 20명이 9개 계정 공유 | 계정별 용도 분리, 사용률 기반 재배분 |

## 완료 기준

- 변경 사항이 `#ai-governance`에 공유된다.
- manifest/profile/rule 변경 PR이 생성된다.
- 다음 분기 실험 항목이 정해진다.
- 30/60/90일 로드맵이 실제 backlog로 연결된다.
