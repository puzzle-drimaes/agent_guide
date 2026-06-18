# 01. 공통 원칙과 범위 정의

## 목적

도구별 기능보다 먼저 전사 공통 AI 사용 원칙을 정의한다. 이 단계가 확정되어야 profile, installer, 교육, governance가 같은 방향으로 설계된다.

## 대상

- 전 직원
- 공용 AI 계정 9개
- Claude, Codex, Gemini
- Windows, macOS, Linux
- 개발/비개발 모든 업무

## 수행 작업

### 1. 전사 AI 사용 원칙 작성

작성 위치:

```text
agent-deploy/assets/rules/common/company-ai-principles.md
```

포함 내용:

```text
- AI는 개인 비서가 아니라 회사 지식 축적 도구다.
- 공용 계정에서 얻은 좋은 사례는 개인에게 묶어두지 않는다.
- 반복 가능한 프롬프트와 workflow는 자산화한다.
- 중요한 산출물은 사람이 최종 검토한다.
- 도구가 달라도 plan/review/evidence/knowledge capture 흐름은 동일하다.
```

### 2. 보안 원칙 작성

작성 위치:

```text
agent-deploy/assets/rules/common/security.md
```

포함 내용:

```text
- 고객 개인정보 입력 금지
- 계약 정보와 민감한 재무 정보 입력 금지
- API key, token, password, private key 입력 금지
- 사내 비공개 문서는 사용 가능 범위와 도구별 보관 정책 확인 후 입력
- AI 결과물은 사람이 검토 후 사용
```

### 3. 외부 자료 출처 표기 원칙 작성

작성 위치:

```text
agent-deploy/assets/rules/common/source-attribution.md
```

필수 기록 항목:

```text
- 제목
- URL
- 작성자/기관
- 접근일
- 라이선스
- 어떤 부분을 참고했는지
```

### 4. 지식 공유 원칙 작성

작성 위치:

```text
agent-deploy/assets/rules/common/knowledge-sharing.md
```

포함 내용:

```text
- 1 PR = 1 노하우
- 매주 금 16:00 회고
- 월 1회 사내 데모데이
- 분기 거버넌스 리뷰
- 프롬프트 자산화
- 외부 자료 출처 표기
```

### 5. 범위 명확화

초기 범위:

```text
- 공통 rules 배포
- profile별 skills/prompts 배포
- Codex/Claude/Gemini target 지원
- install-state 기록
- 주간 회고와 Prompt DB 운영
```

초기 범위 제외:

```text
- 모든 AI 도구 완전 지원
- 완전 자동 계정 사용량 추적
- 민감정보 자동 탐지의 100% 보장
- 모든 workflow 자동화
```

## 회의 안건

1. 공용 AI 계정의 주 목적이 “지식 공유화”라는 데 동의하는가?
2. 직원이 반드시 따라야 할 최소 rule은 무엇인가?
3. 비개발자에게도 동일하게 요구할 rule은 무엇인가?
4. 외부 자료 출처 표기 수준은 어느 정도로 할 것인가?
5. AI 사용 금지 데이터 범위는 무엇인가?

## 산출물

```text
assets/rules/common/company-ai-principles.md
assets/rules/common/security.md
assets/rules/common/source-attribution.md
assets/rules/common/knowledge-sharing.md
docs/account-sharing-policy.md
docs/governance.md
```

## 완료 기준

- 경영/PMO/개발 리드가 공통 원칙에 동의한다.
- `minimal` profile에 들어갈 기본 rule이 확정된다.
- 계정 공유의 목적이 비용 절감이 아니라 지식 공유화임을 설명할 수 있다.
- 금지 데이터와 출처 표기 기준이 문서화되어 있다.
