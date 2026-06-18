# Spec Driven Development Rules

## 목적

작업자가 매번 QnA로 멈추지 않아도 agent가 작업 지시를 해석하고 적절한 깊이의 개발 프로세스로 진행하게 한다.

`SDD-none`, `SDD-lite`, `SDD-full`은 서로 다른 방법론이 아니다. 같은 흐름을 공유하되 중간 단계와 산출물의 깊이만 다르다.

## 공통 원칙

- 모든 작업은 agent가 먼저 SDD mode를 판단한다.
- 기본은 질문하지 않고 합리적 가정을 명시한 뒤 진행한다.
- 사용자가 명시적으로 mode를 지정하면 그 지시를 우선한다.
- 작업 중 영향 범위가 커지면 `none → lite → full`로 승격한다.
- 파괴적 작업, 보안/credential, 비용 발생, 외부 배포, 요구사항 충돌은 예외적으로 확인 질문을 한다.

## 공통 단계

모든 mode는 같은 단계 체계를 공유한다.

```text
A. Analyze       작업 지시 해석 / mode 판단
B. Discover      관련 구조, 정책, 제약 확인
C. Criteria      실행 기준, 성공 기준, 영향 범위 정리
D. Design        구조, 대안, 경계 설계
E. Tasks         작업 단위 분해
F. Implement     실제 변경
G. Verify        테스트, diff, 규칙 위반 확인
H. Review        리뷰, 리스크, 회고
Z. Report        결과 보고 / 기록
```

항상 존재해야 하는 단계:

```text
A. Analyze
C. Criteria
Z. Report
```

## SDD-none

흐름:

```text
A → C → Z
```

대상:

- 단순 질문 답변
- 오타 수정
- 아주 작은 문서 표현 수정
- 영향 없는 파일명/링크 정리

규칙:

- 별도 spec 파일을 만들지 않는다.
- 긴 계획을 쓰지 않는다.
- 결과 보고는 반드시 한다.

## SDD-lite

흐름:

```text
A → C → E → F → G → Z
```

대상:

- 작은 rule 문서 보강
- TODO/Finish 업데이트
- 명확한 버그 수정
- 기존 구조 안의 작은 기능 변경
- 영향 범위가 제한된 설정 변경

규칙:

- 별도 `requirements.md`, `design.md`는 만들지 않는다.
- 간단한 작업 계획과 검증은 수행한다.
- 변경 후 diff 또는 파일 목록을 확인한다.

## SDD-full

흐름:

```text
A → B → C → D → E → F → G → H → Z
```

대상:

- 신규 adapter 구현
- installer lifecycle 설계
- 배포 asset 구조 변경
- 아키텍처 변경
- 여러 사람이 이어받을 큰 작업
- 보안/운영/배포 영향이 큰 작업

권장 산출물:

```text
docs/specs/<feature-name>/requirements.md
docs/specs/<feature-name>/design.md
docs/specs/<feature-name>/tasks.md
docs/specs/<feature-name>/review.md
```

규칙:

- 구현 전 requirements/design/tasks를 정리한다.
- review는 spec 충족 여부 기준으로 수행한다.
- 후속 작업과 리스크를 남긴다.

## 자동 mode 판단 기준

| 조건 | mode |
|---|---|
| 답변만 필요하거나 영향 없는 작은 수정 | none |
| 한두 파일 수준의 문서/룰/설정 보강 | lite |
| 기존 구조 안의 명확한 작은 코드 변경 | lite |
| 신규 module/adapter/배포 구조 변경 | full |
| architecture, security, install-state, target parity 영향 | full |
| 여러 사람이 이어받을 가능성이 높음 | full |

## 승격 규칙

작업 중 아래가 발견되면 mode를 승격한다.

- 새 모듈이나 adapter가 필요하다.
- 여러 target harness에 영향을 준다.
- install-state, 보안, 배포, rollback에 영향을 준다.
- 요구사항이 불명확해 설계 문서가 필요하다.
- 변경 범위가 예상보다 커진다.

## Report 형식

결과 보고에는 최소 아래를 포함한다.

```text
SDD mode:
변경 요약:
검증:
남은 일:
```
