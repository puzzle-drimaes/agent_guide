# AI-Knowhow / Shared Asset Pack Design

This document summarizes how `agent-deploy` should apply AI-Knowhow or shared Markdown asset packs.
The full SDD design lives in:

```text
docs/specs/external-shared-asset-packs/
```

1차 도입 공유 폴더(Google Drive AI-Knowhow)에 `.md`를 올리고 고르는 운영 기준은
[SHARED_FOLDER_GUIDE.md](SHARED_FOLDER_GUIDE.md) 참고. 이 문서는 그 파일을 `AI-Knowhow`로 적용하는 단계의 상세 규칙이다.

## Principle

```text
bundled assets are the base layer
external/shared packs are read-only overlays
conflicts fail closed
all writes still go through plan/apply/path-safety/install-state
```

## Pack layout

```text
my-pack/
  pack.json
  assets/
    prompts/
    templates/
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
  schemas/             # optional, reference-only in v1
```

## AI-Knowhow folder for shared Markdown

`AI-Knowhow` is the single project-local holding area for **all shared Markdown files imported from Google Drive, GitHub candidate branches, or another teammate** that a user wants the agent to consider applying.
Contributors do not need to create a full pack first; they can drop shared `*.md` files here:

```text
<repo>/AI-Knowhow/
  skills/
    my-review-skill.md        # or my-review-skill/SKILL.md
  docs/
    onboarding-checklist.md
    debugging-playbook.md
  prompts/
    weekly-report.md
```

Rules:

- `AI-Knowhow` is the candidate area for shared Markdown, not a canonical rule/document folder.
- Every shared Markdown proposal should enter through `AI-Knowhow` before it is applied to the project.
- Files in `AI-Knowhow` never overwrite bundled `assets/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` directly.
- The agent treats `AI-Knowhow` as a `candidate` asset pack and validates/summarizes files before apply.
- If a Markdown file has no frontmatter, the agent proposes draft frontmatter instead of mutating existing rules.
- Accepted files are installed under a target-specific shared asset area, not mixed into canonical rule folders.

Recommended target placement after apply:

```text
Codex:  .agents/shared/<pack-id>/...
Claude: .claude/shared/<pack-id>/...
Gemini: .gemini/shared/<pack-id>/...
Cursor: .cursor/shared/<pack-id>/...
Kiro:   .kiro/shared/<pack-id>/...
```

## Conflict resolution policy

Conflicts are not decided silently. When a proposed Markdown file conflicts with an existing document,
rule, module, catalog id, or install destination, the agent must ask the user and record the decision.

Default choices:

```text
1. keep-existing     기존 문서/룰 유지, 제안 파일은 적용하지 않음
2. add-namespaced    제안 파일을 shared/<pack-id>/ 아래 별도 문서로 추가
3. rename-proposed   id/path/title을 바꿔 충돌 제거 후 추가
4. replace-existing  기존 문서를 대체 (canonical rule은 governance 승인 없이는 금지)
```

Default recommendation is `add-namespaced` for skills/docs and `keep-existing` for rules.
`replace-existing` must be explicit and should be unavailable for company canonical rules unless a separate
approved rule-change workflow is used.

The decision should be written to pack provenance, for example:

```json
{
  "conflictResolutions": [
    {
      "proposed": "AI-Knowhow/docs/onboarding-checklist.md",
      "conflictsWith": ".agents/shared/team/onboarding-checklist.md",
      "decision": "add-namespaced",
      "decidedBy": "user",
      "reason": "Keep existing onboarding guide and add team-specific variant"
    }
  ]
}
```

Runtime capture is available with `--conflict-resolution <json-file>`. The JSON file may be either an array of
decision records or an object with a `conflictResolutions` array. These records are written to
`install-state` under `source.conflictResolutions[]`.

Example:

```text
node src/cli.js apply \
  --target codex \
  --profile team-valid \
  --pack ./packs/team \
  --conflict-resolution ./conflicts.reviewed.json
```

