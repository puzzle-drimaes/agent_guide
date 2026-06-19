# External / Shared Asset Packs — Review

## Spec coverage review

| Requirement | Covered by design |
|---|---|
| Pack structure | `design.md` section 3 |
| Manifest/catalog/profile merge | `design.md` section 4 |
| External Markdown proposals | `design.md` section 3.1 |
| User-driven conflict resolution | `design.md` section 4.4 |
| Dry-run/apply flow | `design.md` section 5 |
| Validation before apply | `design.md` section 6 |
| Security restrictions | `design.md` section 7 |
| Install-state provenance | `design.md` section 8 |
| Architecture boundary | `design.md` section 9 |

## Risk review

### R1. Pack silently changes company defaults

Mitigation: pack-local profiles only by default. Builtin profile extension requires `shared-approved` and explicit `--enable-pack-extensions`.

### R2. Sensitive shared documents leak into default installs

Mitigation: `confidential` assets are forbidden in default profile extensions. Candidate packs cannot extend builtin profiles.

### R3. Path escape or symlink attack

Mitigation: pack validation reuses path-safety/symlink guard and rejects absolute/`..` paths before planning.

### R4. Destination collisions across packs

Mitigation: composition and target planning fail on module id, asset id, and destination collisions.

### R5. Pack applies executable behavior

Mitigation: v1 packs are declarative only; install-time hooks/scripts/postinstall/network fetch are denied.

### R6. Drop-in files overwrite existing rules or docs

Mitigation: `.agent-packs/externals/` is a candidate area only. Proposed files install under target-specific
`shared/<pack-id>/` by default. Canonical rule replacement is blocked unless a separate approved rule-change
workflow is used.

### R7. Agent chooses conflict behavior without user intent

Mitigation: conflict resolution requires an explicit user decision. The decision and reason are recorded in
pack provenance/install-state.

## Open decisions for implementation

- Whether pack profiles should be addressed as `<pack-id>:<profile>` or plain profile ids in the CLI.
- Whether `templates/` should become a first-class target path or remain under `prompts/` for v1.
- Whether pack digest should include generated catalog files or only source assets/manifests.
- Whether `shared-approved` pack approval lives in GitHub review, Notion registry, or both.

## Review conclusion

The design is suitable as a safe v1 direction because it preserves the existing bundled flow,
keeps external packs read-only and declarative, and blocks automatic default-profile mutation unless a pack is explicitly approved.
