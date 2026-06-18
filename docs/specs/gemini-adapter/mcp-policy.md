# Gemini MCP Policy Decision

작성일: 2026-06-18
상태: Accepted (revisitable)

## 배경

Codex adapter는 `assets/mcp/servers.json`을 `.codex/config.toml`의 `[mcp_servers.*]`로 add-only merge한다. Gemini adapter는 동일한 native MCP 설치 경로가 없어, 현재 `mcp` source를 skip reason과 함께 건너뛴다.

이전 skip 사유 문구는 "not finalized in this MVP"였다. 후속 작업으로 이 정책을 명시적으로 확정한다.

## 결정

Gemini adapter는 **project-scope MCP 설정을 의도적으로 설치하지 않는다(skip-with-reason).** 임의의 native MCP 설정 형식을 추측해서 쓰지 않는다.

이유:

- Gemini CLI의 안정적인 project-scope MCP 설정 계약(파일 위치/스키마)을 본 저장소에서 확인·검증하지 못했다.
- 검증되지 않은 형식을 추측해 기록하면 잘못된 설정을 배포할 위험이 있고, harness-engineering 원칙(semantic equivalence + 검증 가능한 native/fallback)과 보안/출처 원칙에 어긋난다.
- skip은 조용히 누락되지 않고 install plan에 reason과 함께 남으므로, 사용자가 누락을 인지할 수 있다.

이 결정은 임시 미완이 아니라 **현재 확정된 정책**이다. 아래 조건이 충족되면 재검토한다.

## 재검토 트리거

- Gemini CLI가 project-scope MCP 설정 파일 위치/스키마를 안정적으로 문서화한다.
- 또는 회사가 Gemini용 MCP 운영 방식을 별도로 확정한다.

재검토 시 작업:

1. Gemini MCP 설정 형식을 출처와 함께 기록한다.
2. `gemini.js`의 `mcp` 케이스를 skip 대신 native 설치(또는 add-only merge)로 바꾼다.
3. smoke test를 native 설치 검증으로 보강한다.
4. 이 문서 상태를 갱신한다.

## 현재 동작

- `agent-deploy/src/targets/gemini.js`의 `mcp` 케이스는 skip op + reason("Gemini MCP config policy: ...")을 기록한다.
- `agent-deploy/test/smoke.test.js`가 Gemini developer install에서 MCP skip reason을 단언한다.
