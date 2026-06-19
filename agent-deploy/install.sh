#!/usr/bin/env sh
# agent-deploy bundle bootstrap.
#
# Default flow:
#   1. Unzip the bundle.
#   2. Run ./install.sh to confirm the bundle and print setup instructions.
#   3. Give SETUP_WIZARD.md to your first agent conversation.
#   4. Let the agent generate deterministic dry-run/apply CLI commands.
#
# Advanced/direct wrapper:
#   ./install.sh --target codex --profile developer --dry-run
#   ./install.sh --target codex --profile developer
#   ./install.sh --target claude --profile developer --global
set -eu

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WIZARD="$DIR/SETUP_WIZARD.md"

if [ ! -f "$DIR/src/cli.js" ]; then
  echo "agent-deploy bundle 구조를 확인할 수 없습니다: $DIR/src/cli.js 없음" >&2
  exit 1
fi

if [ ! -f "$WIZARD" ]; then
  echo "agent setup wizard 파일을 찾을 수 없습니다: $WIZARD" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js가 필요합니다. https://nodejs.org 에서 설치 후 다시 실행하세요." >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  cat <<EOF
agent-deploy bundle 확인 완료

bundle root:
  $DIR

다음 단계:
  1. 첫 agent 대화에서 아래 파일을 읽게 하세요.
     $WIZARD

  2. agent가 project path/profile/target/scope를 확인한 뒤 dry-run 명령을 만들게 하세요.

직접 CLI fallback:
  node "$DIR/src/cli.js" list
  node "$DIR/src/cli.js" apply --target codex --profile developer --project "\$(pwd)" --dry-run

주의:
  install.sh는 QnA wizard가 아니라 bootstrap 안내입니다.
  실제 설치는 SETUP_WIZARD.md를 읽은 agent가 생성한 dry-run/apply 명령으로 진행하세요.
EOF
  exit 0
fi

scope=project
pass=""
for a in "$@"; do
  case "$a" in
    --global) scope=home ;;
    *) pass="$pass $a" ;;  # simple flags/values; avoid spaces in passthrough paths
  esac
done

if [ "$scope" = home ]; then
  echo "→ 전역(home) direct apply wrapper: $HOME"
  # shellcheck disable=SC2086
  exec node "$DIR/src/cli.js" apply --scope home $pass
else
  echo "→ 프로젝트 direct apply wrapper: $(pwd)"
  # shellcheck disable=SC2086
  exec node "$DIR/src/cli.js" apply --scope project --project "$(pwd)" $pass
fi
