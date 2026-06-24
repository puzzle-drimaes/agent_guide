#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="${AGENT_DEPLOY_DIR:-$REPO_ROOT/agent-deploy}"
TARGET="${TARGET:-codex}"
PROFILE="${PROFILE:-developer}"
SCOPE="${SCOPE:-project}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
UNAME="$(uname -s 2>/dev/null || echo unknown)"
case "$UNAME" in
  MINGW*|MSYS*|CYGWIN*)
    PLATFORM="windows-gitbash"
    DEFAULT_RUN_NPM_TEST="0"
    export LANG="${LANG:-C.UTF-8}"
    export LC_ALL="${LC_ALL:-$LANG}"
    ;;
  *)
    PLATFORM="linux"
    DEFAULT_RUN_NPM_TEST="1"
    ;;
esac
RESULT_DIR="${DIST_TEST_RESULT_DIR:-$SCRIPT_DIR/results}"
PROJECT="${PROJECT:-${TMPDIR:-/tmp}/agent-bundle-dist-test-$TIMESTAMP}"
KEEP_PROJECT="${DIST_TEST_KEEP_PROJECT:-1}"
RUN_NPM_TEST="${DIST_TEST_RUN_NPM_TEST:-$DEFAULT_RUN_NPM_TEST}"
LOG_FILE="$RESULT_DIR/dist-test-$PLATFORM-$TIMESTAMP.log"

mkdir -p "$RESULT_DIR" "$PROJECT"
exec > >(tee "$LOG_FILE") 2>&1

finish() {
  local exit_code=$?
  echo
  if [ "$exit_code" -eq 0 ]; then
    echo "DIST TEST PASS"
  else
    echo "DIST TEST FAIL (exit: $exit_code)"
  fi
  echo "log: $LOG_FILE"
  echo "project: $PROJECT"
  if [ "$exit_code" -eq 0 ] && [ "$KEEP_PROJECT" = "0" ] && [[ "$(basename "$PROJECT")" == agent-bundle-dist-test-* ]]; then
    rm -rf "$PROJECT"
    echo "project cleanup: removed"
  elif [ "$exit_code" -eq 0 ] && [ "$KEEP_PROJECT" = "0" ]; then
    echo "project cleanup: skipped for non-generated project path"
  else
    echo "project cleanup: kept"
  fi
  exit "$exit_code"
}
trap finish EXIT

run_step() {
  echo
  echo "==> $*"
  "$@"
}

assert_path_exists() {
  local path="$1"
  if [ ! -e "$path" ]; then
    echo "expected path not found: $path" >&2
    exit 1
  fi
}

assert_path_absent() {
  local path="$1"
  if [ -e "$path" ]; then
    echo "path should not exist after dry-run: $path" >&2
    exit 1
  fi
}

echo "Agent bundle distribution test"
echo "repo: $REPO_ROOT"
echo "agent-deploy: $DEPLOY_DIR"
echo "target/profile/scope: $TARGET / $PROFILE / $SCOPE"
echo "project: $PROJECT"
echo "timestamp: $TIMESTAMP UTC"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required (>= 18)" >&2
  exit 1
fi
NPM_BIN="${NPM_BIN:-}"
if [ -z "$NPM_BIN" ]; then
  if command -v npm >/dev/null 2>&1; then
    NPM_BIN="npm"
  elif command -v npm.cmd >/dev/null 2>&1; then
    NPM_BIN="npm.cmd"
  else
    echo "npm is required (set NPM_BIN=/path/to/npm or npm.cmd if needed)" >&2
    exit 1
  fi
fi

run_step node --version
run_step "$NPM_BIN" --version
run_step node -e 'const v=Number(process.versions.node.split(".")[0]); if (v < 18) { console.error(`Node >= 18 required, got ${process.version}`); process.exit(1); } console.log(`Node version OK: ${process.version}`);'

case "$TARGET" in
  codex)
    ENTRY_PATH="$PROJECT/AGENTS.md"
    STATE_PATH="$PROJECT/.agent-deploy/install-state.json"
    FEEDBACK_SKILL_PATH="$PROJECT/.agents/skills/agent-bundle-feedback/SKILL.md"
    CONFIG_PATH="$PROJECT/.codex/config.toml"
    ;;
  gemini)
    ENTRY_PATH="$PROJECT/GEMINI.md"
    STATE_PATH="$PROJECT/.agent-deploy/install-state.json"
    FEEDBACK_SKILL_PATH="$PROJECT/.gemini/skills/agent-bundle-feedback/SKILL.md"
    CONFIG_PATH=""
    ;;
  claude)
    ENTRY_PATH=""
    STATE_PATH="$PROJECT/.claude/agent-install-state.json"
    FEEDBACK_SKILL_PATH="$PROJECT/.claude/skills/agent-bundle-feedback/SKILL.md"
    CONFIG_PATH="$PROJECT/.mcp.json"
    ;;
  cursor)
    ENTRY_PATH=""
    STATE_PATH="$PROJECT/.cursor/agent-install-state.json"
    FEEDBACK_SKILL_PATH="$PROJECT/.cursor/skills/agent-bundle-feedback/SKILL.md"
    CONFIG_PATH="$PROJECT/.cursor/mcp.json"
    ;;
  *)
    echo "unsupported TARGET for dist_test.sh assertions: $TARGET" >&2
    exit 1
    ;;
esac

cd "$DEPLOY_DIR"

run_step "$NPM_BIN" run validate
if [ "$RUN_NPM_TEST" = "1" ] && [ -d test ]; then
  run_step "$NPM_BIN" test
else
  echo
  echo "==> npm test skipped"
  echo "reason: DIST_TEST_RUN_NPM_TEST=$RUN_NPM_TEST or test directory not found"
fi

run_step node src/cli.js doctor --project "$PROJECT"
run_step node src/cli.js apply --target "$TARGET" --profile "$PROFILE" --scope "$SCOPE" --project "$PROJECT" --dry-run
[ -z "$ENTRY_PATH" ] || assert_path_absent "$ENTRY_PATH"
assert_path_absent "$STATE_PATH"

run_step node src/cli.js apply --target "$TARGET" --profile "$PROFILE" --scope "$SCOPE" --project "$PROJECT" --backup
[ -z "$ENTRY_PATH" ] || assert_path_exists "$ENTRY_PATH"
assert_path_exists "$STATE_PATH"
assert_path_exists "$FEEDBACK_SKILL_PATH"
[ -z "$CONFIG_PATH" ] || assert_path_exists "$CONFIG_PATH"

run_step node src/cli.js doctor --project "$PROJECT"
run_step node src/cli.js update --target "$TARGET" --profile "$PROFILE" --scope "$SCOPE" --project "$PROJECT" --dry-run
run_step node src/cli.js repair --target "$TARGET" --profile "$PROFILE" --scope "$SCOPE" --project "$PROJECT" --dry-run
run_step node src/cli.js uninstall --target "$TARGET" --profile "$PROFILE" --scope "$SCOPE" --project "$PROJECT" --dry-run
assert_path_exists "$STATE_PATH"

echo
echo "Generated files sample:"
find "$PROJECT" -maxdepth 3 -type f | sort | sed -n '1,80p'
