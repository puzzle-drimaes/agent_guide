# 02-B. 하네스 엔지니어링 원칙

## 목적

Claude, Codex, Gemini, Cursor 같은 AI 도구는 서로 다른 설정 구조와 기능을 가진다. 하네스 엔지니어링의 목적은 이 차이를 숨기고, 회사의 동일한 업무 방법론을 각 도구에 맞게 안정적으로 주입하는 것이다.

이 문서는 `agent-deploy`가 따라야 할 하네스 엔지니어링 원칙을 정의한다.

---

## 1. 핵심 정의

### 1.1 Harness

하네스는 AI agent가 동작하는 실행 표면이다.

예:

```text
Claude Code
Codex
Gemini CLI
Cursor
OpenCode
GitHub Copilot
Windsurf
```

각 하네스는 다음이 다르다.

```text
- 설정 파일 위치
- instructions/memory 파일 이름
- skills 지원 여부
- subagent 지원 방식
- hooks 지원 여부
- MCP 설정 방식
- global/project config 우선순위
- CLI/IDE 동작 차이
```

### 1.2 Harness Engineering

하네스 엔지니어링은 다음을 설계하는 일이다.

```text
하나의 회사 표준 방법론
  → 여러 하네스별 네이티브 설정
  → 같은 업무 방향성과 검증 기준
```

---

## 2. 설계 원칙

## 2.1 Canonical source first

회사 표준은 하네스별 폴더에 직접 흩어놓지 않는다.

정규 소스:

```text
assets/
  ├─ rules/
  ├─ skills/
  ├─ agents/
  ├─ prompts/
  ├─ workflows/
  └─ mcp/
```

금지:

```text
Claude용 문서와 Codex용 문서를 별도로 사람이 계속 수정
```

허용:

```text
assets/의 정규 소스를 target adapter가 Claude/Codex/Gemini 형식으로 렌더링
```

## 2.2 Adapter per harness

새 AI 도구를 추가할 때 core installer를 수정하지 않는다.

추가할 것:

```text
src/targets/<harness>.js
```

adapter 책임:

```text
- 해당 하네스의 project/global 설정 위치 결정
- canonical asset을 native layout으로 변환
- 지원하지 않는 기능을 skip 또는 instruction-backed fallback으로 대체
- merge/copy/link 정책 적용
- install-state에 operation 기록
```

adapter가 하면 안 되는 일:

```text
- profile/module 해석
- 회사 표준 rule 자체 변경
- 보안 정책 완화
- 사용자 파일 무단 삭제
```

## 2.3 Project scope 기본

프로젝트별 설정을 기본으로 한다.

```text
project/
  ├─ AGENTS.md
  ├─ CLAUDE.md
  ├─ GEMINI.md
  ├─ .codex/
  ├─ .claude/
  ├─ .gemini/
  ├─ .cursor/
  └─ .agent-deploy/
```

이유:

```text
- 프로젝트별 업무 방식이 명확하다.
- 설정 변경을 PR로 리뷰할 수 있다.
- 팀원이 같은 repo에서 같은 agent behavior를 얻는다.
```

전역 설정은 option이다.

```text
agent-deploy apply --scope user ...
```

## 2.4 Capability-aware fallback

모든 하네스가 같은 기능을 지원하지 않는다.

예:

```text
Claude: hooks 지원 가능
Codex: AGENTS.md/skills 중심
Gemini: instruction/commands 중심
Cursor: IDE rules 중심
```

따라서 기능별로 fallback을 둔다.

```text
native support:
  해당 하네스 기능으로 직접 설치

instruction-backed:
  native 기능이 없으면 instructions/rules로 대체

skip with reason:
  대체가 위험하거나 불가능하면 skip하고 install-state에 기록
```

## 2.5 Semantic equivalence

목표는 파일 구조가 같아지는 것이 아니다. 의미가 같아지는 것이다.

예:

```text
Claude:
  .claude/skills/company-code-review/SKILL.md

Codex:
  .agents/skills/company-code-review/SKILL.md

Gemini:
  GEMINI.md에 해당 review workflow instructions
```