Runtime behavior: `keep-existing` resolves the matched pack conflict by keeping the base asset and transforming the
matched pack module/file operation into a visible `skip` operation with a reason in install-state. `add-namespaced`
can resolve target-destination/asset-path collisions by installing the selected pack copy-file operations under
`shared/<pack-id>/...`. Other decisions are still provenance-only in v1 and require the pack contents to already
reflect the chosen resolution before planning. Unresolved physical conflicts still fail closed.

## Trust levels

| Pack type | Purpose | Default profile extension |
|---|---|---|
| `shared-approved` | governance-approved internal shared assets | opt-in only |
| `project-local` | project/team-specific assets | no |
| `candidate` | shared document review/promotion candidates | no |

## Governance workflow

Asset packs move through explicit trust states. A pack must not become `shared-approved` only because it installs
successfully; it needs content, provenance, security, and conflict review.

### Shared-approved 승인 체크리스트

A pack must not become `shared-approved` only because it installs successfully (위 Governance workflow 원칙).
아래 체크리스트를 모두 통과해야 `packType: "shared-approved"`로 승격할 수 있다.

각 항목은 다음으로 구분한다.

```text
[도구]   node scripts/check-pack.js 또는 apply 파이프라인이 자동으로 강제한다.
[승인자] 도구가 강제하지 못하므로 사람이 직접 확인하고 기록해야 한다.
```

#### A. 승인자 (approvers)

누가 승인하는가. 영향 범위가 클수록 필요한 승인자가 늘어난다.

- [ ] [승인자] content owner / team lead 승인 (모든 pack 필수)
- [ ] [승인자] platform 또는 agent-deploy maintainer 승인 (모든 pack 필수)
- [ ] [승인자] security/governance reviewer 승인 — pack이 shared profile, MCP, rule, 또는 confidential 도메인에 영향을 줄 때 필수
- [ ] [승인자] 승인자가 작성자 본인이 아닌지 확인 (self-approve 금지)

#### B. pack 메타데이터

- [ ] [도구] `node scripts/check-pack.js --pack <pack-root>` 가 blocking error 없이 통과
- [ ] [도구] `pack.json` 필수 필드 존재: `schemaVersion`, `id`, `title`, `version`, `owner`, `stability`, `reviewStatus`, `packType`
- [ ] [도구] `packType: "shared-approved"` 이면 `reviewStatus: "approved"` 강제됨
- [ ] [승인자] `source`, `license` 필드가 채워져 있고 사내 재사용에 충분한지 확인
      (주의: 현재 schema는 `source`/`license`를 required로 강제하지 않으므로 승인자가 직접 확인한다)
- [ ] [승인자] `version`이 semantic version이며 승인 대상 변경(content/profile 확장/conflict 결정)에 맞게 bump 됐는지 확인
- [ ] [승인자] 모든 asset의 frontmatter/catalog 메타데이터(owner, audience, stability, review status, module/profile 참조)가 적절한지 확인

#### C. security review 기준

- [ ] [승인자] secret, credential, token, private key 미포함 (현재 자동 secret scan 미구현 → 직접 확인 필수)
- [ ] [승인자] 고객 개인정보 / 미공개 계약 / 민감 재무·법무 검토 전 자료 미포함
- [ ] [도구] install-time script / hook / postinstall / network fetch 없음 (v1 금지)
- [ ] [도구] 절대경로 / `..` escape 없음, symlink가 pack root를 벗어나지 않음
- [ ] [도구] module / asset / profile / target destination 충돌은 fail-closed
- [ ] [승인자] `confidential` 공유 문서가 default profile extension에 포함되지 않았는지 확인
- [ ] [도구] `defaultProfileExtensions`는 shared-approved pack에서만 허용되고, 기존 bundled base profile(developer/product/business 등)·기존 module만 참조함을 강제

#### D. conflict 검토

- [ ] [승인자] 모든 conflict 결정(keep-existing / add-namespaced / rename-proposed / replace-existing)이 검토됨
- [ ] [승인자] `replace-existing`은 governance 승인이 있을 때만 사용하고, canonical company rule에는 금지
- [ ] [도구] 미해결 충돌 없음 (있으면 fail-closed로 승격 불가)

#### E. 승인 증거 / digest 기록 (approval evidence)

