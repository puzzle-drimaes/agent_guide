# 11. 전사 Rollout

## 목적

Pilot에서 검증된 installer와 운영 룰을 전 직원에게 배포한다.

## Rollout 순서

```text
1. Drive/사내 게시판 공지
2. 설치 가이드 배포
3. 전 직원 교육
4. 직무별 profile 설치
5. AI 계정 담당자 지정 확인
6. 첫 주 회고 수집
7. blocker hotfix
```

## 공지 포함 내용

```text
- 도입 목적
- 설치 링크
- 본인에게 맞는 profile 선택표
- 공용 계정 사용 원칙
- 보안 주의사항
- 문의 채널
- 첫 주에 해야 할 일
```

## 첫 주 운영

매일 확인:

```text
- 설치 실패
- 권한 문제
- target별 동작 차이
- 비개발자 혼란 지점
- 공용 계정 충돌
- 보안/출처 관련 질문
```

운영 방식:

```text
- 매일 10분 triage
- 담당자 기반 문의 대응
- 설치 실패 케이스 수집
- profile별 혼란 지점 정리
- 필요한 hotfix 배포
```

## Rollout 체크리스트

```text
- installer package 배포 완료
- docs/install-guide.md 배포
- docs/non-developer-guide.md 배포
- profile 선택표 배포
- 9개 계정 담당자 확정
- Drive 운영 메모와 문의 담당자 준비
- Prompt DB 오픈
- weekly 회고 폼 예약
```

## 첫 주 KPI

```text
- installer 설치율
- profile별 설치 수
- OS별 설치 성공률
- target별 설치 성공률
- 문의/지원 요청 수
- 공유 폴더 .md 수 / 재사용 사례 수 (참고지표, 회고 제출률 대체)
```

## 완료 기준

- 80% 이상 설치 완료
- 9개 계정 모두 담당자 지정
- 첫 주 회고 1회 완료
- critical 보안/운영 이슈 없음
- hotfix 필요 사항이 backlog에 정리됨