세 파일은 구조는 달라도 “리뷰 전 diff 확인, 확신 없는 지적 금지, 보안/출처 확인”이라는 의미가 같아야 한다.

---

## 3. Capability Matrix

초기 matrix:

| Capability | Claude | Codex | Gemini | Cursor | Fallback |
|---|---|---|---|---|---|
| Project instructions | `CLAUDE.md` | `AGENTS.md` | `GEMINI.md` | rules/docs | 각 도구 memory 파일 |
| Skills | `.claude/skills` | `.agents/skills` | 제한적/명령 기반 | 제한적 | instructions로 축약 |
| Subagents | `.claude/agents` | `.codex/agents` | 제한적 | 제한적 | role prompt로 대체 |
| Commands | `.claude/commands` | command/prompt shim | `.gemini/commands` | 제한적 | README/examples |
| Hooks | native 가능 | 제한적 | 제한적 | 일부 가능 | instruction-backed reminder |
| MCP | `.mcp.json` | config merge | config merge | mcp config | minimal에는 제외 |
| Install state | `.agent-deploy` | `.agent-deploy` | `.agent-deploy` | `.agent-deploy` | 공통 |

이 matrix는 실제 검증 결과에 따라 갱신한다.

---

## 4. Adapter Contract

모든 target adapter는 다음 인터페이스를 만족해야 한다.

```text
id
target
scope support
supports(targetOrId)
resolveRoot(input)
statePath(input)
supportsModule(module)
validate(input)
planOperations(input)
```

operation 종류:

```text
copy-file
merge-json
merge-toml
append-markdown
render-template
skip
```

operation 필수 필드:

```text
kind
moduleId
sourceRel
dest
strategy
ownership
scope
reason 또는 fallback
```

---

## 5. Profile/Module 분리

하네스 엔지니어링에서 profile과 target은 분리한다.

```text
profile:
  어떤 회사 방법론을 설치할지 결정

target:
  그 방법론을 어떤 도구 형식으로 설치할지 결정
```

예:

```bash
agent-deploy apply --profile developer --target codex --scope project
agent-deploy apply --profile developer --target claude --scope project
```

두 명령은 같은 `developer` 방법론을 다른 하네스 형식으로 설치한다.

---

## 6. Safety and Lifecycle

하네스 설정 배포는 단순 파일 복사가 아니라 공격면을 늘리는 행위다.

필수 안전장치:

```text
- dry-run
- path-safety
- symlink escape 방지
- install-state/provenance
- backup
- managed ownership
- conflict policy
- update
- repair
- uninstall
- manifest validation
```

추가 보안:

```text
- unicode safety
- workflow security validation
- secret scan
- MCP allowlist
- artifact signing
```

---

## 7. Harness Parity Test

각 profile은 target별로 의미 동등성을 테스트해야 한다.

테스트 예:

```text
minimal profile:
  Claude/Codex/Gemini 모두 보안 rule과 출처 rule을 포함하는가?

developer profile:
  각 target에서 code-review workflow가 접근 가능한가?

business profile:
  각 target에서 고객 응대/회의록 workflow가 접근 가능한가?
```

검증 방법:

```text
1. plan 생성
2. apply
3. 설치 파일 존재 확인
4. 핵심 instruction 문자열 확인
5. install-state operation 확인
6. unsupported capability의 fallback/skip reason 확인
```

---

## 8. 하네스 엔지니어링 산출물

필수 산출물:

```text
manifests/modules.json
manifests/profiles.json
src/targets/codex.js
src/targets/claude.js
src/targets/gemini.js
src/targets/cursor.js
schemas/adapter-operation.schema.json
tests/harness-parity.test.js
docs/harness-capability-matrix.md
```

---

## 9. 완료 기준

```text
- 같은 profile이 Claude/Codex/Gemini에 의미상 동등하게 설치된다.
- target adapter 추가 시 core installer 수정이 거의 없다.
- 지원하지 않는 기능은 fallback 또는 skip reason으로 기록된다.
- install-state로 어떤 하네스에 어떤 설정이 설치됐는지 추적할 수 있다.
- project scope가 기본이고 user scope는 선택 옵션으로 동작한다.
- 하네스별 capability matrix가 문서화되어 있다.
```