승인은 재현 가능하도록 기록으로 남긴다. pack PR / review issue 또는 governance registry에 아래를 기록한다.

- [ ] reviewer (승인자 이름/역할, A에서 확인한 모든 승인자)
- [ ] approval date
- [ ] pack digest — scratch project에 한 번 apply한 뒤 `install-state`의 `source.packs[].digest` 값(`sha256:<64-hex>`)을 기록한다.
      (digest는 apply 시에만 install-state에 기록되며, `check-pack` 출력이나 dry-run에는 나오지 않는다)
- [ ] source / license
- [ ] rationale (승인 근거)
- [ ] conflict 결정 기록 (아래 conflict resolution record policy 형식)

digest 확보 예시:

```text
node src/cli.js apply --target codex --profile developer \
  --pack <pack-root> --enable-pack-extensions --project /tmp/pack-review
grep '"digest"' /tmp/pack-review/.agent-deploy/install-state.json
```

승인 기록 예시:

```json
{
  "packId": "team-frontend-pack",
  "version": "1.0.0",
  "packDigest": "sha256:<64-hex>",
  "reviewers": ["frontend-lead", "agent-deploy-maintainer", "security-reviewer"],
  "approvedAt": "2026-06-22",
  "source": "<internal repo/url>",
  "license": "internal",
  "rationale": "Frontend review checklist 표준화, shared profile 영향 검토 완료",
  "conflictResolutions": []
}
```

### Candidate to shared-approved promotion flow

```text
AI-Knowhow or candidate pack
  → scan/validate candidate metadata
  → normalize frontmatter/catalog/module ids
  → run conflict detection and choose explicit resolutions
  → dry-run target installs for affected profiles/tools
  → update pack.json to shared-approved + reviewStatus approved
  → record pack digest, reviewer, approval date, source/license, and conflict decisions
  → publish or include the approved pack
```

Promotion rules:

- Candidate content is never added to builtin profiles directly.
- Project-local learnings can be copied into a new candidate pack, but project-local packs themselves do not become shared defaults automatically.
- Version must be bumped when approved content, profile extensions, or conflict decisions change.
- `defaultProfileExtensions` should be added only after the pack is approved and the target profile impact is reviewed.

### Conflict resolution record policy

Every non-trivial conflict decision should be recorded with enough context to reproduce the review. Record the decision
in the pack PR/review issue or governance registry, and pass the same record to `--conflict-resolution` when applying
so install-state can mirror the approved provenance.

Required fields:

```json
{
  "proposed": "AI-Knowhow/docs/onboarding-checklist.md",
  "conflictsWith": ".agents/shared/team/onboarding-checklist.md",
  "decision": "add-namespaced",
  "decidedBy": "platform-team",
  "decidedAt": "2026-06-22",
  "reason": "Keep existing onboarding guide and add team-specific variant",
  "packId": "team-onboarding-pack",
  "packDigest": "sha256:<64-hex>"
}
```

The same record shape can be passed to `--conflict-resolution` after review:

```json
{
  "conflictResolutions": [
    {
      "proposed": "AI-Knowhow/docs/onboarding-checklist.md",
      "conflictsWith": ".agents/shared/team/onboarding-checklist.md",
      "decision": "add-namespaced",
      "decidedBy": "platform-team",
      "decidedAt": "2026-06-22",
      "reason": "Keep existing onboarding guide and add team-specific variant",
      "packId": "team-onboarding-pack",
      "packDigest": "sha256:<64-hex>"
    }
  ]
}
```

Decision constraints:

- `keep-existing`: default for canonical rule conflicts and unclear ownership.
- `add-namespaced`: default for useful team-specific skills/docs/prompts.
- `rename-proposed`: use for id/path/title collisions when both assets should remain discoverable.
- `replace-existing`: requires explicit governance approval; forbidden for canonical company rules outside the canonical rule-change workflow.

## Application flow

```text
pack inspect / validate
  → compose base + requested packs
  → resolve profile/modules
  → dry-run plan
  → apply
  → install-state records pack provenance
```

## Profile extension opt-in

