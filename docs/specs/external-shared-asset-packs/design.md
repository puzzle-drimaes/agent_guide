# External / Shared Asset Packs — Design

## 1. 핵심 결정

```text
기본 bundle은 항상 base layer다.
외부/shared pack은 base layer 위에 추가되는 read-only overlay다.
충돌은 자동 병합하지 않고 fail-fast한다.
설치는 기존 plan/apply/path-safety/install-state 경로를 그대로 탄다.
```

## 2. Pack 종류

| 종류 | 위치 예시 | 용도 | profile 확장 권한 |
|---|---|---|---|
| bundled | `agent-deploy/assets` | 기본 회사 표준 asset | 가능 |
| shared-approved | `packs/<team-or-domain>` | governance 승인된 사내 공유 pack | 제한적으로 가능 |
| project-local | `<repo>/.agent-packs/<name>` | 특정 프로젝트 전용 asset | 불가, pack profile만 가능 |
| candidate | `<repo>/.agent-packs/candidates/<name>` | 공유 문서 검토/승격 후보 | 불가 |

## 3. Pack directory layout

```text
my-pack/
  pack.json
  assets/
    prompts/
    templates/        # v1에서는 선택. 현재 adapter는 경로만 복사하므로 가능
    docs/
    skills/
    agents/
    rules/
    commands/
    mcp/
    catalog.draft.json
  manifests/
    modules.json
    profiles.json
  schemas/            # 선택. pack 전용 schema 확장 후보, v1에서는 참조용
```

### 3.1 Externals drop-in layout

외부에서 가져와 현재 프로젝트에 적용하려는 모든 Markdown은 먼저 project-local `externals` 폴더에 둔다.
구성원이 공유할 skill 또는 문서를 Markdown 파일로만 제안하는 경우 full pack을 직접 만들지 않아도 되며,
agent가 `externals`를 candidate pack으로 해석한다.

```text
<repo>/.agents/externals/
  skills/
    my-review-skill.md
    my-workflow/SKILL.md
  docs/
    onboarding-checklist.md
  prompts/
    weekly-report.md
  docs/
    debugging-playbook.md
```

Rules:

- externals는 외부에서 가져온 Markdown의 단일 후보 영역이며 canonical rule/document 폴더가 아니다.
- 모든 외부 Markdown 제안은 적용 전 externals를 거치며, bundled `assets/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`를 직접 수정하지 않는다.
- frontmatter가 없으면 agent가 draft frontmatter를 제안한다.
- externals에서 승인된 파일은 target별 shared 영역에 설치한다.

Recommended target placement:

```text
Codex:  .agents/shared/<pack-id>/...
Claude: .claude/shared/<pack-id>/...
Gemini: .gemini/shared/<pack-id>/...
Cursor: .cursor/shared/<pack-id>/...
```

This keeps shared proposals isolated from existing rules and documents while still making them available to the agent.

### 3.2 `pack.json`

```json
{
  "schemaVersion": "agentdeploy.assetPack.v1",
  "id": "frontend-team-pack",
  "title": "Frontend Team Pack",
  "version": "0.1.0",
  "owner": "frontend-team",
  "stability": "beta",
  "source": "git+ssh://example/company/frontend-agent-pack",
  "license": "Internal-Use-Only",
  "reviewStatus": "reviewing",
  "packType": "shared-approved",
  "defaultProfileExtensions": {
    "developer": ["frontend-team-pack-review-checklist"]
  }
}
```

Required fields:

```text
schemaVersion, id, title, version, owner, stability, reviewStatus, packType
```

Rules:

- `id`는 kebab-case이고 전역적으로 안정적이어야 한다.
- pack 내부 module id와 asset id는 pack id prefix 사용을 권장한다.
- `defaultProfileExtensions`는 `shared-approved` pack에서만 허용한다.
- `candidate` pack은 `reviewStatus=candidate|reviewing`만 허용한다.

## 4. Manifest composition

