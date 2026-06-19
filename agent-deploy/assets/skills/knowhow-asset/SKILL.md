---
name: knowhow-asset
description: Capture personal or team knowhow as a sanitized Markdown asset candidate and decide whether it can be promoted to a shared catalog/profile asset. Triggers on "knowhow 공유", "노하우 자산화", "promote knowhow", "make this knowhow reusable".
allowed-tools: ["Read"]
argument-hint: "[knowhow note / workflow / reusable practice]"
---

# Knowhow Asset (Candidate → Promotion)

Use this skill when a person or team wants to turn reusable working knowledge into a
shareable Markdown asset. A knowhow item starts as a candidate, not as a default
bundle asset. Promotion requires sanitization, evidence, ownership, and review.

## Required context

Read the installed common rules for the current harness first:

```text
Codex:  .agents/rules/common/security.md + knowledge-sharing.md + source-attribution.md
Claude: .claude/rules/common/security.md + knowledge-sharing.md + source-attribution.md
Gemini: .gemini/rules/common/security.md + knowledge-sharing.md + source-attribution.md
Cursor: .cursor/rules/common-security.mdc + common-knowledge-sharing.mdc + common-source-attribution.mdc
```

Also use the installed prompt/template schema guidance when available:

```text
agent-deploy/docs/ASSET_SCHEMA_AND_CATALOG.md
```

## Intake gate

Capture only when all are true:

1. The knowhow is reusable beyond one chat, task, or person.
2. The content can be shared after removing secrets, customer identifiers, private keys,
   unreleased contracts, and other sensitive details.
3. An owner is known, and at least one reviewer can validate the practice.
4. The intended audience is clear: developer, product, business, governance, or all.
5. External sources, if any, can be cited with source and license/usage constraints.

If any gate fails, do not promote. Produce a cleanup checklist instead.

## Classify the asset type

Choose the narrowest type that matches the reuse shape:

```text
prompt    → reusable instruction for generating an output
template  → fill-in document skeleton
skill     → repeatable workflow an agent should follow
knowhow   → team practice, checklist, playbook, heuristic, or troubleshooting note
agent     → focused subagent persona with least-agency boundaries
```

Use `knowhow` when the value is mainly human/team practice rather than a prompt body or
agent procedure.

## Draft knowhow frontmatter

For a knowhow candidate, produce this frontmatter. Keep `promotion_status: candidate`
until review evidence exists.

```yaml
---
id: <stable-kebab-case-id>
asset_type: knowhow
title: <human readable title>
description: <what this helps with>
audience: ["developer"]
owner: <team-alias>
stability: draft
version: "0.1.0"
tags: ["knowhow"]
reviewers: ["<reviewer-or-team>"]
promotion_status: candidate
sensitivity: internal
examples: ["<optional fixture or usage note>"]
source: <optional source URL or internal doc>
license: <optional license or usage constraint>
---
```

## Draft body structure

Use this Markdown body unless a more specific structure is needed:

```text
# <Title>

## Problem / Context

## When to use

## Steps / Checklist

## Examples

## Risks / Anti-patterns

## Review notes

## Sources
```

## Promotion bar

Recommend promotion only when the candidate has evidence:

```text
- reused by at least two people or in at least two projects/tasks
- no sensitive data after sanitization
- owner and reviewer approved
- wording is stable enough to version
- target profile/module is clear
- catalog entry and module/profile impact are identified
```

Promotion options:

```text
- keep as candidate knowhow pack
- promote to shared knowhow asset
- convert to prompt/template/skill/agent if that type fits better
- reject/deprecate with reason
```

Do not silently add confidential knowhow to default profiles. If `sensitivity` is
`confidential`, recommend a separately approved internal pack instead.

## Output

```text
Capture decision: capture | cleanup first | skip (reason)
Recommended asset type: knowhow | prompt | template | skill | agent
Sanitization notes:
Draft frontmatter:
Draft body:
Promotion recommendation: not yet | propose promotion | reject (reason)
Catalog/module/profile impact:
```