Pack modules and pack-local profiles remain explicit by default. A `shared-approved` pack may additionally declare
`defaultProfileExtensions` in `pack.json`, but those extensions only apply when the user passes
`--enable-pack-extensions`.

Example:

```text
node src/cli.js plan --target codex --profile developer --pack ./packs/frontend --enable-pack-extensions
```

Rules:

- only `shared-approved` packs may declare/apply `defaultProfileExtensions`
- extension targets must be existing bundled base profiles such as `developer`, `product`, or `business`
- `project-local` and `candidate` packs are rejected if they declare `defaultProfileExtensions`
- without `--enable-pack-extensions`, approved pack modules still require explicit `--modules` or pack-local profile selection

## Pack digest provenance

`agent-deploy` calculates a normalized SHA-256 digest for every requested pack and records it in
`install-state` under `source.packs[].digest`.

Digest normalization rules:

- file paths are sorted and normalized to `/` separators
- text line endings are normalized to LF before hashing
- `.git/`, other VCS metadata, OS metadata files such as `.DS_Store`/`Thumbs.db`, and editor temp files are excluded
- the pack root path itself is not part of the digest

Install-state pack provenance includes:

```json
{
  "id": "team-valid-pack",
  "version": "0.1.0",
  "packType": "project-local",
  "digest": "sha256:<64-hex>",
  "source": null,
  "root": "/absolute/path/to/pack"
}
```

## Safety rules

- No install-time scripts, hooks, postinstall, or network fetch in v1.
- No absolute paths or `..` escapes.
- Symlinks must not escape the pack root.
- Module, asset, profile, and target destination collisions fail.
- `confidential` shared documents cannot be included in default profile extensions.
- Candidate packs must be explicitly requested and cannot mutate builtin profiles.

## Future CLI shape

```text
agent-deploy pack validate --pack ./packs/frontend
agent-deploy pack inspect --ai-knowhow ./AI-Knowhow
agent-deploy plan  --target codex --profile developer --pack ./packs/frontend --modules frontend-team-pack-review-checklist
agent-deploy apply --target codex --profile developer --pack ./packs/frontend --dry-run
agent-deploy plan  --target codex --profile developer --pack ./packs/frontend --enable-pack-extensions
agent-deploy apply --target codex --profile developer --pack ./packs/frontend --conflict-resolution ./conflicts.reviewed.json
```

## Phase 1 validation entry point

Implemented validation-only commands:

```text
node scripts/check-pack.js --pack ./packs/frontend
node scripts/check-pack.js --ai-knowhow ./AI-Knowhow
```

These commands are read-only. They validate pack structure, module/profile references,
asset metadata, catalog parity, path safety, and base-bundle conflicts, or generate draft
candidate metadata from shared Markdown without modifying source files.

## Phase 2 planner/apply entry point

Implemented planner integration:

```text
node src/cli.js plan  --target codex --pack ./packs/frontend --modules frontend-team-pack-review-checklist
node src/cli.js apply --target codex --pack ./packs/frontend --profile frontend-review --dry-run
```

Pack modules and pack-local profiles must still be selected explicitly. The composed plan keeps the base bundle as the
base layer, validates pack conflicts before planning, reads pack assets from their own `assets/` root, and records
`source.packs` provenance, including normalized pack digests, when applied.

## Phase 3 provenance/governance entry point

Implemented profile extension opt-in:

```text
node src/cli.js plan  --target codex --profile developer --pack ./packs/frontend --enable-pack-extensions
node src/cli.js apply --target codex --profile developer --pack ./packs/frontend --enable-pack-extensions --dry-run
```

Only `shared-approved` pack extensions are applied. Candidate and project-local packs can still be used explicitly,
but they cannot mutate builtin profile defaults.

Implemented runtime conflict-resolution capture:

```text
node src/cli.js apply --target codex --profile developer --pack ./packs/frontend --conflict-resolution ./conflicts.reviewed.json
```

Invalid decision values are rejected before apply. Valid records are written to `source.conflictResolutions[]` in
install-state. `keep-existing` records transform matched colliding pack operations into `skip+keep-existing` skip
ops with explicit reasons, while `add-namespaced` records transform colliding copy-file destinations to
`shared/<pack-id>/...`.
