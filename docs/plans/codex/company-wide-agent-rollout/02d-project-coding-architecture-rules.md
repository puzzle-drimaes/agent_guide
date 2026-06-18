# 02-D. 프로젝트 코딩 아키텍처 룰

## 목적

AI agent가 회사 개발 프로젝트에서 코드를 작성하거나 수정할 때 따를 **코딩 아키텍처 기준**을 정한다.

여기서 다루는 것은 installer 자체의 내부 구조가 아니라, 회사의 제품/서비스/앱/자동화 프로젝트에서 적용할 아키텍처 룰이다.

---

## 1. 기본 철학

아키텍처 룰의 목적은 특정 패턴 이름을 강제하는 것이 아니다.

목적은 다음이다.

```text
- 변경에 강한 코드
- 테스트 가능한 코드
- 도메인 규칙이 UI/DB/외부 API에 오염되지 않는 코드
- AI agent가 경계를 넘나들며 코드를 망가뜨리지 않게 하는 코드
- 신규 구성원이 구조를 예측할 수 있는 코드
```

따라서 회사 표준은 다음처럼 둔다.

```text
공통 원칙은 강제한다.
구체 패턴은 프로젝트 유형별 기본값을 둔다.
기존 프로젝트 구조가 있으면 기존 구조를 우선한다.
```

---

## 2. 공통 아키텍처 원칙

모든 개발 프로젝트에 적용한다.

### 2.1 의존성 방향을 지킨다

기본 원칙:

```text
안쪽 계층은 바깥 계층을 모른다.
도메인은 UI, DB, framework, 외부 API를 직접 알지 않는다.
```

권장 방향:

```text
UI / Controller / CLI
  → Application / UseCase
  → Domain

Infrastructure / DB / External API
  → Domain interface를 구현
```

금지:

```text
- domain에서 React, Express, Django, SQL client, HTTP client 직접 import
- usecase가 UI component를 import
- entity가 ORM model에 종속
- business rule이 controller/view에 숨어 있음
```

### 2.2 경계를 명시한다

코드에는 다음 경계가 드러나야 한다.

```text
presentation
application
domain
infrastructure
shared
```

프로젝트 규모가 작으면 이름을 줄일 수 있지만, 역할은 섞지 않는다.

### 2.3 DTO와 domain model을 구분한다

외부 입출력 모델과 내부 도메인 모델을 구분한다.

```text
DTO:
  API request/response, DB row, external service payload

Domain model:
  회사 업무 규칙을 표현하는 내부 모델
```

금지:

```text
- API response object를 그대로 domain 전체에 흘려보내기
- DB row shape를 UI까지 직접 전달
- 외부 API schema가 내부 business rule을 결정하게 두기
```

### 2.4 UseCase 단위로 행동을 표현한다

중요한 업무 동작은 usecase/application service로 드러낸다.

예:

```text
CreateOrder
ApproveInvoice
GenerateWeeklyReport
RegisterPromptAsset
```

금지:

```text
- controller에 업무 절차를 길게 작성
- UI event handler에 business rule 작성
- repository에 business decision 작성
```

### 2.5 Repository는 interface로 보호한다

domain/application은 저장소 구현이 아니라 interface에 의존한다.

예:

```text
PromptRepository
UserRepository
ProjectRepository
```

구현:

```text
SqlPromptRepository
NotionPromptRepository
FilePromptRepository
```

### 2.6 테스트 가능성을 기준으로 판단한다

아키텍처 경계가 잘 잡혔는지 확인하는 질문:

```text
- DB 없이 usecase를 테스트할 수 있는가?
- UI 없이 domain rule을 테스트할 수 있는가?
- 외부 API 없이 실패 케이스를 테스트할 수 있는가?
- 한 화면 수정이 domain rule을 깨지 않게 격리되어 있는가?
```

---

## 3. 프로젝트 유형별 기본 패턴

## 3.1 Backend / API / Service

기본:

```text
Clean Architecture 또는 Hexagonal Architecture
```

권장 구조:

```text
src/
  domain/
    entities/
    value-objects/
    services/
    repositories/
  application/
    usecases/
    ports/
  infrastructure/
    db/
    external/
    repositories/
  interfaces/
    http/
    cli/
    jobs/
  shared/
```

규칙:

```text
- controller는 request validation과 response mapping 중심
- usecase가 업무 흐름을 담당
- domain은 framework import 금지
- infrastructure는 domain/application interface 구현
```

## 3.2 Frontend Web

기본:

```text
Feature-based architecture
```

React/Vue/Svelte 계열에서는 MVVM을 이름 그대로 강제하지 않는다. 대신 역할을 분리한다.

권장 구조:

```text
src/
  app/
  features/
    prompt-assets/
      ui/
      model/
      api/
      hooks/
      services/
      types/
  shared/
    ui/
    lib/
    api/
```

또는 Clean Architecture 스타일:

```text
src/
  presentation/
  application/
  domain/
  infrastructure/
```

규칙:

