# Distribution test scripts

Project managers can run these scripts immediately after cloning the repo to verify the agent-deploy bundle path on their OS.

## What the scripts check

The default scenario is `codex` + `developer` + `project` scope.

```text
1. Node.js / npm availability and Node >= 18
2. agent-deploy manifest and asset validation
3. agent-deploy smoke tests when enabled and the test directory is present
4. doctor
5. apply --dry-run
6. apply --backup
7. doctor
8. update --dry-run
9. repair --dry-run
10. uninstall --dry-run
```

Logs are written to `tests/results/` and ignored by git. Windows `.bat` logs use `dist-test-windows-*.log`.

## Linux / macOS / Git Bash

```bash
./tests/dist_test.sh
```

Optional overrides:

```bash
TARGET=claude PROFILE=developer ./tests/dist_test.sh
DIST_TEST_RUN_NPM_TEST=0 ./tests/dist_test.sh
DIST_TEST_KEEP_PROJECT=0 ./tests/dist_test.sh
PROJECT=/tmp/my-agent-bundle-test ./tests/dist_test.sh
NPM_BIN=npm.cmd ./tests/dist_test.sh
```

`DIST_TEST_KEEP_PROJECT=0` only removes auto-generated project folders whose name starts with `agent-bundle-dist-test-`.

Git Bash on Windows defaults `DIST_TEST_RUN_NPM_TEST` to `0`. The long Node smoke suite includes Windows PowerShell wrapper checks that are noisy on some PCs and are not required for this manager-run distribution test. To force it anyway:

```bash
DIST_TEST_RUN_NPM_TEST=1 ./tests/dist_test.sh
```

## Windows Command Prompt

Use Command Prompt for the Windows distribution test. The PowerShell test wrapper was removed because it caused execution-policy and console-encoding issues on some PCs. The `.bat` file is now a thin wrapper around a Node-based Windows runner, which avoids fragile cmd quoting for the actual test logic.

```bat
tests\dist_test.bat
```

Optional overrides:

```bat
set TARGET=codex
set PROFILE=developer
set SCOPE=project
set PROJECT=%TEMP%\my-agent-bundle-test
set NPM_BIN=npm.cmd
tests\dist_test.bat
```

By default, Windows `.bat` skips `npm test` and runs the distribution path check only. To force the long smoke suite:

```bat
set DIST_TEST_RUN_NPM_TEST=1
tests\dist_test.bat
```

## Windows-specific checks

When a project manager verifies Windows, record these items with the log file path.

```text
Required:
- Run once from Command Prompt with tests\dist_test.bat.
- Confirm the final line says DIST TEST PASS.
- Confirm the process exit code is 0.
- Confirm tests\results\dist-test-windows-*.log was created.
- Confirm the test project is under %TEMP% by default and not a real work project.
- Confirm apply --dry-run does not create AGENTS.md or install-state.
- Confirm apply --backup creates only project-scope files.
- Confirm uninstall --dry-run prints would-revert / would-delete and does not delete files.
```

Also check at least one path with spaces, because Windows path quoting is a common failure point.

```bat
set PROJECT=%TEMP%\agent bundle dist test
tests\dist_test.bat
```

Expected Windows behavior:

```text
- The script must not require Administrator permission.
- The script sets code page 65001 to reduce console text corruption.
- The script prefers npm.cmd when available.
- The script must not write outside the repo, tests\results\, or the temporary test project.
```

Record Windows environment details when reporting the result.

```bat
node --version
npm.cmd --version
chcp
ver
```
