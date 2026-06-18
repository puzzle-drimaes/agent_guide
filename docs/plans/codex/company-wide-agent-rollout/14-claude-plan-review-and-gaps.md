# 14. Claude 계획 비교 평가와 Codex 보강 백로그

## 목적

`docs/plans/claude/`에 작성된 단계 문서를 평가하고, `docs/plans/codex/company-wide-agent-rollout/` 문서에 보강해야 할 내용을 정리한다.

## 결론

Claude 문서는 **전략적 구조와 리스크 통제**가 강하다. 특히 다음 관점이 Codex 문서보다 명확하다.

1. 개발자/비개발자 2-track 분리
2. 비개발자에게 CLI 설치를 강요하지 않는 전달 방식
3. 공급망 보안과 설치 생애주기
4. open decisions와 non-goals
5. governance-as-code
6. prompt DB → skill 승격 루프
7. provenance에 사용자/계정/머신을 기록하는 관점

Codex 문서는 **실행 단계와 운영 항목**이 더 자세하다. 따라서 Codex 문서를 버리기보다, Claude 문서의 전략·보안·생애주기 관점을 Codex 문서에 흡수하는 것이 좋다.

---

## 1. Claude 문서 평가

### 강점

#### 1.1 목표 정의가 더 선명함

Claude 문서는 목표를 다음 4개로 고정한다.

```text
G1 User-agnostic
G2 OS-agnostic
G3 Agent-agnostic
G4 Knowledge sharing operation
```

이 구조는 의사결정 때 유용하다. 어떤 기능을 넣을지 말지 판단할 때 “4개 목표 중 무엇을 만족시키는가?”로 판단할 수 있다.

#### 1.2 개발자/비개발자 track 분리가 좋음

Claude 문서의 핵심 장점은 “비개발자도 동일 설치”를 개발자와 같은 방식으로 강제하지 않는다는 점이다.

```text
개발자 트랙:
  repo/머신에 설정 파일 주입

비개발자 트랙:
  공유 Custom Instructions, Projects, Prompt DB, 온보딩 체크리스트 제공
```

Codex 문서도 비개발자 UX를 다루지만, 아직 “동일한 정규 소스를 다른 표면으로 렌더링한다”는 관점이 약하다.

#### 1.3 open decisions가 명확함

Claude 문서는 D1~D7 결정 항목을 둔다.

```text
D1 정규 소스 저장 위치
D2 비개발자 전달 방식
D3 패키지 배포 채널
D4 지식 DB 위치
D5 1차 정규 방법론 범위
D6 에어갭/오프라인 필요 여부
D7 설치 식별/제공자
```

Codex 문서에도 이 의사결정 표를 추가해야 한다.

#### 1.4 공급망 보안과 생애주기가 매우 중요함

Claude 문서의 `03-safety-and-lifecycle.md`는 Codex 문서에서 가장 많이 보강해야 할 영역이다.

포함된 핵심:

```text
- 유니코드 안전성 검사
- 공급망 IOC 스캔
- workflow 보안 검사
- frontmatter schema 검증
- artifact signing
- update
- uninstall
- repair
- drift detection
- version pin
- rollback
```

현재 Codex 문서는 installer MVP와 운영 계획은 충분하지만, 배포 시스템 자체가 공격면이라는 관점이 부족하다.

#### 1.5 governance-as-code 관점이 좋음

Claude 문서는 6개 룰을 문서가 아니라 자동화로 구현해야 한다고 본다.

```text
1 PR = 1 노하우
  → PR template + GitHub Action

주간 회고
  → Slack scheduled form

프롬프트 자산화
  → Notion DB + skill 승격 루프

출처 표기
  → source-citation rule + cite-check hook
```

Codex 문서에도 자동화 항목은 있지만, “룰을 자동화로 구현한다”는 표현을 더 강하게 넣는 것이 좋다.

#### 1.6 Prompt DB → Skill 승격 루프가 매우 좋음

Claude 문서의 핵심 루프:

```text
현장에서 좋은 프롬프트 발견
  → Notion 프롬프트 DB 등록
  → 사용/성공률 태깅
  → 분기 리뷰에서 검증
  → assets/skills/company-* 로 승격
  → installer로 전사 배포
```

이 루프는 “공용 계정의 지식 공유화”를 실제 시스템으로 만드는 핵심이다. Codex 문서에 반드시 보강해야 한다.

---

## 2. Codex 문서 평가

### 강점

#### 2.1 실행 단계가 더 세밀함

Codex 문서는 13개 단계로 쪼개져 있어 실제 담당자가 읽고 실행하기 좋다.

```text
01 공통 원칙
02 profile/assets
03 installer MVP
04 비개발자 UX
05 공유 계정
06 지식 KPI
07 workflow
08 adapter
09 교육
10 pilot
11 rollout
12 automation
13 governance
```

#### 2.2 비개발자 온보딩이 더 실무적임

Codex 문서는 설치 완료 메시지, doctor, explain, examples 같은 실제 UX를 잘 다룬다.

#### 2.3 계정 운영과 교육이 더 구체적임

Claude 문서는 계정 운영을 governance 안에 통합하고, Codex 문서는 별도 단계로 분리한다. 20명/9계정 상황에서는 Codex 방식이 더 실무적이다.

#### 2.4 Pilot과 Rollout 실행 계획이 더 자세함

Codex 문서는 pilot 대상, 1주차/2주차 검증, rollout 첫 주 운영을 더 구체적으로 썼다.

### 약점

Codex 문서는 다음 관점이 부족하다.

