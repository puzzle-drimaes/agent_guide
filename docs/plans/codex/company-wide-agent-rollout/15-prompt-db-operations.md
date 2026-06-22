# 15. Prompt DB 운영 기준

## 목적

재사용 가능한 프롬프트가 개인 대화창에 갇히지 않고 회사 지식 자산으로 축적·검증·승격되게 한다.
이 문서는 [06-knowledge-kpi-system.md](06-knowledge-kpi-system.md) §5 "프롬프트 자산화"를 운영 가능한 수준으로 구체화한다.

연동 도구(D05 기준):

```text
Notion: Prompt DB 본체(필드/상태/검색)
GitHub: 승격된 prompt가 assets/skills/company-* 로 PR/배포되는 경로
Slack:  #ai-knowhow 등록/회고, #ai-governance 승격/폐기 결정 공유
```

관련 skill:

```text
prompt-asset        등록(capture) — 1회성 프롬프트를 Prompt DB 엔트리로 정리
prompt-db-curation  정리(hygiene) — 중복/통합/deprecate/승격 후보/태깅 누락 점검
```

## 1. 필드 정의

Notion Prompt DB 스키마. `필수`는 등록(신규 작성) 시점 기준이며, `(운영)` 표시 필드는 사용되면서 채워진다.

| 필드 | Notion 타입 | 필수 | 채우는 주체 | 설명 |
|---|---|---|---|---|
| 이름 | Title | 필수 | 작성자 | 검색 가능한 짧은 이름 |
| 목적 | Text | 필수 | 작성자 | 어떤 작업을 위한 프롬프트인가 |
| 대상 직무 | Multi-select | 필수 | 작성자 | developer / product / business / governance |
| AI 도구 | Multi-select | 필수 | 작성자 | Claude / Codex / Gemini |
| 권장 profile | Select | 필수 | 작성자 | minimal / developer / product / business / governance |
| 프롬프트 본문 | Text | 필수 | 작성자 | 회사 prompt skeleton(_universal-template) 기반 작성 |
| 입력 예시 | Text | 필수 | 작성자 | 민감정보 제거/placeholder 처리 |
| 출력 예시 | Text | 권장 | 작성자 | 기대 결과 샘플 |
| 출처/라이선스 | Text/URL | 조건부 필수 | 작성자 | 외부 자료 기반이면 source-attribution 규칙대로 기록 |
| 상태 | Status | 필수 | 작성자→reviewer | draft / active / deprecated / promoted |
| 작성자 | Person | 필수 | 자동/작성자 | 최초 작성자 |
| Owner | Person | 필수 | reviewer | 엔트리 유지 책임자(작성자와 다를 수 있음) |
| Reviewer | Person | 권장 | governance | 정리/승격 검토자 |
| 성공률 | Number(%) | (운영) | 사용자/curation | 사용 결과 기반 태깅 |
| 사용 횟수 | Number | (운영) | 사용자/curation | 재사용 집계 |
| 사용자 수 | Number | (운영) | curation | 서로 다른 사용자 수(승격 판단용) |
| 최종 수정일 | Last edited time | 자동 | Notion | 문구 안정성 판단용 |
| 승격 링크 | URL | 조건부 | reviewer | 승격 시 `company-*` PR 링크 |

```text
- "조건부 필수": 출처/라이선스는 외부 자료 기반일 때만, 승격 링크는 promoted일 때만 필수.
- 성공률/사용 횟수/사용자 수는 신규 등록 시 비워 두고 운영 중 채운다.
```

## 2. 등록 기준

### 언제 등록하는가

`prompt-asset` skill의 capture 조건과 동일하다. **모두** 만족할 때 등록한다.

```text
- 재사용 가능하다(한 번 쓰고 버릴 프롬프트가 아니다).
- 좋은 결과를 냈다.
- 결과가 일반화 가능하다(1회성 데이터에 묶여 있지 않다).
```

### 등록 시 필수 충족