### 4.1 Base-first composition

1. Load bundled manifests from `agent-deploy/manifests`.
2. Load each requested pack manifest.
3. Validate each pack in isolation.
4. Compose virtual manifests in this order:

```text
base bundle → shared-approved packs → project-local packs → candidate packs
```

5. Fail if any id/path/destination collision exists.
6. Resolve profile/module request against the virtual manifest.

### 4.2 Module id policy

- Module ids are global in the virtual manifest.
- Collision with bundled module id is an error.
- Collision between packs is an error.
- Recommended format: `<pack-id>-<module-purpose>`.

### 4.3 Profile policy

Packs may define pack-local profiles:

```json
{
  "profiles": {
    "frontend-review": ["frontend-team-pack-review-checklist"]
  }
}
```

Builtin profile mutation is not allowed. Instead:

- v1 CLI supports explicit pack modules/profiles.
- shared-approved packs may expose `defaultProfileExtensions` in `pack.json`.
- `defaultProfileExtensions` are opt-in at CLI level via `--enable-pack-extensions`.
- profile extension targets must already exist in the bundled base profiles.
- `project-local` and `candidate` packs cannot declare or apply `defaultProfileExtensions`.

This keeps project-local/candidate packs from silently changing company defaults.

### 4.4 Conflict resolution policy

충돌은 조용히 병합하지 않는다. agent는 dry-run/inspect 단계에서 충돌을 설명하고 사용자의 선택을 받는다.

Conflict types:

```text
asset id collision
module id collision
profile id collision
same target destination
same title/path with different content
semantic conflict with canonical rule
```

Allowed decisions:

| Decision | 의미 | 기본 추천 |
|---|---|---|
| `keep-existing` | 기존 문서/룰 유지, 제안 파일 미적용 | rule 충돌 |
| `add-namespaced` | `shared/<pack-id>/` 아래 별도 문서로 추가 | skill/doc 충돌 |
| `rename-proposed` | 제안 asset id/path/title 변경 후 추가 | id/path 충돌 |
| `replace-existing` | 기존 문서 대체 | 일반 문서에서만 explicit opt-in |

Canonical company rules cannot use `replace-existing` through the externals flow. They require the separate canonical rule-change workflow.

Resolution provenance:

```json
{
  "conflictResolutions": [
    {
      "proposed": ".agents/externals/docs/onboarding-checklist.md",
      "conflictsWith": ".agents/shared/team/onboarding-checklist.md",
      "decision": "add-namespaced",
      "decidedBy": "user",
      "reason": "Keep existing guide and add team-specific variant"
    }
  ]
}
```

Runtime capture supports a `--conflict-resolution <json-file>` option that records externally reviewed decisions in
install-state under `source.conflictResolutions[]`. `add-namespaced` records can resolve target-destination/asset-path collisions by transforming copy-file destinations
to `shared/<pack-id>/...`. Other decisions remain provenance-only in v1: any path/id renames or replacements must be
reflected in the pack files before planning. The JSON file may be either an array of decision records or an object with
a `conflictResolutions` array. Each record uses the same fields and may include `decidedAt`, `packId`, and
`packDigest`.

## 5. CLI shape

### 5.1 v1 commands

```text
agent-deploy pack inspect --pack ./packs/frontend
agent-deploy pack validate --pack ./packs/frontend
agent-deploy pack inspect --externals ./.agents/externals
agent-deploy plan  --target codex --profile developer --pack ./packs/frontend --modules frontend-team-pack-review-checklist
agent-deploy apply --target codex --profile developer --pack ./packs/frontend --dry-run
agent-deploy apply --target codex --profile developer --pack ./packs/frontend --conflict-resolution ./conflicts.reviewed.json
```

### 5.2 Later convenience

```text
agent-deploy plan --target codex --profile developer --pack ./packs/frontend --enable-pack-extensions
```

`--enable-pack-extensions` should be unavailable for `candidate` packs.

