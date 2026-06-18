# Software Architecture Rules

## 목적

AI agent가 회사 개발 프로젝트에서 코드를 작성하거나 수정할 때 따를 코딩 아키텍처 기준이다.

특정 패턴 이름을 무조건 강제하는 것이 아니라, 변경에 강하고 테스트 가능한 경계를 유지하는 것이 목적이다.

## 공통 원칙

1. 의존성 방향을 지킨다.
   - 안쪽 계층은 바깥 계층을 모른다.
   - domain/application은 UI, DB, framework, HTTP/SQL client를 직접 알지 않는다.

2. 경계를 명시한다.
   - presentation/interface
   - application/usecase
   - domain/policy
   - infrastructure/adapter
   - shared

3. DTO와 domain model을 구분한다.
   - API/DB/external payload는 DTO다.
   - 업무 규칙은 domain model/usecase에 둔다.

4. 중요한 행동은 UseCase로 표현한다.
   - controller, CLI handler, UI event handler에 업무 절차를 길게 쓰지 않는다.

5. repository/external dependency는 interface로 보호한다.
   - application/domain은 concrete store나 external client에 직접 의존하지 않는다.

6. 테스트 가능성을 기준으로 판단한다.
   - DB 없이 usecase를 테스트할 수 있어야 한다.
   - UI 없이 domain rule을 테스트할 수 있어야 한다.
   - 외부 API 없이 실패 경로를 테스트할 수 있어야 한다.

## 프로젝트 유형별 기본값

- Backend/API/Service: Clean Architecture 또는 Hexagonal Architecture.
- Frontend Web: Feature-based architecture.
- Mobile/Desktop: MVVM + Clean Architecture.
- CLI/Automation/Installer: Command → UseCase → Adapter.
- Data/ML: pipeline stage separation + config/io/domain split.

## agent-deploy 작업 규칙

`agent-deploy/`는 installer core다. 다음 구조를 지향한다.

```text
interfaces/cli
  → application/usecases
  → domain/policies
  → infrastructure/target-adapters, file-system-adapters
```

현재 skeleton에서는 완전한 폴더 분리를 즉시 강제하지 않는다. 다만 새 기능을 추가할 때는 다음을 지킨다.

- CLI는 argument parsing과 결과 표시 중심으로 둔다.
- install plan 생성은 planner/usecase 성격으로 둔다.
- 파일 쓰기, merge, target별 변환은 adapter/helper로 격리한다.
- target adapter는 Claude/Codex/Gemini 차이를 흡수한다.
- dry-run, install-state, path-safety, symlink guard를 우회하지 않는다.
- 큰 구조 변경은 사용자 승인 또는 계획 문서 갱신 후 진행한다.

## Architecture review checklist

- domain/application이 infrastructure를 import하지 않는가?
- 업무 규칙이 CLI/UI/controller에 숨어 있지 않은가?
- DTO가 domain 전역으로 흐르지 않는가?
- target별 분기가 core usecase에 과도하게 들어오지 않았는가?
- 새 파일의 계층과 테스트 위치가 설명 가능한가?
- 기존 프로젝트 구조와 충돌하지 않는가?