```text
- 2-track 구조의 명확한 정의
- 비개발자 전달 방식으로 웹 생성기/zip/Custom Instructions 고려
- open decisions 표
- non-goals
- 공급망 보안
- artifact signing
- update/uninstall/repair/drift lifecycle
- prompt DB → skill 승격 루프
- provenance에 사용자/계정/머신 기록
- asset frontmatter 계약
- CI security gate
- 3 OS × Node version matrix
```

---

## 3. Codex 문서에 보강할 내용

## P0 — 반드시 반영

### 3.1 `01-principles-and-scope.md` 보강

추가할 내용:

```text
- G1 User-agnostic
- G2 OS-agnostic
- G3 Agent-agnostic
- G4 Knowledge sharing operation
- 개발자 track / 비개발자 track 정의
- non-goals
- open decisions D1~D7
```

추가 문구:

```text
같은 방향성은 같은 파일 설치를 의미하지 않는다.
같은 정규 방법론을 개발자는 repo/머신 설정으로 받고,
비개발자는 계정/워크스페이스/프롬프트 DB 표면으로 받는다는 뜻이다.
```

### 3.2 `03-installer-mvp.md` 보강

추가할 내용:

```text
- Node 없는 사용자용 단일 실행 바이너리
- 비개발자용 웹 설정 생성기
- GitHub Releases 또는 사설 npm 배포 채널
- 3 OS × Node 18/20/22 CI matrix
- provenance에 user/account/machine 필드 추가
- code signing 고려
```

### 3.3 새 문서 추가 권장: `03b-safety-and-lifecycle.md`

Codex 문서에는 별도 보안/생애주기 문서가 필요하다.

포함:

```text
- supply-chain scan
- unicode safety
- workflow security validation
- frontmatter schema validation
- artifact signing
- update
- uninstall
- repair
- drift detection
- rollback
- version pin
- MCP governance
```

### 3.4 `06-knowledge-kpi-system.md` 보강

추가할 내용:

```text
- 6룰을 governance-as-code로 구현한다는 원칙
- GitHub Action으로 PR knowhow 자동 수집
- Slack schedule로 weekly form 자동 발송
- Prompt DB → assets/skills 승격 루프
- KPI 목표값
```

### 3.5 `12-automation.md` 보강

추가할 내용:

```text
- Prompt DB에서 검증된 prompt를 company skill로 승격
- installer update notification과 연계
- 데모데이 후보 자동 생성
- 분기 governance snapshot 자동 생성
```

---

## 4. P1 — 있으면 좋은 보강

### 4.1 `02-profiles-and-assets.md` 보강

추가:

```text
asset 작성 계약:

Agent:
  frontmatter name, description, tools, model

Skill:
  SKILL.md frontmatter name, description, allowed-tools, argument-hint

Rule:
  frontmatter paths

Command:
  description + explicit GATE marker
```

또한 v1 스타터 세트는 너무 많지 않게 제한한다.

권장:

```text
rules: 4~6개
skills: 4~6개
agents: 3~4개
hooks: developer profile만
```

### 4.2 `08-target-adapters.md` 보강

추가:

```text
- Codex TOML add-only merge
- Gemini 미지원 기능은 instruction-backed 대체
- adapter별 semantic equivalence test
- target별 기능 지원 매트릭스
```

### 4.3 `04-nondeveloper-onboarding.md` 보강

추가:

```text
- 비개발자는 Node를 전제로 하지 않는다.
- 웹 설정 생성기 또는 zip 다운로드를 1차 UX로 고려한다.
- 설치 완료의 정의는 파일 write가 아니라 공유 instruction/project/prompt DB 접근 완료다.
```

### 4.4 `13-governance-and-roadmap.md` 보강

추가:

```text
- 분기 리뷰에서 prompt → skill 승격 결정
- 계정 재배분 자동 리포트
- installer lifecycle review
- sign key / release owner 지정
```

---

## 5. 권장 문서 구조 변경

현재 Codex 구조:

```text
03-installer-mvp.md
04-nondeveloper-onboarding.md
...
13-governance-and-roadmap.md
```

보강 후 권장:

```text
03-installer-mvp.md
03b-safety-and-lifecycle.md
04-nondeveloper-onboarding.md
...
13-governance-and-roadmap.md
14-claude-plan-review-and-gaps.md
```

또는 번호 정리를 원하면:

```text
03-installer-mvp.md
04-safety-and-lifecycle.md
05-nondeveloper-onboarding.md
...
```

현재 파일명을 유지하려면 `03b-` 방식이 안전하다.

---

## 6. 반영 우선순위

### 즉시 반영

```text
1. 01 문서에 2-track, open decisions, non-goals 추가
2. 03 문서에 바이너리/웹 생성기/CI matrix/provenance 필드 추가
3. 03b safety lifecycle 문서 신설
4. 06 문서에 prompt DB → skill 승격 루프 추가
```

### 다음 반영

```text
5. 02 문서에 asset frontmatter 계약 추가
6. 08 문서에 adapter equivalence test 추가
7. 12 문서에 자동화 상세 강화
8. 13 문서에 release/signing 책임과 lifecycle review 추가
```

---

## 7. 최종 판단

Claude 문서는 Codex 문서를 대체하기보다 보완한다.

```text
Claude 문서:
  전략, 리스크, 보안, 생애주기, governance-as-code가 강함

Codex 문서:
  실행 단계, 온보딩, 계정 운영, pilot/rollout이 강함
```

따라서 최종 문서 체계는 다음 방향이 좋다.

```text
Codex 문서의 단계별 실행 구조 유지
  + Claude 문서의 2-track 전략
  + Claude 문서의 supply-chain/lifecycle 보안
  + Claude 문서의 governance-as-code
  + Claude 문서의 prompt-to-skill 승격 루프
```

이 보강을 완료하면 문서가 “실행 계획”뿐 아니라 “사내 배포 시스템의 운영 원칙과 안전성”까지 갖추게 된다.
