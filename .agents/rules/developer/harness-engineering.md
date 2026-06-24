# Harness Engineering Rules

## 목적

Claude, Codex, Gemini, Cursor, Kiro 등 서로 다른 AI 도구가 같은 회사 방향성과 기술 규칙으로 일하게 만드는 규칙이다.

여기서 harness는 AI 도구가 실제로 읽고 실행하는 설정 표면을 뜻한다.

예:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
.agents/
.claude/
.codex/
.gemini/
.kiro/
commands/
skills/
rules/
MCP config
```

## 핵심 원칙

### 1. Canonical source first

원본 규칙은 하나의 기준 위치에서 관리한다.

현재 프로젝트 기준:

```text
.agents/rules/
```

도구별 파일은 원본 규칙의 adapter surface다. `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`를 서로 다르게 진화시키지 않는다.

### 2. Adapter per harness

도구별 차이는 adapter가 흡수한다.

```text
canonical rule
  → Codex adapter: AGENTS.md, .agents/, .codex/
  → Claude adapter: CLAUDE.md, .claude/
  → Gemini adapter: GEMINI.md, .gemini/
  → Cursor adapter: .cursor/rules/, .cursor/mcp.json
  → Kiro adapter: .kiro/steering/, .kiro/skills/, .kiro/settings/mcp.json
```

agent-deploy 구현 시 target별 조건문을 core 곳곳에 흩뿌리지 말고 target adapter에 둔다.

### 3. Semantic equivalence

목표는 파일 구조가 같아지는 것이 아니라 의미가 같아지는 것이다.

예:

```text
Claude skill
Codex skill
Gemini instruction fallback
```

위 세 가지는 물리적 구조가 달라도 같은 작업 트리거, 같은 제약, 같은 출력 형식을 제공하면 동등한 것으로 본다.

### 4. Capability-aware fallback

도구가 특정 기능을 native로 지원하지 않으면 아래 순서로 처리한다.

```text
native support
  → instruction-backed fallback
  → skip with explicit reason
```

조용히 누락하지 않는다. 설치 결과 또는 report에 skip reason을 남긴다.

### 5. Project scope by default

회사 표준 설정은 project scope를 기본으로 설치한다.

```text
project/
  AGENTS.md
  CLAUDE.md
  GEMINI.md
  .agents/
  .agent-deploy/install-state.json
```

user/global scope는 선택 옵션으로 제공한다.

### 6. Entry pointer parity

루트 진입점 파일(`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`)은 룰 본문을 각자 보관하지 않고 canonical source(`.agents/rules/`)를 가리키는 포인터로 둔다.

진입점 사이의 parity 기준은 "파일 내용 동일"이 아니라 다음 두 가지다.

```text
single source: 모든 진입점이 같은 canonical 룰 집합을 가리킨다.
no contradiction: 진입점끼리 서로 다른 규칙을 말하지 않는다.
```

canonical 룰을 in-context로 가져오는 방식은 harness capability에 따라 다를 수 있고 모두 허용한다.

```text
Claude:  CLAUDE.md @import 또는 참조 후 읽기
Codex:   AGENTS.md 인라인 또는 참조 후 읽기
Gemini:  GEMINI.md 참조 후 읽기
Kiro:    .kiro/steering/ always-included steering 파일
```

위 single source + no contradiction가 성립하면 semantic equivalence를 충족한 것으로 본다. 모든 룰을 in-context로 강제 인라인할 필요는 없다.

진입점이 canonical 룰을 빠뜨리거나 존재하지 않는 룰 경로를 가리키는 drift는 자동 검사로 막는다.

```text
agent-deploy/scripts/check-entry-parity.js
```

## agent-deploy 구현 규칙

- manifest는 canonical asset을 가리킨다.
- planner는 module/profile dependency를 해석한다.
- target adapter는 canonical asset을 각 harness 형식으로 변환한다.
- apply 단계는 path-safety와 conflict policy를 적용한다.
- install-state에는 어떤 canonical asset이 어떤 target 파일로 설치됐는지 남긴다.
- dry-run은 실제 설치와 같은 plan을 사용한다.

## Capability matrix 작성 기준

target별로 최소 아래 항목을 기록한다.

| Capability | Claude | Codex | Gemini | Cursor | Kiro | 처리 방식 |
|---|---|---|---|---|---|---|
| root instruction | native | native | native | IDE rules | native steering | AGENTS/CLAUDE/GEMINI, Cursor rules, or .kiro/steering |
| rules file | native/fallback | native/fallback | fallback | native rules | native steering | include or copy |
| skill | native | native/fallback | fallback | fallback | native | skill or instruction |
| command | native | fallback | fallback | skip/fallback | fallback | command or prompt |
| MCP | native | native | optional | native | native JSON | allowlist |
| install-state | tool-owned | tool-owned | tool-owned | tool-owned | tool-owned | .agent-deploy |

## Review checklist

- 원본 규칙과 도구별 파일의 의미가 같은가?
- 특정 target만 최신 규칙을 갖고 있지 않은가?
- unsupported 기능에 skip reason이 있는가?
- project scope가 기본이고 global은 옵션인가?
- install-state로 추적 가능한가?
- target adapter 밖에 도구별 분기가 과도하게 퍼져 있지 않은가?
- 루트 진입점(AGENTS/CLAUDE/GEMINI) 또는 Kiro steering entry가 같은 canonical 룰 집합을 빠짐없이 가리키는가?