## 6. Validation pipeline

Validation runs before planning file operations:

```text
pack.json schema
  → path safety / symlink guard for pack root
  → manifest validation inside pack
  → asset frontmatter schema validation
  → catalog parity validation
  → cross-pack composition validation
  → target destination collision validation
```

Blocking errors:

- missing `pack.json`
- unknown pack schema version
- absolute path or `..` path
- symlink escaping pack root
- missing asset path
- module/profile unknown reference
- module id or asset id collision
- destination collision
- `confidential` asset in default profile extension
- executable hook/script request

Non-blocking warnings during pilot:

- `draft` stability in explicitly requested module
- missing optional `source`/`license`
- catalog `reviewStatus=candidate` outside default profile

## 7. Security policy

V1 asset packs are declarative only.

Allowed:

```text
*.md assets
JSON manifests/catalog/schemas
approved mcp JSON only when target policy allows it
```

Denied by default:

```text
scripts/hooks/commands that execute during install
postinstall lifecycle
network fetch during apply
absolute paths
symlinks escaping pack root
hidden credential files
confidential shared documents in default profiles
```

If a pack contains executable helper files, they are treated as inert documentation unless a future explicit policy allows them.

## 7.1 Shared-approved governance

`shared-approved` means a pack is safe for broad internal reuse, not merely that it validates technically.

Approval criteria:

- `pack.json` includes stable id/version, owner, source, license, `reviewStatus=approved`, and `packType=shared-approved`.
- Pack validation, catalog parity, path safety, symlink guard, and destination conflict checks pass.
- Source attribution and license are acceptable for internal reuse.
- Assets have owner/audience/stability/review metadata and no unresolved catalog/module/profile drift.
- Security review finds no secrets, credentials, customer-private data, hidden install behavior, escaping links, or unsafe MCP defaults.
- Any `defaultProfileExtensions` are reviewed separately and include only non-confidential assets.
- Conflict resolution decisions are recorded with reviewer, date, rationale, pack id, and digest.

Candidate promotion flow:

```text
externals / candidate
  → validate and normalize metadata
  → resolve conflicts explicitly
  → dry-run affected targets/profiles
  → approve pack.json + catalog reviewStatus
  → record digest and approval evidence
  → publish as shared-approved
```

Project-local packs can inspire shared assets, but they do not become shared defaults automatically.

## 8. Install-state provenance

Extend install-state with pack source metadata:

```json
{
  "source": {
    "repoVersion": "0.1.0",
    "repoCommit": "abc1234",
    "manifestVersion": 1,
    "packs": [
      {
        "id": "frontend-team-pack",
        "version": "0.1.0",
        "packType": "shared-approved",
        "source": "git+ssh://example/company/frontend-agent-pack",
        "digest": "sha256:...",
        "root": "/abs/path/to/pack"
      }
    ]
  }
}
```

Digest is computed over normalized pack files after excluding `.git/`, OS metadata, and temporary files.

## 9. Architecture boundary

Future implementation should follow the project installer architecture:

```text
CLI
  → PackResolutionUseCase
  → PackPolicy / ManifestCompositionPolicy
  → PackFileSystemAdapter / TargetAdapter
```

Suggested modules:

```text
src/packs/pack-manifest.js       # load/parse pack.json
src/packs/pack-validator.js      # pack-local validation
src/packs/pack-composer.js       # base + packs virtual manifest composition
src/packs/digest.js              # deterministic digest
scripts/check-pack.js            # CI/CLI validation entry
```

The planner should receive a composed manifest object instead of reading global state directly. That keeps pack logic out of target adapters.

## 10. Migration path

1. Keep existing bundled flow unchanged.
2. Add read-only `pack validate` and CI checker.
3. Add `--pack` to plan/apply but require explicit module/profile selection.
4. Add install-state pack provenance.
5. Add `shared-approved` profile extension opt-in.
6. Only after governance approval, allow company release bundles to include curated shared packs.
