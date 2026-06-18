# CLAUDE.md — agent_guide 프로젝트 작업 규칙

Claude는 이 프로젝트에서 `AGENTS.md`와 동일한 방향으로 작업한다.

## 먼저 읽을 파일

```text
AGENTS.md
TODO.md
Finish.md
docs/report.html
```

## Canonical rule source

개발 룰 원본은 `.agents/rules/` 아래에 있다.

```text
.agents/rules/common/
.agents/rules/developer/
```

Claude 전용 판단이 필요하더라도 원본 룰의 의미를 바꾸지 않는다. 룰을 변경해야 하면 `.agents/rules/`를 먼저 수정한다.

## 핵심 규칙

- project scope 기본, user/global scope 옵션.
- `agent-deploy/`를 installer core로 확장.
- target별 차이는 adapter로 흡수.
- 하네스 엔지니어링은 `.agents/rules/developer/harness-engineering.md` 기준.
- 개발 아키텍처는 `.agents/rules/developer/architecture.md` 기준.
- commit message는 `.agents/rules/developer/git-commit-convention.md` 기준.
- 민감정보 입력/저장 금지.
- 외부 자료 사용 시 출처/라이선스 기록.
