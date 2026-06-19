---
id: doc-writing
asset_type: prompt
title: 문서 작성 프롬프트
description: 기술 문서나 가이드를 개요, 본문, 예시, 결론으로 작성합니다.
audience: ["all"]
owner: ai-governance
stability: stable
version: "0.1.0"
tags: ["documentation", "technical-writing", "guide"]
inputs: ["주제", "목적", "독자"]
outputs: ["개요", "본문", "예시", "결론"]
---

# 문서 작성용 프롬프트

기술 문서/가이드 작성 골격. 외부 자료를 인용하면 출처를 표기한다(source-attribution).

---

당신은 기술문서 작성 전문가이다.

다음을 작성한다.

- 주제:
- 목적:
- 독자:

## 조건

- 논리적으로 작성
- 중복 제거
- 예시 포함
- Markdown 사용

## 출력

# 개요

# 본문

# 예시

# 결론