```text
- component는 가능한 한 view 역할
- hook 또는 view-model이 UI state와 interaction 조정
- API client는 UI component에 직접 흩어두지 않음
- business rule은 service/usecase/domain으로 이동
```

## 3.3 Mobile / Desktop App

기본:

```text
MVVM + Clean Architecture
```

권장 구조:

```text
presentation/
  views/
  viewmodels/
domain/
  models/
  usecases/
  repositories/
data/
  datasources/
  repositories/
```

규칙:

```text
- View는 rendering과 user event 전달 중심
- ViewModel은 UI state와 usecase 호출 담당
- UseCase는 업무 행동 담당
- Repository interface는 domain에 둠
- Data layer가 repository 구현
```

## 3.4 CLI / Automation / Installer

기본:

```text
Command → UseCase → Port/Adapter
```

권장 구조:

```text
commands/
usecases/
domain/
adapters/
ports/
```

규칙:

```text
- command parser가 직접 파일 write 금지
- usecase가 plan을 만들고 adapter가 외부 작업 수행
- dry-run 가능해야 함
```

## 3.5 Data / ML Pipeline

기본:

```text
Pipeline stage 분리 + config/io/domain logic 분리
```

권장 구조:

```text
pipeline/
  stages/
  jobs/
domain/
  metrics/
  rules/
infrastructure/
  storage/
  serving/
config/
```

규칙:

```text
- 데이터 로딩, 전처리, 학습, 평가, 배포 단계를 분리
- metric 계산은 테스트 가능하게 분리
- config를 코드 중간에 hardcode하지 않음
```

---

## 4. AI Agent가 따라야 할 작업 규칙

### 4.1 기존 구조 우선

AI agent는 새 패턴을 강제로 도입하지 않는다.

```text
먼저 기존 프로젝트 구조를 파악한다.
기존 구조가 일관적이면 그 구조를 따른다.
불명확하거나 신규 영역이면 회사 기본 패턴을 제안한다.
```

### 4.2 아키텍처 변경은 승인 필요

다음 작업은 사용자 승인 없이 하지 않는다.

```text
- 폴더 구조 대규모 변경
- Clean Architecture로 전체 재구성
- MVVM 도입
- repository/usecase 계층 신설
- framework 교체
- public API shape 변경
```

### 4.3 작은 변경도 경계를 지킨다

버그 수정이라도 다음을 지킨다.

```text
- controller에 business rule 추가하지 않기
- component에 API 호출을 무분별하게 추가하지 않기
- domain이 infrastructure를 import하지 않기
- test 없이 계층 이동하지 않기
```

### 4.4 새 파일 생성 시 위치를 설명한다

AI agent가 새 파일을 만들면 다음을 설명해야 한다.

```text
- 어느 계층에 속하는가
- 왜 그 위치가 맞는가
- 어떤 계층에 의존하는가
- 테스트는 어디에 둘 것인가
```

---

## 5. Architecture Review Checklist

코드 리뷰 agent가 확인할 항목:

```text
- domain이 framework/infrastructure에 의존하지 않는가?
- business rule이 UI/controller에 숨어 있지 않은가?
- DTO와 domain model이 섞이지 않았는가?
- usecase가 지나치게 크거나 여러 책임을 갖지 않는가?
- repository에 business decision이 들어가지 않았는가?
- 테스트가 계층 경계를 검증하는가?
- 새 dependency가 안쪽 계층으로 침투하지 않았는가?
- 기존 프로젝트 패턴과 일관적인가?
```

---

## 6. 설치 자산으로 반영할 파일

권장 asset:

```text
assets/rules/developer/architecture.md
assets/rules/developer/backend-clean-architecture.md
assets/rules/developer/frontend-feature-architecture.md
assets/rules/developer/mobile-mvvm.md
assets/skills/architecture-review/SKILL.md
assets/agents/architecture-reviewer.md
```

권장 module:

```text
architecture-rules
architecture-review-skill
architecture-review-agent
```

권장 profile 포함:

```text
developer
sdd
security
```

---

## 7. 결정된 기본값

```text
공통 원칙:
  의존성 방향, 경계 분리, DTO/domain 구분, usecase 중심, 테스트 가능성

Backend:
  Clean Architecture 또는 Hexagonal Architecture

Frontend Web:
  Feature-based architecture
  필요 시 Clean Architecture 스타일 적용

Mobile/Desktop:
  MVVM + Clean Architecture

CLI/Automation:
  Command → UseCase → Adapter

Data/ML:
  Pipeline stage 분리
```

---

## 완료 기준

```text
- developer profile에 architecture-rules module이 포함된다.
- AI agent가 기존 프로젝트 구조를 먼저 파악하도록 rule이 있다.
- Clean Architecture/MVVM은 프로젝트 유형별 기본값으로 문서화된다.
- architecture-review skill 또는 agent가 코드 리뷰에서 계층 위반을 잡는다.
- 아키텍처 변경은 명시적 승인 없이는 수행하지 않는다는 rule이 있다.
```
