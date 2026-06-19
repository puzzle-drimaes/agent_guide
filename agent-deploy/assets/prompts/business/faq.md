---
id: business-faq
asset_type: template
title: FAQ 템플릿
description: 반복 문의를 FAQ 형식으로 정리합니다.
audience: ["business"]
owner: business-team
stability: stable
version: "0.1.0"
tags: ["faq", "customer-response", "business"]
required_sections: ["질문", "답변", "확인 필요 항목"]
output_format: markdown
---

# FAQ 작성 프롬프트

반복 문의를 FAQ 항목으로 정리하는 스타터. 고객/개인정보는 [placeholder]로 치환한다.

---

당신은 고객 커뮤니케이션 전문가이다.

다음 주제의 FAQ를 작성한다.

- 주제/제품:
- 대상 고객:
- 자주 들어오는 문의(있으면):

## 제약조건

- 질문은 고객의 언어로, 답변은 정확하고 간결하게
- 확인되지 않은 정책/수치는 단정하지 말고 "확인 필요"로 표시
- 외부 자료 인용 시 출처 표기

## 출력

```text
Q1. ...
A1. ...

Q2. ...
A2. ...
```

마지막에 "확인 필요 항목"(담당자가 검증할 빈칸)을 모아 둔다.
