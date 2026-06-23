# MCP Governance Requirements

## Context

`mcp-baseline`은 Codex/Claude/Cursor에 MCP config를 설치하고 Gemini에는 skip reason을 남긴다. 전사 rollout 전에는 TODO 7.2와 D16 기준에 맞춰 기본 포함 범위, allowlist, filesystem MCP 제외, npx 버전 고정, 환경변수 기반 비활성화, token placeholder 정책을 코드로 강제해야 한다.

## SDD mode

SDD-full, because this changes security policy, manifest/profile selection, target adapter MCP behavior, validation, smoke tests, and handoff docs.

## Scope

In scope:

- MCP allowlist와 governance validation 추가.
- filesystem MCP 기본 제외.
- npx 기반 stdio MCP는 version pin 강제.
- `DISABLED_MCPS` 환경 변수로 서버별 설치 제외.
- MCP env/token 값은 `${ENV}` placeholder만 허용.
- profile에서 MCP 기본 포함 범위 정리.
- TODO/Finish와 capability 문서 갱신.

Out of scope:

- MCP 서버 binary/vendor packaging.
- 실제 내부 MCP URL/credential 확정.
- Gemini native MCP 설치 전환.
- release signing과 배포 채널 자동화.

## Requirements

### R1. Allowlisted MCP only

Installer must fail validation if `assets/mcp/servers.json` contains a server not present in the MCP allowlist.

### R2. Unsafe defaults blocked

Filesystem MCP must not be shipped by default, and stdio/npx MCP entries must use pinned package versions when introduced later.

### R3. Secret-safe MCP env

MCP env values must be placeholder references like `${COMPANY_MCP_TOKEN}`; literal token values must fail validation.

### R4. Runtime disable filter

Operators can set `DISABLED_MCPS=server-a,server-b` to exclude allowlisted MCP servers at plan/apply time, with visible skip reasons in install-state.

### R5. Profile default scope

`minimal` remains MCP-free and broad/default profiles do not silently include MCP; MCP is included only in explicit advanced profiles/modules.

## Acceptance criteria

- `npm --prefix agent-deploy run validate` passes and includes MCP governance validation.
- `npm --prefix agent-deploy test` passes with positive and negative MCP governance smoke tests.
- `assets/mcp/servers.json` no longer ships filesystem MCP.
- TODO/Finish and MCP capability docs identify MCP governance as implemented and note remaining follow-ups.
