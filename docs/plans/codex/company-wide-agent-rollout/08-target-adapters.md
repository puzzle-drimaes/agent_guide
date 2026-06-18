# 08. Target Adapter 구현

## 목적

같은 회사 자산을 Claude, Codex, Gemini 등 각 AI 도구의 네이티브 구조에 맞게 변환 설치한다.

기본 설치 범위는 프로젝트별 설정이다. target adapter는 bundle의 정규 자산을 프로젝트 내부의 각 도구 설정 폴더에 copy/merge한다. 사용자 전역 설정은 선택 옵션이다.

## 우선순위

```text
1. Codex
2. Claude
3. Gemini
4. Cursor
5. OpenCode
```

## 공통 Adapter 원칙

```text
- canonical source는 assets/에 둔다.
- project scope가 기본 설치 위치다.
- user global scope는 선택 옵션이다.
- target adapter는 위치와 형식 변환만 담당한다.
- profile/module 해석 로직은 target과 분리한다.
- target 추가 시 registry에 adapter만 추가한다.
- IDE/CLI 차이는 adapter에서 흡수한다.
```

## Codex 설치 구조

```text
project/
  ├─ AGENTS.md
  ├─ .agents/
  │   └─ skills/
  ├─ .codex/
  │   ├─ agents/
  │   └─ config.toml
  └─ .agent-deploy/
      └─ install-state.json
```

Codex mapping:

| Canonical asset | Codex destination |
|---|---|
| `rules/common/*.md` | `AGENTS.md` managed block + `.agents/rules/` |
| `skills/*/SKILL.md` | `.agents/skills/*/SKILL.md` |
| `agents/*.md` | `.codex/agents/*.md` |
| `commands/*.md` | skip+reason |
| `mcp/servers.json` | `.codex/config.toml` add-only TOML merge |

## Claude 설치 구조

```text
project/
  ├─ CLAUDE.md
  ├─ .claude/
  │   ├─ skills/
  │   ├─ agents/
  │   ├─ commands/
  │   └─ hooks/
  └─ .agent-deploy/
      └─ install-state.json
```

Claude mapping:

| Canonical asset | Claude destination |
|---|---|
| `rules/common/*.md` | `.claude/rules/` 또는 `CLAUDE.md` |
| `skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| `agents/*.md` | `.claude/agents/*.md` |
| `commands/*.md` | `.claude/commands/*.md` |
| `mcp/servers.json` | `.mcp.json` |

## Gemini 설치 구조

```text
project/
  ├─ GEMINI.md
  ├─ .gemini/
  │   ├─ commands/
  │   └─ agents/
  └─ .agent-deploy/
      └─ install-state.json
```

Gemini mapping:

| Canonical asset | Gemini destination |
|---|---|
| `rules/common/*.md` | `GEMINI.md` managed block + `.gemini/rules/` |
| `commands/*.md` | `.gemini/commands/*.md` |
| `agents/*.md` | `.gemini/agents/*.md` |
| `skills/*/SKILL.md` | `.gemini/skills/*/SKILL.md` fallback |
| `mcp/servers.json` | skip+reason until MCP policy is finalized |

## Adapter 구현 체크리스트

```text
- supports(targetOrId)
- resolveRoot(input)
- statePath(input)
- supportsModule(module)
- validate(input)
- planOperations(input)
```

## 검증

각 target마다:

```text
- minimal profile plan 생성
- developer profile plan 생성
- apply 후 파일 존재 확인
- install-state 존재 확인
- target 미지원 module skip 확인
- dry-run과 apply operation 일치 확인
```

## 완료 기준

- 같은 `minimal` profile이 Codex/Claude/Gemini에 설치된다.
- target별 설치 위치가 문서화된다.
- target adapter 추가 시 기존 core 코드를 거의 수정하지 않는다.
