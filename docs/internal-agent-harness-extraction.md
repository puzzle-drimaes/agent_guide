# 사내 Agent Harness 설치·배포 기술 추출안

이 문서는 현재 저장소의 두 폴더에서 사내 agent 설치 및 배포에 재사용할 수 있는 하네스 엔지니어링 방법과 기술을 추출한 초안이다.

- `ECC/`: 범용 agent harness 운영체제에 가까운 대규모 자산 저장소
- `k-sdd/`: spec-driven agentic SDLC를 여러 AI coding agent에 설치하는 경량 배포 키트

권장 방향은 `k-sdd`의 안전하고 단순한 설치 엔진을 베이스로 삼고, `ECC`의 풍부한 skills, agents, rules, hooks, manifest, 운영 패턴을 선택적으로 얹는 것이다.

---

## 1. 추출 목표

사내 agent 배포 시스템은 다음 요구를 만족해야 한다.

1. 여러 agent harness에 동일한 회사 표준을 설치한다.
   - Codex
   - Claude Code
   - Cursor
   - OpenCode
   - Gemini CLI
   - GitHub Copilot
   - Windsurf
2. 회사 표준 workflow를 이식 가능한 단위로 관리한다.
   - skills
   - agents/subagents
   - rules
   - hooks
   - MCP config
3. 설치가 안전해야 한다.
   - dry-run
   - backup
   - overwrite/skip/append 정책
   - root 밖 write 방지
   - symlink 경로 방어
   - install state 기록
4. 운영과 검증이 가능해야 한다.
   - manifest validation
   - skill/rule/agent validation
   - hook validation
   - profile 기반 설치
   - CI 연동

---

## 2. `ECC/`에서 추출할 기술

`ECC/`는 agent harness 운영 레이어 전반을 담고 있다. 그대로 사내 배포에 쓰기에는 범위가 크므로, canonical 자산과 설치/검증 시스템을 분리해서 추출한다.

### 2.1 Cross-harness architecture

관련 위치:

- `ECC/docs/architecture/cross-harness.md`
- `ECC/.codex/`
- `ECC/.agents/`
- `ECC/.cursor/`
- `ECC/.opencode/`
- `ECC/.claude/`

핵심 아이디어:

- durable workflow는 `skills/`, `rules/`, `agents/`, `hooks/`, `mcp-configs/`에 둔다.
- harness별 파일은 loading, event shape, command name mapping만 담당한다.
- 동일한 workflow를 여러 harness용으로 중복 작성하지 않는다.

사내 적용:

```text
shared source
  ├─ skills/
  ├─ rules/
  ├─ agents/
  ├─ hooks/
  └─ mcp-configs/

harness adapters
  ├─ codex/
  ├─ claude/
  ├─ cursor/
  ├─ opencode/
  └─ gemini/
```

### 2.2 Skills-first workflow surface

관련 위치:

- `ECC/skills/`
- `ECC/.agents/skills/`
- `ECC/commands/`

관찰:

- `ECC`는 `skills/`를 canonical workflow surface로 보고, `commands/`는 legacy slash-entry compatibility layer로 취급한다.
- 현재 규모는 대략 다음과 같다.
  - agents: 67개
  - commands: 92개
  - skills: 271개
  - rules markdown: 114개

사내 적용:

- 회사 workflow는 우선 skill로 정의한다.
- slash command는 필요할 때만 thin shim으로 둔다.
- skill 하나는 다음 정보를 가져야 한다.
  - 언제 사용하는지
  - 입력과 출력
  - 필수 검증
  - 실패 시 fallback
  - 보안/권한 제약

### 2.3 Subagent 역할 분리

관련 위치:

- `ECC/agents/*.md`
- `ECC/.codex/agents/*.toml`
- `ECC/.agents/skills/*/agents/openai.yaml`

추출할 역할:

| 역할 | 목적 |
|---|---|
| planner | 구현 계획, 단계 분해 |
| architect | 구조 설계, 확장성 검토 |
| implementer | 실제 코드 변경 |
| reviewer | 독립 리뷰 |
| debugger | root-cause 분석 |
| security-reviewer | 보안 취약점 검토 |
| build-error-resolver | 빌드/타입/테스트 실패 해결 |
| doc-updater | 문서/코드맵 갱신 |

사내 적용:

- 모든 agent에게 모든 도구를 주지 않는다.
- reviewer/debugger는 fresh context로 실행한다.
- implementer와 reviewer를 분리해 자기검증 편향을 줄인다.

### 2.4 Rules와 memory

관련 위치:

- `ECC/rules/`
- `ECC/AGENTS.md`
- `ECC/CLAUDE.md`

추출할 rule 유형:

