---
name: agent-bundle-feedback
description: Collect Agent Bundle beta feedback through consent-based Q&A and produce an upload-ready Markdown report. Triggers on "피드백 해줘", "Agent Bundle 피드백", "베타 피드백", "설치 피드백", "feedback submit".
allowed-tools: ["Read"]
argument-hint: "[optional: install output, usage notes, or issue description]"
---

# Agent Bundle Feedback

Use this skill when a user wants to submit feedback about the company Agent Bundle beta.
Do not make the user paste a long feedback template. Guide the user through short Q&A,
then produce a sanitized Markdown file for Google Drive `AI-Knowhow/feedback/`.

## Required rules

Follow the installed common rules for the current harness:

```text
Codex:  .agents/rules/common/    (security, source-attribution, knowledge-sharing)
Claude: .claude/rules/common/
Gemini: .gemini/rules/common/
Cursor: .cursor/rules/common-*.mdc
```

## Workflow

1. **동의 확인** — 환경정보와 설치 결과를 피드백에 포함해도 되는지 먼저 묻는다.
   - 예: "OS, 사용한 AI 도구, 설치 scope, 실행 명령/출력 요약을 피드백에 포함해도 될까요?"
   - 사용자가 거절하면 해당 항목은 `미제공`으로 둔다.
2. **보안 가드** — 고객 개인정보, credential, token, private key, 비밀번호, 세션 쿠키, 내부 기밀 원문은 받지 않는다.
   - 이미 포함된 경우 placeholder로 바꾼다.
3. **짧은 Q&A** — 한 번에 1~3개만 묻고, 모르면 `모르겠음`으로 답해도 된다고 안내한다.
4. **증거 수집** — 사용자가 제공한 설치 명령, dry-run/apply/doctor/update/repair/uninstall 출력은 요약하되 전문에 민감정보가 있을 수 있으면 그대로 싣지 않는다.
5. **Markdown 생성** — 아래 Output 형식으로 업로드 가능한 `.md`를 만든다.
6. **업로드 전 확인** — Drive 커넥터가 있더라도 업로드 전에는 파일명과 본문을 보여주고 사용자 확인을 받는다.
7. **Fallback 안내** — Drive 커넥터가 없으면 사용자가 Drive 웹에서 `AI-Knowhow/feedback/`에 올릴 수 있게 파일명과 본문만 제공한다.

## Q&A checklist

필요한 항목만 묻는다. 이미 대화에 있는 정보는 다시 묻지 않는다.

```text
1. OS와 사용한 AI 도구는 무엇인가요?
2. 설치한 프로젝트 또는 업무 맥락을 민감정보 없이 설명해 주세요.
3. dry-run / apply / doctor 중 어디까지 실행했나요?
4. update --dry-run / repair --dry-run / uninstall --dry-run을 실행했나요?
5. 설치 또는 사용 중 막힌 단계가 있었나요?
6. 실제 업무에 어떤 prompt / skill / rule을 써봤나요?
7. 헷갈린 용어(target/profile/scope 등)나 비개발자에게 어려운 표현이 있었나요?
8. Codex/Claude/Gemini 등 도구별로 결과 차이를 느꼈나요?
9. 공유 가능한 `.md` 산출물이나 재사용 후보가 있나요?
10. 전사 확대 전에 가장 먼저 고쳐야 할 것은 무엇인가요?
```

## Output

```md
# Agent Bundle Beta Feedback

- 작성일:
- 작성자 표시: 실명 / 익명 / 팀 단위 / 미제공
- OS:
- 사용한 AI 도구:
- 설치 scope: project / user-global / 모르겠음 / 미제공
- target/profile: 확인됨 / 모르겠음 / 미제공
- 환경정보 포함 동의: 예 / 일부 / 아니오

## 1. 설치 결과

- 설치 시도 여부:
- dry-run:
- apply:
- doctor:
- update --dry-run:
- repair --dry-run:
- uninstall --dry-run:
- 대략 소요 시간:
- 막힌 단계:
- 해결 방법 또는 남은 문제:

## 2. 실제 사용 사례

- 사용 업무:
- 사용한 prompt / skill / rule:
- 도움이 된 점:
- 불편하거나 과한 점:

## 3. 이해도와 사용성

- SETUP_WIZARD 이해도:
- 어려웠던 용어:
- 비개발자 관점에서 어려운 표현:
- agent 안내가 복잡하거나 잘못된 부분:

## 4. 도구별 의미 동등성

- 사용한 도구:
- 도구별 차이 사례:
- 회사 표준 방식 반영 여부:

## 5. 공유/재사용 후보

- 공유 가능한 `.md` 산출물:
- 재사용 가능한 prompt/skill/rule 아이디어:
- 공유 전 정제 필요 사항:

## 6. 보안/출처 확인

- 민감정보 제거 여부:
- placeholder 처리:
- 외부 자료 출처:
- 추가 확인이 필요한 위험:

## 7. 개선 요청

- 가장 먼저 고쳐야 할 문제:
- 없어도 되는 복잡한 절차:
- 추가되면 좋을 prompt/skill/template:
- 운영자가 알아야 할 리스크:
```

## File name

Recommend this filename:

```text
YYYY-MM-DD_agent-bundle-feedback_<short-topic>.md
```
