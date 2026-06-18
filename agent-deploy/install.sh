#!/usr/bin/env sh
# agent-deploy bundle installer (Linux / macOS).
#
# Unzip the bundle, then from inside your project run:
#   ./install.sh --target codex --profile developer             # project (this repo) — DEFAULT
#   ./install.sh --target gemini --profile developer            # project (GEMINI.md, .gemini …)
#   ./install.sh --target claude --profile developer --global   # user-global (~/.claude …)
#   ./install.sh --target codex --profile developer --dry-run    # preview, write nothing
#
# Default scope is the current project. --global installs into your home config
# so the standard is shared across every IDE/CLI you open.
set -eu

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

scope=project
pass=""
for a in "$@"; do
  case "$a" in
    --global) scope=home ;;
    *) pass="$pass $a" ;;  # simple flags/values; avoid spaces in passthrough paths
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js가 필요합니다. https://nodejs.org 에서 설치 후 다시 실행하세요." >&2
  exit 1
fi

if [ "$scope" = home ]; then
  echo "→ 전역(home) 설치: $HOME"
  # shellcheck disable=SC2086
  exec node "$DIR/src/cli.js" apply --scope home $pass
else
  echo "→ 프로젝트 설치: $(pwd)"
  # shellcheck disable=SC2086
  exec node "$DIR/src/cli.js" apply --scope project --project "$(pwd)" $pass
fi
