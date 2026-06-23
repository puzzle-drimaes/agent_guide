# GitHub branch 운영/권한 정책

이 문서는 Google Drive `AI-Knowhow` 공유 폴더와 함께 쓰는 GitHub branch 운영 기준이다.
목표는 사원 agent가 prompt/skill 후보를 쉽게 남기고, 작업 안정화 전까지는 `main` 직접 push를 막지 않는 것이다.
안정화 후에는 공식 배포본인 `main`을 protected merge 전용으로 전환한다.

## Branch 역할

```text
main
  공식 배포본. 현재 WIP 기간에는 direct push 허용. 안정화 후 protected branch/ruleset 적용.

prompts
  prompt 후보 수집 branch. 사원 agent가 정제한 `.md` 후보를 commit/push 가능.
  최소 등록 경로: uploads/prompts/<name>.md

skills
  skill 후보 수집 branch. 사원 agent가 정제한 `SKILL.md` 또는 `.md` 후보를 commit/push 가능.
  최소 등록 경로: uploads/skills/<skill-name>/SKILL.md
```

## 권한 원칙

```text
- 현재 WIP 기간에는 `main` direct push를 GitHub에서 막지 않는다.
- agent가 prompt/skill 후보를 올릴 때는 `prompts` 또는 `skills` branch를 우선 사용한다.
- 일반 코드/문서 수정은 필요하면 `main`에 직접 push할 수 있다.
- 안정화 후 운영자는 검증된 후보만 `main`에 protected merge한다.
- force push와 branch delete는 모든 운영 branch에서 금지한다.
```

`prompts`/`skills`는 후보 수집 공간이므로 PR을 요구하지 않는다. `main`은 공식 배포본이지만,
현재 WIP 기간에는 GitHub ruleset enforcement를 `disabled`로 두어 직접 push를 막지 않는다.

## GitHub 설정 체크리스트

Repository: `puzzle-drimaes/agent_guide`

```text
1. Branch 존재
   - main
   - prompts
   - skills

2. main 보호
   - branch ruleset/protection name: Protect main from direct pushes
   - target: refs/heads/main
   - 현재 WIP 기간 enforcement: disabled
   - 안정화 후 enforcement: active
   - 안정화 후 direct push 금지: pull request/protected merge 경유
   - 안정화 후 branch delete 금지
   - 안정화 후 non-fast-forward / force push 금지

3. prompts / skills 후보 branch
   - direct push 허용
   - force push 금지
   - delete 금지
```

## Agent용 금지 명령 패턴

안정화 후 protected main 운영으로 전환하면 agent는 아래 형태를 실행하지 않는다. 현재 WIP 기간에는 막지 않는다.

```bash
git push origin main
git push origin HEAD:main
git push --force origin main
```

## 후보 branch 최소 등록 경로

후보 branch는 공식 배포본이 아니므로 `agent-deploy/assets/...`에 바로 넣지 않는다.
먼저 업로드/수집 공간임이 드러나는 `uploads/...` 아래에 둔다.

```text
prompts branch:
  uploads/prompts/<name>.md

skills branch:
  uploads/skills/<skill-name>/SKILL.md
```

허용되는 후보 등록 예시는 다음과 같다.

```bash
# prompt 후보: prompts branch
# 예: uploads/prompts/customer-faq-draft.md
git switch prompts
mkdir -p uploads/prompts
cp /path/to/customer-faq-draft.md uploads/prompts/customer-faq-draft.md
git add uploads/prompts/customer-faq-draft.md
git commit -m "[docs] prompt 후보 등록"
git push origin prompts

# skill 후보: skills branch
# 예: uploads/skills/meeting-followup/SKILL.md
git switch skills
mkdir -p uploads/skills/meeting-followup
cp /path/to/SKILL.md uploads/skills/meeting-followup/SKILL.md
git add uploads/skills/meeting-followup/SKILL.md
git commit -m "[docs] skill 후보 등록"
git push origin skills
```

`main` 승격 또는 공식 반영 검토는 agent가 PR/MR을 만들지 않고, 운영자가 후보 branch commit과 Drive 운영 메모를 기준으로 수동 판단한다. 후보 branch 등록 자체에도 PR/MR을 요구하지 않는다.

작업 branch를 따로 만드는 경우에는 작업 branch로 push할 수 있다. 현재 WIP 기간에는 필요 시 `main` 직접 push도 허용한다.

```bash
git switch -c ops/<topic>
git push origin ops/<topic>
```

## 운영자 merge 기준

`main` 반영 전(직접 push 또는 merge 전) 운영자는 아래를 확인한다.

```text
- 민감정보, credential, 고객 식별 정보가 없다.
- 외부 자료 기반이면 출처/라이선스가 있다.
- frontmatter 또는 본문 상단에 목적/대상/owner가 식별 가능하다.
- 중복·충돌이 있으면 기존 asset을 덮어쓰지 않고 정리 방식을 기록했다.
- prompt/skill 후보가 반복 사용되거나 운영상 공식 배포할 가치가 있다.
```

통과하지 못한 후보는 `prompts`/`skills`에 남기고 보완 요청 또는 deprecated 표시를 한다.
