# Harness Capability Matrix

작성일: 2026-06-19  
목적: `agent-deploy`가 Claude, Codex, Gemini, Cursor에 회사 표준 asset을 설치할 때 어떤 capability를 native로 지원하고, 어떤 capability를 fallback 또는 skip-with-reason으로 처리하는지 한곳에 정리한다.

이 문서는 현재 구현된 adapter와 smoke test 기준의 운영 matrix다. 제품/도구 자체의 이론적 지원 범위가 아니라, **현재 `agent-deploy`가 실제로 설치/검증하는 범위**를 기준으로 한다.

근거 파일:

```text
agent-deploy/src/targets/claude.js
agent-deploy/src/targets/codex.js
agent-deploy/src/targets/gemini.js
agent-deploy/src/targets/cursor.js
agent-deploy/src/targets/registry.js
agent-deploy/test/smoke.test.js
agent-deploy/manifests/profiles.json
docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md
```

---

## 1. 상태 표기

| 표기 | 의미 |
|---|---|
| Native | 해당 harness의 프로젝트 설정 표면으로 직접 설치한다. |
| Mirror | canonical asset을 harness별 디렉터리에 그대로 복사한다. |
| Flatten | canonical 구조를 harness 요구 형식에 맞게 평탄화한다. |
| Managed block | 루트 instruction 파일에 agent-deploy 관리 블록을 append/upsert한다. |
| Merge | 기존 사용자 설정을 보존하면서 JSON/TOML을 add-only 병합한다. |
| Fallback | native capability가 불명확하거나 약해 instruction-backed reference로 설치한다. |
| Skip with reason | 의도적으로 설치하지 않고 install-state operation에 사유를 남긴다. |
| Not implemented | 현재 adapter에서 다루지 않는다. |

---

## 2. Target별 설치 root 요약

| Target | Project instruction | Main asset root | Target-specific root | Install state | Project scope smoke test |
|---|---|---|---|---|---|
| Claude | 별도 root 파일 없음, `.claude/` asset 직접 사용 | `.claude/` | `.claude/` | `.claude/agent-install-state.json` | Yes |
| Codex | `AGENTS.md` managed block | `.agents/` | `.codex/` | `.agent-deploy/install-state.json` | Yes |
| Gemini | `GEMINI.md` managed block | `.gemini/` | `.gemini/` | `.agent-deploy/install-state.json` | Yes |
| Cursor | Cursor rules/config 중심 | `.cursor/` | `.cursor/` | `.cursor/agent-install-state.json` | Yes |

주의:

- Codex/Gemini는 repo root instruction 파일을 managed block으로 갱신한다.
- Claude/Cursor는 현재 adapter 기준으로 별도 루트 instruction markdown을 생성하지 않고 harness별 config directory에 asset을 설치한다.
- Codex/Gemini는 project 공용 install-state를 `.agent-deploy/install-state.json`에 둔다.
- Claude/Cursor는 target directory 내부에 `agent-install-state.json`을 둔다. lifecycle 기능 설계 시 이 차이를 반드시 고려한다.

---

## 3. Capability matrix