- 보안: secret 금지, input validation, SQL injection/XSS/CSRF 방어
- 테스트: TDD, coverage 기준, regression test
- 코드 스타일: 작은 함수, 작은 파일, immutability, error handling
- Git: conventional commit, 명시적 staging
- 성능: context management, long-running task 처리
- 언어별 규칙: TypeScript, Python, Go, Java, Kotlin, Rust 등

사내 적용:

```text
rules/
  ├─ common.md
  ├─ security.md
  ├─ testing.md
  ├─ git.md
  ├─ context-management.md
  └─ language/
      ├─ typescript.md
      ├─ python.md
      ├─ java.md
      └─ go.md
```

### 2.5 Hooks runtime

관련 위치:

- `ECC/hooks/`
- `ECC/scripts/hooks/*`

추출할 hook:

| Hook | 목적 |
|---|---|
| pre-bash-commit-quality | commit 전 품질 확인 |
| pre-bash-dev-server-block | 장시간 dev server 실행 방지/안내 |
| post-edit-format | 편집 후 formatting |
| post-edit-typecheck | 편집 후 typecheck |
| post-edit-console-warn | console/log 잔존 경고 |
| quality-gate | 품질 게이트 |
| session-start | session bootstrap |
| session-end | session summary |
| cost-tracker | 비용 추적 |
| mcp-health-check | MCP 상태 점검 |

사내 적용:

- hook parity가 없는 harness는 instruction-backed hook으로 대체한다.
- hook은 강제 차단과 soft reminder를 구분한다.
- 사내 default는 minimal profile에서 hook을 끄고, developer/security profile에서 켠다.

### 2.6 Manifest 기반 설치 profile

관련 위치:

- `ECC/manifests/install-modules.json`
- `ECC/manifests/install-components.json`
- `ECC/manifests/install-profiles.json`
- `ECC/scripts/install-apply.js`
- `ECC/scripts/lib/install-targets/*`

추출할 개념:

- module: 실제 파일 묶음
- component: 사용자 친화적 설치 선택 단위
- profile: 목적별 module 조합
- target adapter: harness별 설치 위치와 변환 방식

사내 profile 예시:

```json
{
  "internal-minimal": [
    "rules-core",
    "agents-core",
    "skills-core",
    "platform-configs"
  ],
  "internal-developer": [
    "rules-core",
    "agents-core",
    "skills-core",
    "hooks-runtime",
    "workflow-quality",
    "framework-language"
  ],
  "internal-security": [
    "rules-core",
    "agents-core",
    "skills-core",
    "hooks-runtime",
    "security",
    "workflow-quality"
  ]
}
```

### 2.7 Install state와 검증

관련 위치:

- `ECC/scripts/lib/install-state.js`
- `ECC/schemas/install-state.schema.json`
- `ECC/scripts/ci/validate-*`

추출할 기능:

- 설치된 파일 목록 기록
- 설치 시점, source version, manifest version 기록
- target, profile, module resolution 기록
- schema validation
- CI에서 manifest/skill/agent/rule 검증

사내 적용:

```text
.company-agent/install-state.json
```

또는 user-level harness에는:

```text
~/.company-agent/install-state.json
```

---

## 3. `k-sdd/`에서 추출할 기술

`k-sdd/`는 설치 엔진과 spec-driven workflow가 작고 명확하게 분리되어 있어 사내 installer 베이스로 적합하다.

### 3.1 Multi-platform template layout

관련 위치:

- `k-sdd/tools/k-sdd/templates/agents/*`
- `k-sdd/tools/k-sdd/templates/manifests/*.json`

지원 harness:

- Claude Code
- Codex
- Cursor
- GitHub Copilot
- Windsurf
- OpenCode
- Gemini CLI
- Antigravity
- Qwen Code legacy

핵심 구조:

```text
templates/agents/
  ├─ codex-skills/
  ├─ claude-code-skills/
  ├─ cursor-skills/
  ├─ github-copilot-skills/
  ├─ windsurf-skills/
  ├─ opencode-skills/
  ├─ gemini-cli-skills/
  └─ antigravity-skills/
```

사내 적용:

- agent별 output layout은 template으로 둔다.
- canonical skill 내용은 최대한 공유하고, harness별 wrapper만 다르게 만든다.

### 3.2 Manifest → Plan → Execute 구조

관련 위치:

- `k-sdd/tools/k-sdd/src/manifest/loader.ts`
- `k-sdd/tools/k-sdd/src/manifest/planner.ts`
- `k-sdd/tools/k-sdd/src/manifest/processor.ts`
- `k-sdd/tools/k-sdd/src/plan/executor.ts`
- `k-sdd/tools/k-sdd/src/plan/fileOperations.ts`

추출할 pipeline:

```text
manifest load
  → template variable resolve
  → artifact processing
  → file operation plan
  → dry-run output
  → conflict resolution
  → backup
  → write/append/skip
```

사내 적용:

