# External / Shared Asset Pack Design

This document summarizes how `agent-deploy` should apply external or shared Markdown asset packs.
The full SDD design lives in:

```text
docs/specs/external-shared-asset-packs/
```

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

## Externals folder for imported Markdown

`externals` is the single project-local holding area for **all Markdown files imported from outside the current project** that a user wants the agent to consider applying.
Contributors do not need to create a full pack first; they can drop shared `*.md` files here:

```text
<repo>/.agent-packs/externals/
  skills/
    my-review-skill.md        # or my-review-skill/SKILL.md
  docs/
    onboarding-checklist.md
    debugging-playbook.md
  prompts/
    weekly-report.md
```

Rules:

- `externals` is the candidate area for imported Markdown, not a canonical rule/document folder.
- Every external Markdown proposal should enter through `externals` before it is applied to the project.
- Files in `externals` never overwrite bundled `assets/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` directly.
- The agent treats `externals` as a `candidate` asset pack and validates/summarizes files before apply.
- If a Markdown file has no frontmatter, the agent proposes draft frontmatter instead of mutating existing rules.
- Accepted files are installed under a target-specific shared asset area, not mixed into canonical rule folders.

Recommended target placement after apply:

```text
Codex:  .agents/shared/<pack-id>/...
Claude: .claude/shared/<pack-id>/...
Gemini: .gemini/shared/<pack-id>/...
Cursor: .cursor/shared/<pack-id>/...
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
      "proposed": ".agent-packs/externals/docs/onboarding-checklist.md",
      "conflictsWith": ".agents/shared/team/onboarding-checklist.md",
      "decision": "add-namespaced",
      "decidedBy": "user",
      "reason": "Keep existing onboarding guide and add team-specific variant"
    }
  ]
}
```

## Trust levels

| Pack type | Purpose | Default profile extension |
|---|---|---|
| `shared-approved` | governance-approved internal shared assets | opt-in only |
| `project-local` | project/team-specific assets | no |
| `candidate` | shared document review/promotion candidates | no |

## Application flow

```text
pack inspect / validate
  → compose base + requested packs
  → resolve profile/modules
  → dry-run plan
  → apply
  → install-state records pack provenance
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
agent-deploy pack inspect --externals ./.agent-packs/externals
agent-deploy plan  --target codex --profile developer --pack ./packs/frontend --modules frontend-team-pack-review-checklist
agent-deploy apply --target codex --profile developer --pack ./packs/frontend --dry-run
```

`--enable-pack-extensions` may be added later for approved shared packs only.