| Capability | Claude | Codex | Gemini | Cursor | 현재 정책 |
|---|---|---|---|---|---|
| Project scope 기본 | Native: project root 기준 `.claude/` | Native: `AGENTS.md`, `.agents/`, `.codex/` | Native/Fallback: `GEMINI.md`, `.gemini/` | Native/Fallback: `.cursor/` | 모든 target은 project scope를 기본으로 한다. |
| Home/global scope | Supported: fake home smoke test 있음 | Adapter 경로 존재, 별도 smoke 제한적 | Adapter 경로 존재, 별도 smoke 제한적 | Adapter contract상 가능하나 별도 smoke 제한적 | user/global은 option이며 Pilot 전 추가 검증 필요. |
| Root instruction | `.claude/` asset 직접 참조 | `AGENTS.md` managed block | `GEMINI.md` managed block | `.cursor/rules/*.mdc` 중심 | 루트 진입점이 있는 target은 managed block으로 add-only 처리한다. |
| Common rules | Mirror: `.claude/rules/common/` | Mirror: `.agents/rules/common/` | Mirror: `.gemini/rules/common/` | Flatten: `.cursor/rules/common-*.mdc` | baseline-rules는 모든 profile의 기준이다. |
| Developer rules | Mirror: `.claude/rules/developer/` | Mirror: `.agents/rules/developer/` | Mirror: `.gemini/rules/developer/` | Flatten: `.cursor/rules/developer-*.mdc` | developer/full/sdd 계열에만 포함한다. |
| Skills | Mirror: `.claude/skills/` | Mirror: `.agents/skills/` | Fallback mirror: `.gemini/skills/` | Fallback mirror: `.cursor/skills/` | native 여부보다 semantic equivalence를 우선한다. |
| Agents/subagents | Mirror: `.claude/agents/` | Native-ish: `.codex/agents/` | Fallback mirror: `.gemini/agents/` | Fallback mirror: `.cursor/agents/` | Gemini/Cursor는 role prompt fallback 성격으로 본다. |
| Commands | Mirror: `.claude/commands/` | Skip with reason | Mirror/Fallback: `.gemini/commands/` | Skip with reason | Codex/Cursor는 slash-command install surface가 없어 skip 기록. |
| Prompts | Mirror: `.claude/prompts/` | Mirror: `.agents/prompts/` | Mirror: `.gemini/prompts/` | Mirror: `.cursor/prompts/` | prompt-library와 직무별 prompt는 target별 root에 설치한다. |
| MCP config | Merge JSON: project `.mcp.json`, home `.claude.json` | Merge TOML: `.codex/config.toml` | Skip with reason | Merge JSON: `.cursor/mcp.json` | Gemini MCP는 안정된 project-scope contract 전까지 의도적 skip. |
| JSON merge | Supported | Not used for Codex MCP | Not used | Supported | user key 보존 smoke test는 Claude JSON merge로 검증. |
| TOML merge | Not used | Supported: add-only Codex MCP | Not used | Not used | 기존 Codex config와 company-docs 중복 방지 smoke test 있음. |
| Append markdown | Not used | Supported: `AGENTS.md` idempotent | Supported: `GEMINI.md` idempotent | Not used | managed block은 중복 삽입하지 않는다. |
| Skip reason | Supported by operation model | Commands skip | MCP skip | Commands skip | unsupported capability는 조용히 누락하지 않는다. |
| Dry-run / JSON output | Common apply layer | Common apply layer | Common apply layer | Common apply layer | CLI smoke test는 Claude profile로 JSON stdout을 검증한다. |
| Path safety / symlink guard | Common apply layer | Common apply layer | Common apply layer | Common apply layer | target별 adapter가 아니라 apply 공통 책임이다. |

---

## 4. Profile별 검증 범위

현재 smoke test가 확인한 profile/target 조합은 다음과 같다.

| Profile | Claude | Codex | Gemini | Cursor | 검증 내용 |
|---|---|---|---|---|---|
| minimal | Yes | Yes | Yes | 부분 | common rules 설치, developer asset 미포함 |
| core | Yes | 간접 | 간접 | 간접 | prompt-asset, prompt-library, MCP baseline 일부 |
| developer | Yes | Yes | Yes | Yes | developer rules/skills/agents, command/MCP skip reason |
| product | Yes | Yes | Yes | 간접 | product-spec, meeting-summary, product prompts |
| business | Yes | Yes | Yes | 간접 | meeting-summary, customer-response, business prompts |
| governance | Yes | 간접 | 간접 | 간접 | quarterly-review, kpi-report, prompt-db-curation |
| sdd | manifest 대상 | manifest 대상 | manifest 대상 | manifest 대상 | SDD rule/skill dependency는 manifest validation 중심 |
| full | manifest 대상 | manifest 대상 | manifest 대상 | manifest 대상 | 전체 묶음은 manifest validation 중심 |

해석:

- “Yes”는 해당 target/profile 조합이 smoke test에서 직접 apply/assert된 상태다.
- “간접”은 같은 adapter의 다른 profile 테스트 또는 manifest dependency로 일부 asset 설치 경로가 확인된 상태다.
- Pilot 기본 profile(`minimal`, `developer`, `product`, `business`)은 Codex/Claude/Gemini에서 직접 smoke test로 확인했다. Cursor는 developer 중심의 internal smoke target으로 유지한다.

---

## 5. Target별 세부 정책

### 5.1 Claude

현재 정책:

```text
rules     → .claude/rules/
agents    → .claude/agents/
commands  → .claude/commands/
skills    → .claude/skills/
prompts   → .claude/prompts/
mcp       → project: .mcp.json / home: ~/.claude.json
state     → .claude/agent-install-state.json
```

특징:

- canonical asset 구조를 가장 직접적으로 mirror한다.
- MCP는 JSON merge로 기존 사용자 key를 보존한다.
- home scope smoke test가 있다.

주의:

- project 공용 `.agent-deploy/install-state.json`이 아니라 `.claude/agent-install-state.json`을 사용한다.
- lifecycle(update/repair/uninstall)에서 Codex/Gemini와 state 위치 차이를 흡수해야 한다.

### 5.2 Codex

현재 정책:

```text
rules     → .agents/rules/
skills    → .agents/skills/
prompts   → .agents/prompts/
agents    → .codex/agents/
commands  → skip with reason
mcp       → .codex/config.toml add-only merge
state     → .agent-deploy/install-state.json
entry     → AGENTS.md managed block
```

특징:

- company-wide canonical rules와 skills는 `.agents/`에 둔다.
- Codex-specific agent definitions와 config는 `.codex/`에 둔다.
- `AGENTS.md` managed block은 idempotent하게 유지된다.
- TOML merge는 기존 사용자 설정을 보존하고 company MCP section을 add-only로 추가한다.

주의:

- slash command 설치 표면은 현재 없음으로 처리한다.
- `commands` module은 skip reason을 install-state에 남겨야 한다.

### 5.3 Gemini

현재 정책:

```text
rules     → .gemini/rules/
commands  → .gemini/commands/
agents    → .gemini/agents/ fallback mirror
skills    → .gemini/skills/ fallback mirror
prompts   → .gemini/prompts/
mcp       → skip with reason
state     → .agent-deploy/install-state.json
entry     → GEMINI.md managed block
```

특징:

- `GEMINI.md`가 `.gemini/` 하위 rules/commands/agents/skills를 읽도록 안내한다.
- agents/skills는 native 보장보다 instruction-backed fallback으로 취급한다.
- MCP config는 안정된 project-scope contract가 확인될 때까지 의도적으로 skip한다.

주의:

- Gemini MCP 정책은 `docs/specs/gemini-adapter/mcp-policy.md`의 재검토 트리거에 따른다.
- native command semantics는 실제 Gemini CLI 동작 검증이 필요하다.

### 5.4 Cursor

현재 정책:

```text
rules     → .cursor/rules/*.mdc flatten-copy
agents    → .cursor/agents/
skills    → .cursor/skills/
prompts   → .cursor/prompts/
commands  → skip with reason
mcp       → .cursor/mcp.json JSON merge
state     → .cursor/agent-install-state.json
```

특징:

- rules는 Cursor가 읽기 쉬운 `.mdc` 파일로 flat 변환한다.
- commands는 native slash-command surface가 없으므로 skip한다.
- MCP는 `.cursor/mcp.json`에 merge한다.

주의:

- `.cursor` 생태계의 실제 rule activation 범위는 IDE 버전/설정에 따라 달라질 수 있다.
- Pilot 전 Cursor를 1급 target으로 둘지 여부는 별도 결정이 필요하다.

---

## 6. Fallback / skip 정책

현재 의도된 skip은 다음 두 가지다.

