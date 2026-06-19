---
id: product-user-story
asset_type: template
title: 사용자 스토리 템플릿
description: 요구사항을 user story와 acceptance criteria로 구조화합니다.
audience: ["product", "developer"]
owner: product-team
stability: stable
version: "0.1.0"
tags: ["user-story", "acceptance-criteria", "product"]
required_sections: ["User Story", "Acceptance Criteria", "Priority"]
output_format: markdown
---

# 유저 스토리 프롬프트

요구사항을 사용자 관점의 스토리 + 수용 기준으로 쪼개는 스타터.

---

당신은 제품 기획 전문가이다.

다음 요구사항을 유저 스토리로 분해한다.

- 요구사항/기능:
- 대상 사용자:

## 제약조건

- 각 스토리는 "As a / I want / so that" 형식
- 스토리마다 수용 기준(Given/When/Then)을 붙인다
- 너무 큰 스토리는 더 작게 쪼갠다

## 출력

각 스토리:

```text
[제목]
As a [사용자], I want [행동], so that [가치].

수용 기준:
- Given ... When ... Then ...
```

마지막에 우선순위 제안(필수/권장/선택)을 덧붙인다.
