# 15. Prompt DB 운영 기준

## 목적

재사용 가능한 프롬프트가 개인 대화창에 갇히지 않고 회사 지식 자산으로 축적·검증·승격되게 한다.
이 문서는 [06-knowledge-kpi-system.md](06-knowledge-kpi-system.md) §5 "프롬프트 자산화"를 운영 가능한 수준으로 구체화한다.

1차 도입 연동 도구:

```text
Google Drive: 사원이 보고 올리고 내려받는 공유 채널
GitHub main: 검증/정리된 공식 배포본
GitHub prompts: prompt 후보 수집 branch
GitHub skills: skill 후보 수집 branch
```

Notion Prompt DB와 Slack 회고/알림은 이후 단계로 미룬다. 이 문서에서 말하는 "Prompt DB"는 1차 도입에서는 Notion이 아니라 GitHub `prompts` branch와 관련 catalog/frontmatter를 뜻한다.
`main`은 protected branch로 운영하며 agent token/agent 작업 세션의 직접 push 대상이 아니다. 실제 GitHub branch와 ruleset 운영 기준은
`agent-deploy/docs/GITHUB_BRANCH_POLICY.md`를 따른다.

관련 skill:

```text
prompt-asset        등록(capture) — 공유 후보를 정제해 Drive 업로드 + GitHub prompts branch commit 형태로 정리
prompt-db-curation  정리(hygiene) — 중복/통합/deprecate/승격 후보/태깅 누락 점검
```

필드 정의에 맞춘 시드 예시 5종(회의 요약 / 고객 응답 / PRD 초안 / 개발 구현 / 리서치 요약):
[docs/prompt-db-samples.md](../../../prompt-db-samples.md). 이후 Notion DB를 만들 때도 재사용할 수 있다.

## 1. 필드 정의

1차 도입에서는 아래 필드를 `.md` frontmatter 또는 본문 상단에 기록한다. `필수`는 등록(신규 작성) 시점 기준이며, `(운영)` 표시 필드는 사용되면서 채워진다. 이후 Notion DB로 옮길 때도 같은 필드를 사용한다.

| 필드 | 저장 위치/타입 | 필수 | 채우는 주체 | 설명 |
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
| 최종 수정일 | Git commit / Last edited time | 자동 | GitHub/Notion | 문구 안정성 판단용 |
| 승격 링크 | URL | 조건부 | reviewer | 승격 시 `main` 병합 commit 또는 company-* 경로 |

```text
- "조건부 필수": 출처/라이선스는 외부 자료 기반일 때만, 승격 링크는 promoted일 때만 필수.
- 성공률/사용 횟수/사용자 수는 신규 등록 시 비워 두고 운영 중 채운다.
```

## 2. 등록 기준

등록 자체는 강제가 아니다. 반복해서 쓸 만한 프롬프트만 자발적으로 등록한다.
아래 `필수` 필드는 "등록을 했을 때" 채워야 하는 항목이지, 등록을 의무화하는 것이 아니다.

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
- 상태는 draft 또는 candidate로 시작한다.
- Google Drive prompts/에 업로드한다.
- GitHub `prompts` branch에 commit/push한다.
- `main`에는 직접 push하지 않는다. agent는 `prompts`/`skills` 또는 별도 작업 branch만 push 대상으로 삼는다.
```

### candidate → main protected merge

```text
- prompts branch에 쌓인 후보는 아직 공식 asset이 아니다.
- reviewer 또는 운영자가 필요할 때 필수 필드/민감정보/출처/중복 여부를 확인한다.
- 통과한 후보만 `main`에 protected merge로 반영한다.
- 미충족 엔트리는 prompts branch에 남기고 작성자에게 보완 요청하거나 deprecated 표시한다.
```

### 등록 참고지표(D12 연계)

```text
- prompts branch 후보 등록 수
- 성공률 태깅 비율 / 출처 표기율
- main protected merge 수
```

## 3. 승격 기준

검증된 엔트리를 회사 표준 skill/agent(`assets/skills/company-*`)로 승격한다. 무단 생성은 금지한다.

### 승격 게이트 (prompt-asset / prompt-db-curation 공통)

```text
- 사용 횟수 ≥ 5
- 서로 다른 사용자 ≥ 2명
- 성공률 ≥ 80%
- 문구 안정(최근 수정 없이 재사용)
→ 모두 충족 시에만 사람 확인 후 main protected merge 또는 승격
```

```text
임계값(5 / 2명 / 80%)은 채택된 운영 기본값이며, Pilot 종료 후 실제 사용 편차/품질을
기준으로 분기 거버넌스 리뷰에서 재조정한다(D12 재조정 원칙과 동일).
```

### 승격 흐름(D11 결정)

```text
Prompt 후보 등록(Drive + GitHub prompts branch)
  → 사용 횟수/성공률 태깅
  → 월간 또는 분기 정리 때 검증
  → owner 지정
  → main protected merge 또는 assets/skills/company-* 로 승격
  → installer 배포
```

### 승격 통과 조건

```text
- 승격된 asset은 source-attribution, security, knowledge-sharing rule을 통과해야 한다.
- 승격 후 원본 엔트리는 상태를 promoted로 바꾸고 main 병합 commit 또는 승격 경로를 연결한다.
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
| Owner | reviewer가 지정 | 엔트리 정확성/최신성 유지, main 병합/승격 시 책임자 |
| Reviewer | AI governance / 계정 담당자 | candidate→main protected merge 검토, 정리(중복/deprecate), 승격 게이트 판정 |
| Governance(Accountable) | PMO / AI governance | 승격·폐기 최종 결정, 분기 리뷰에서 품질 점검 |

```text
- 작성자와 Owner는 다를 수 있다. 승격 시 Owner를 명시적으로 지정한다.
- 1차 도입에서는 승격/폐기 결정을 GitHub commit message 또는 Drive 운영 메모에 남긴다.
- 정기 정리는 prompt-db-curation skill로 분기 거버넌스 리뷰 전에 수행한다.
```

## 5. 상태 전이(lifecycle)

```text
draft/candidate ──(Drive 업로드 + prompts branch commit)──> candidate
candidate ──(운영자 수동 확인 + protected merge)──> main
main ──(승격 게이트 충족 + 승인)──> promoted
candidate/main ──(저품질/미사용/대체본)──> deprecated
promoted: company-* asset으로 배포됨, 원본은 보존 + 병합 commit/승격 경로 연결
```

## 완료 기준

```text
- Google Drive prompts/ 공유 채널과 GitHub `prompts` branch 운영 기준이 공유된다.
- 등록 기준/승격 게이트/역할이 운영자에게 공유된다.
- prompt-asset(등록), prompt-db-curation(정리) skill과 연결된다.
- 이후 Notion DB로 옮길 때 재사용할 필드가 유지된다.
- 첫 분기 거버넌스 리뷰에서 임계값을 재검토할 수 있다.
```