| Target | Source category | Skip reason 요약 | 후속 조건 |
|---|---|---|---|
| Codex | commands | native slash-command install surface 없음 | command shim 정책이 생기면 재검토 |
| Cursor | commands | Cursor slash-command surface 없음 | Cursor command/automation 표준 확인 시 재검토 |
| Gemini | mcp | 안정된 project-scope MCP config contract 전까지 skip | Gemini MCP config contract가 안정화되면 native 설치 전환 검토 |

원칙:

```text
unsupported capability는 설치 중 조용히 누락하지 않는다.
skip operation과 reason을 install-state에 남긴다.
```

---

## 7. Pilot 전 권장 보강

### 7.1 Smoke test 보강

Pilot 대상 target/profile 기준 직접 테스트는 1차 보강 완료됐다.

```text
Codex:   minimal / developer / product / business 직접 검증
Claude:  minimal / developer / product / business 직접 검증
Gemini:  minimal / developer / product / business 직접 검증
Cursor:  developer 중심 internal smoke target 유지
```

### 7.2 State 위치 표준화 여부 결정

현재 state 위치가 target별로 다르다.

```text
Claude: .claude/agent-install-state.json
Cursor: .cursor/agent-install-state.json
Codex:  .agent-deploy/install-state.json
Gemini: .agent-deploy/install-state.json
```

lifecycle(update/repair/uninstall)을 구현하기 전 아래 중 하나를 결정한다.

1. target별 state 위치를 유지하고 lifecycle planner가 adapter에게 위임한다.
2. project scope에서는 `.agent-deploy/install-state.json`으로 통합한다.
3. 기존 state를 읽되 새 버전부터 `.agent-deploy/`로 이관한다.

권장:

```text
단기: target별 state 위치 유지 + lifecycle planner가 adapter.statePath(input)을 사용
중기: project scope install-state 통합 여부를 D15(update/uninstall/repair 범위)에서 결정
```

### 7.3 MCP governance

현재 MCP는 `core`, `developer`, `full`에 포함되어 있다. Pilot 전 D16/MCP governance에서 아래를 결정한다.

```text
- minimal에는 MCP 제외 유지
- filesystem MCP 기본 제외 또는 명시 opt-in 여부
- npx 기반 MCP 버전 고정
- token은 ${ENV} placeholder만 허용
- DISABLED_MCPS 또는 allowlist 필터 정책
```

### 7.4 Cursor Pilot 범위

Cursor adapter는 존재하지만, 회사 1차 지원 대상은 Codex/Claude 중심이고 Gemini는 Pilot 중 추가로 정리되어 있다. Cursor는 다음 중 하나로 결정한다.

```text
1. internal smoke target으로만 유지
2. developer Pilot에서 optional target으로 제공
3. 정식 지원 대상에서 제외하고 adapter 유지보수만 지속
```

---

## 8. 유지보수 규칙

새 target을 추가하거나 adapter 정책을 바꾸면 다음을 함께 갱신한다.

```text
1. agent-deploy/src/targets/<target>.js
2. agent-deploy/src/targets/registry.js
3. agent-deploy/test/smoke.test.js
4. agent-deploy/manifests/modules.json 또는 profiles.json
5. docs/harness-capability-matrix.md
6. docs/plans/codex/company-wide-agent-rollout/02b-harness-engineering-principles.md 필요 시 갱신
7. TODO.md / Finish.md 완료 상태 반영
```

검증 명령:

```text
npm --prefix agent-deploy run validate
npm --prefix agent-deploy test
```

---

## 9. 현재 결론

현재 `agent-deploy`는 Claude/Codex/Gemini/Cursor 4개 target에 대해 smoke test 수준의 semantic equivalence를 갖는다.

다만 Pilot 관점의 다음 리스크가 남아 있다.

```text
- target별 install-state 위치 차이
- Gemini MCP skip 정책의 재검토 시점
- Cursor를 Pilot 대상에 포함할지 여부
- OS별 install.sh/install.bat 검증 부족
```

따라서 다음 작업 우선순위는 다음이다.

```text
1. install.sh/install.bat OS별 검증
2. Linux/macOS zip bundle build script 추가
3. backup/conflict policy와 lifecycle(update/repair/uninstall) 설계
```