```text
- §1의 `필수` 필드가 모두 채워진다.
- 입력/본문에서 민감정보를 제거하거나 placeholder로 치환한다.
  (고객 개인정보, credential, 미공개 계약/재무/법무 자료 금지)
- 외부 자료 기반이면 출처/라이선스를 source-attribution 규칙대로 기록한다.
- 상태는 draft로 시작한다.
```

### draft → active 승인

```text
- reviewer 또는 계정 담당자가 필수 필드/민감정보/출처를 1차 확인하면 active로 전환한다.
- 미충족 엔트리는 draft로 남기고 작성자에게 보완 요청한다.
```

### 등록 KPI(D12 연계)

```text
- Prompt DB 등록: 월 10개 이상
- 성공률 태깅 비율 / 출처 표기율 90% 이상
```

## 3. 승격 기준

검증된 엔트리를 회사 표준 skill/agent(`assets/skills/company-*`)로 승격한다. 무단 생성은 금지한다.

### 승격 게이트 (prompt-asset / prompt-db-curation 공통)

```text
- 사용 횟수 ≥ 5
- 서로 다른 사용자 ≥ 2명
- 성공률 ≥ 80%
- 문구 안정(최근 수정 없이 재사용)
→ 모두 충족 시에만 사람 승인 하에 승격
```

```text
임계값(5 / 2명 / 80%)은 채택된 운영 기본값이며, Pilot 종료 후 실제 사용 편차/품질을
기준으로 분기 거버넌스 리뷰에서 재조정한다(D12 재조정 원칙과 동일).
```

### 승격 흐름(D11 결정)

```text
Prompt DB 등록
  → 사용 횟수/성공률 태깅
  → 월간 데모 또는 분기 리뷰에서 검증
  → owner 지정
  → assets/skills/company-* 로 PR
  → installer 배포
```

### 승격 통과 조건

```text
- 승격된 asset은 source-attribution, security, knowledge-sharing rule을 통과해야 한다.
- 승격 후 원본 엔트리는 상태를 promoted로 바꾸고 승격 링크(PR)를 연결한다.
```

### deprecate 기준

```text
- 성공률 낮음 / 장기 미사용 / 더 나은 대체본 존재 시 deprecated로 표시한다.
- 중복/유사 엔트리는 통합 후보로 묶어 하나로 합친다(prompt-db-curation).
```

## 4. Owner / Reviewer 역할

[13-governance-and-roadmap.md](13-governance-and-roadmap.md) RACI와 정합하게 운영한다.

| 역할 | 담당 | 책임 |
|---|---|---|
| 작성자 | 엔트리 등록자 | 필수 필드 작성, 민감정보 제거, 출처 표기 |
| Owner | reviewer가 지정 | 엔트리 정확성/최신성 유지, 승격 시 PR owner |
| Reviewer | AI governance / 계정 담당자 | draft→active 승인, 정리(중복/deprecate), 승격 게이트 판정 |
| Governance(Accountable) | PMO / AI governance | 승격·폐기 최종 결정, 분기 리뷰에서 품질 점검 |

```text
- 작성자와 Owner는 다를 수 있다. 승격 시 Owner를 명시적으로 지정한다.
- 승격/폐기 결정은 #ai-governance에 공유한다.
- 정기 정리는 prompt-db-curation skill로 분기 거버넌스 리뷰 전에 수행한다.
```

## 5. 상태 전이(lifecycle)

```text
draft ──(reviewer 1차 확인)──> active
active ──(승격 게이트 충족 + 승인)──> promoted
active ──(저품질/미사용/대체본)──> deprecated
promoted: company-* asset으로 배포됨, 원본은 보존 + 승격 링크 연결
```

## 완료 기준

```text
- Notion Prompt DB가 §1 필드/타입/상태로 생성된다.
- 등록 기준/승격 게이트/역할이 운영자에게 공유된다.
- prompt-asset(등록), prompt-db-curation(정리) skill과 연결된다.
- 첫 분기 거버넌스 리뷰에서 임계값을 재검토할 수 있다.
```