- 설치 전 반드시 plan을 만든다.
- CI에서는 dry-run JSON을 검토한다.
- 실제 write는 plan을 기반으로만 수행한다.

### 3.3 Path safety

관련 위치:

- `k-sdd/tools/k-sdd/src/utils/pathSafety.ts`
- `k-sdd/tools/k-sdd/src/utils/fs.ts`

추출할 방어:

- 절대 경로 입력 금지
- root 밖 경로 금지
- symlink path write 방지
- backup path도 root 내부로 제한

사내 적용:

이 부분은 그대로 또는 거의 그대로 가져올 가치가 높다.

```text
assertPathInsideRoot()
resolveRelativePathInsideRoot()
assertNoSymlinkInPath()
```

### 3.4 Wizard와 non-interactive install

관련 위치:

- `k-sdd/tools/k-sdd/src/cli/*`
- `k-sdd/tools/k-sdd/src/cli/wizard.ts`

추출할 UX:

- TTY에서는 wizard 실행
- CI/non-TTY에서는 prompt 자동 skip
- `--yes`로 무인 설치
- `--dry-run`으로 사전 확인
- `--lang`으로 문서 언어 선택
- agent target flag로 설치 대상 선택

사내 적용 command 예시:

```bash
npx company-agent-kit --codex --profile developer --lang ko --yes
npx company-agent-kit --cursor --profile security --dry-run
```

### 3.5 Spec-driven workflow

관련 위치:

- `k-sdd/tools/k-sdd/templates/shared/settings/`
- `k-sdd/tools/k-sdd/templates/agents/*/skills/kiro-*`

핵심 workflow:

```text
kiro-discovery
  → kiro-spec-init
  → kiro-spec-requirements
  → kiro-spec-design
  → kiro-spec-tasks
  → kiro-impl
  → kiro-validate-impl
```

사내 적용:

- 큰 기능은 spec contract를 먼저 만든다.
- requirements/design/tasks는 phase gate를 둔다.
- code는 source of truth, spec은 boundary contract로 취급한다.

### 3.6 Long-running autonomous implementation

관련 위치:

- `k-sdd/tools/k-sdd/templates/agents/codex-skills/skills/kiro-impl/SKILL.md`
- `k-sdd/tools/k-sdd/templates/agents/codex-skills/skills/kiro-review/SKILL.md`
- `k-sdd/tools/k-sdd/templates/agents/codex-skills/skills/kiro-debug/SKILL.md`

추출할 실행 모델:

1. task queue를 만든다.
2. 한 iteration에 정확히 한 task만 처리한다.
3. fresh implementer subagent를 띄운다.
4. structured status만 파싱한다.
5. independent reviewer가 diff/spec/test를 직접 검증한다.
6. 실패가 반복되면 fresh debugger가 root cause를 분석한다.
7. task별로 selective commit을 수행한다.
8. `tasks.md`에 implementation notes를 축적한다.

중요 제약:

- `git add .` 금지
- `git add -A` 금지
- destructive reset 금지
- reviewer verdict는 구조화된 필드만 신뢰
- implementer status도 구조화된 필드만 신뢰
- max review/debug rounds 설정

사내 적용:

이 모델은 장시간 agent 실행 표준으로 매우 유용하다.

---

## 4. 사내 `internal-agent-kit` 권장 구조

```text
internal-agent-kit/
  ├─ package.json
  ├─ README.md
  ├─ src/
  │   ├─ cli/
  │   ├─ manifest/
  │   ├─ plan/
  │   ├─ template/
  │   ├─ targets/
  │   └─ utils/
  │
  ├─ manifests/
  │   ├─ modules.json
  │   ├─ components.json
  │   ├─ profiles.json
  │   ├─ codex-skills.json
  │   ├─ claude-skills.json
  │   ├─ cursor-skills.json
  │   └─ opencode-skills.json
  │
  ├─ templates/
  │   ├─ shared/
  │   │   ├─ rules/
  │   │   ├─ skills/
  │   │   ├─ agents/
  │   │   └─ hooks/
  │   └─ agents/
  │       ├─ codex/
  │       ├─ claude/
  │       ├─ cursor/
  │       └─ opencode/
  │
  ├─ schemas/
  │   ├─ manifest.schema.json
  │   ├─ profile.schema.json
  │   └─ install-state.schema.json
  │
  └─ tests/
      ├─ manifest.test.ts
      ├─ planner.test.ts
      ├─ executor.test.ts
      └─ path-safety.test.ts
```

---

## 5. 1차 추출 우선순위

### Phase 1: installer core

`k-sdd`에서 추출:

- `src/manifest/*`
- `src/plan/*`
- `src/template/*`
- `src/utils/pathSafety.ts`
- `src/utils/fs.ts`
- `src/cli/args.ts`
- `src/cli/config.ts`
- `src/cli/wizard.ts`

`ECC`에서 참고:

- `scripts/install-apply.js`
- `scripts/lib/install-targets/*`
- `scripts/lib/install-state.js`
- `schemas/install-state.schema.json`

### Phase 2: canonical company assets

`ECC`에서 추출:

- `skills/` 중 회사에 필요한 것만 선별
- `agents/` 중 핵심 역할만 선별
- `rules/` 중 common/security/testing/git/language rule 선별
- `scripts/hooks/` 중 품질/보안 hook 선별

### Phase 3: validation and CI

`ECC`에서 추출:

- `scripts/ci/validate-skills.js`
- `scripts/ci/validate-agents.js`
- `scripts/ci/validate-rules.js`
- `scripts/ci/validate-install-manifests.js`
- `schemas/*`

### Phase 4: orchestration

필요 시 추출:

- `ECC/scripts/lib/session-*`
- `ECC/scripts/lib/worktree-lifecycle/*`
- `ECC/scripts/orchestrate-*`
- `ECC/ecc2/`

---

## 6. 사내 profile 초안

### 6.1 `minimal`

목적: 모든 개발자에게 기본 설치.

포함:

- common rules
- security baseline
- git workflow
- basic reviewer agent
- basic planner agent
- company AGENTS.md

제외:

- hooks runtime
- orchestration
- MCP
- long-running autonomous implementation

### 6.2 `developer`

목적: 일반 제품 개발자.

포함:

- `minimal`
- TDD skill
- code review skill
- build resolver agent
- post-edit format/typecheck hook
- language rules
- project quality gate

### 6.3 `security`

목적: 보안 민감 repo 또는 보안팀.

포함:

- `developer`
- security-reviewer
- secret scan hook
- dependency/security checklist
- pre-commit security gate

### 6.4 `sdd`

목적: 대형 기능 또는 장시간 구현.

포함:

- `developer`
- spec-driven workflow
- requirements/design/tasks templates
- implementer/reviewer/debugger subagent flow
- completion verification skill

### 6.5 `operator`

목적: platform/team lead, agent 운영자.

포함:

- `developer`
- install-state inspection
- MCP inventory
- session summary
- orchestration/worktree tools
- cost tracking

---

## 7. Codex 대상 설치 산출물 예시

```text
project/
  ├─ AGENTS.md
  ├─ .agents/
  │   └─ skills/
  │       ├─ company-code-review/
  │       ├─ company-tdd/
  │       ├─ company-security-review/
  │       └─ company-spec-driven/
  ├─ .codex/
  │   ├─ agents/
  │   │   ├─ reviewer.toml
  │   │   ├─ debugger.toml
  │   │   └─ planner.toml
  │   └─ config.toml
  └─ .company-agent/
      └─ install-state.json
```

---

## 8. Claude Code 대상 설치 산출물 예시

```text
project/
  ├─ CLAUDE.md
  ├─ .claude/
  │   ├─ skills/
  │   │   ├─ company-code-review/
  │   │   ├─ company-tdd/
  │   │   └─ company-spec-driven/
  │   ├─ agents/
  │   │   ├─ reviewer.md
  │   │   ├─ debugger.md
  │   │   └─ planner.md
  │   └─ hooks/
  │       └─ hooks.json
  └─ .company-agent/
      └─ install-state.json
```

---

## 9. 배포 command 초안

```bash
# 대화형 설치
npx company-agent-kit

# Codex developer profile 설치
npx company-agent-kit --target codex --profile developer --lang ko

# Claude Code security profile dry-run
npx company-agent-kit --target claude --profile security --dry-run

# CI용 무인 설치
npx company-agent-kit --target codex --profile minimal --yes

# 특정 skill만 설치
npx company-agent-kit --target codex --skills company-code-review,company-tdd
```

---

## 10. 권장 구현 순서

1. `internal-agent-kit` package skeleton 생성
2. `k-sdd` installer core 이식
3. Codex target adapter부터 구현
4. `minimal` profile 구현
5. dry-run JSON 출력 구현
6. install-state 기록 구현
7. skills/rules/agents schema validation 추가
8. Claude/Cursor/OpenCode target 확장
9. hooks runtime 선택 설치 추가
10. `sdd` profile로 long-running implementation workflow 추가

---

## 11. 최종 판단

사내 배포용으로는 다음 조합이 가장 적합하다.

```text
k-sdd
  → installer core
  → manifest/template/plan architecture
  → path safety
  → wizard UX
  → spec-driven long-running implementation pattern

ECC
  → cross-harness architecture
  → skills/rules/agents/hooks assets
  → profile/module/component model
  → install-state and validation
  → MCP/session/orchestration patterns
```

즉, `k-sdd`는 설치 엔진의 뼈대이고, `ECC`는 운영 자산과 하네스 엔지니어링 패턴의 라이브러리로 보는 것이 좋다.
