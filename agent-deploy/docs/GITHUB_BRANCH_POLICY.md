# GitHub branch 운영/권한 정책

이 문서는 Google Drive `AI-Knowhow` 공유 폴더와 함께 쓰는 GitHub branch 운영 기준이다.
목표는 사원 agent가 prompt/skill 후보를 쉽게 남기되, 공식 배포본인 `main`에는 직접 push하지 못하게 하는 것이다.

## Branch 역할

```text
main
  공식 배포본. agent 직접 push 금지. protected branch/ruleset 적용.

prompts
  prompt 후보 수집 branch. 사원 agent가 정제한 `.md` 후보를 commit/push 가능.

skills
  skill 후보 수집 branch. 사원 agent가 정제한 `SKILL.md` 또는 `.md` 후보를 commit/push 가능.
```

## 권한 원칙

```text
- agent 작업 세션은 `main`을 push 대상 ref로 사용하지 않는다.
- agent가 후보를 올릴 때는 `prompts` 또는 `skills` branch만 사용한다.
- 일반 코드/문서 수정은 별도 작업 branch를 만들고, `main` 직접 push는 하지 않는다.
- 운영자는 검증된 후보만 `main`에 protected merge한다.
- force push와 branch delete는 모든 운영 branch에서 금지한다.
```

`prompts`/`skills`는 후보 수집 공간이므로 PR을 요구하지 않는다. 반대로 `main`은 공식 배포본이므로
GitHub ruleset 또는 branch protection으로 직접 push를 막는다.

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
   - enforcement: active
   - direct push 금지: pull request/protected merge 경유
   - branch delete 금지
   - non-fast-forward / force push 금지

3. prompts / skills 후보 branch
   - direct push 허용
   - force push 금지
   - delete 금지
```

## Agent용 금지 명령 패턴

agent는 아래 형태를 실행하지 않는다.

```bash
git push origin main
git push origin HEAD:main
git push --force origin main
```

허용되는 후보 등록 예시는 다음과 같다.

```bash
git switch prompts
git add agent-deploy/assets/prompts/<domain>/<name>.md
git commit -m "[docs] prompt 후보 등록"
git push origin prompts

git switch skills
git add agent-deploy/assets/skills/<skill-id>/SKILL.md
git commit -m "[docs] skill 후보 등록"
git push origin skills
```

작업 branch를 따로 만드는 경우에도 push 대상은 `main`이 아니라 작업 branch다.

```bash
git switch -c ops/<topic>
git push origin ops/<topic>
```

## 운영자 merge 기준

`main` 반영 전 운영자는 아래를 확인한다.

```text
- 민감정보, credential, 고객 식별 정보가 없다.
- 외부 자료 기반이면 출처/라이선스가 있다.
- frontmatter 또는 본문 상단에 목적/대상/owner가 식별 가능하다.
- 중복·충돌이 있으면 기존 asset을 덮어쓰지 않고 정리 방식을 기록했다.
- prompt/skill 후보가 반복 사용되거나 운영상 공식 배포할 가치가 있다.
```

통과하지 못한 후보는 `prompts`/`skills`에 남기고 보완 요청 또는 deprecated 표시를 한다.
