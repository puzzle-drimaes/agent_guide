# specs

SDD-full 작업의 산출물을 보관하는 위치다.

권장 구조:

```text
docs/specs/<feature-name>/
  requirements.md
  design.md
  tasks.md
  review.md
```

재사용 템플릿은 `docs/specs/_template/`에 있다. 새 SDD-full 작업을 시작하면 `_template`을 `<feature-name>`으로 복사한 뒤 채운다.

```bash
cp -r docs/specs/_template docs/specs/<feature-name>
```

`tasks.md` 템플릿의 체크리스트는 SDD 단계(A~Z)에 맞춰져 있다. 단계 정의는 `.agents/rules/developer/spec-driven-development.md`를 따른다.

SDD-none과 SDD-lite 작업은 기본적으로 별도 spec 디렉터리를 만들지 않는다.

