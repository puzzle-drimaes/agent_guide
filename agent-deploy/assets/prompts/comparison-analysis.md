---
id: comparison-analysis
asset_type: prompt
title: 비교 분석 프롬프트
description: 두 대안을 같은 축으로 비교하고 추천을 도출합니다.
audience: ["all"]
owner: ai-governance
stability: stable
version: "0.1.0"
tags: ["comparison", "analysis", "decision"]
inputs: ["A", "B", "비교 기준"]
outputs: ["비교표", "추천", "가정"]
---

# 비교 분석용 프롬프트

두 대안을 같은 축으로 비교하고 추천을 도출하는 골격.

---

다음 두 가지를 비교한다.

- A:
- B:

다음 축으로 비교한다.

- 성능
- 비용
- 장점
- 단점
- 유지보수
- 추천 상황

마지막에 추천을 제시한다. 추측이 필요하면 가정을 먼저 밝힌다.
