# Distribution test scripts

Project managers can run these scripts immediately after cloning the repo to verify the agent-deploy bundle path on their OS.

## What the scripts check

The default scenario is `codex` + `developer` + `project` scope.

```text
1. Node.js / npm availability and Node >= 18
2. agent-deploy manifest and asset validation
3. agent-deploy smoke tests when the test directory is present
4. doctor
5. apply --dry-run
6. apply --backup
7. doctor
8. update --dry-run
9. repair --dry-run
10. uninstall --dry-run
```

Logs are written to `tests/results/` and ignored by git.

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

## Windows PowerShell

```powershell
.\tests\dist_test.ps1
```

Optional overrides:

```powershell
.\tests\dist_test.ps1 -Target codex -Profile developer -Scope project
.\tests\dist_test.ps1 -RunNpmTest:$false
.\tests\dist_test.ps1 -KeepProject:$false
.\tests\dist_test.ps1 -Project "$env:TEMP\my-agent-bundle-test"
.\tests\dist_test.ps1 -NpmCommand npm.cmd
```

`-KeepProject:$false` only removes auto-generated project folders whose name starts with `agent-bundle-dist-test-`.

On some Windows PCs, PowerShell resolves `npm` to `npm.ps1` and execution policy blocks it. The script prefers `npm.cmd` automatically when available. If needed, force it explicitly:

```powershell
.\tests\dist_test.ps1 -NpmCommand npm.cmd
```

## Windows Command Prompt

```bat
tests\dist_test.bat
```

The batch file delegates to `dist_test.ps1` with `ExecutionPolicy Bypass` for this process only.

## Windows-specific checks

When a project manager verifies Windows, record these items with the log file path.

```text
Required:
- Run once from PowerShell with .\tests\dist_test.ps1.
- Run once from Command Prompt with tests\dist_test.bat.
- Confirm the final line says DIST TEST PASS.
- Confirm the process exit code is 0.
- Confirm tests/results/dist-test-windows-*.log was created.
- Confirm the test project is under %TEMP% by default and not a real work project.
- Confirm apply --dry-run does not create AGENTS.md or install-state.
- Confirm apply --backup creates only project-scope files.
- Confirm uninstall --dry-run prints would-revert / would-delete and does not delete files.
```

Also check at least one path with spaces, because Windows path quoting is a common failure point.

```powershell
.\tests\dist_test.ps1 -Project "$env:TEMP\agent bundle dist test"
```

If the PowerShell script is blocked by policy, use the batch wrapper first.

```bat
tests\dist_test.bat
```

Expected policy behavior:

```text
- dist_test.bat may use ExecutionPolicy Bypass for this process only.
- The script must not require Administrator permission.
- The script must not write outside the repo, tests/results/, or the temporary test project.
```

Record Windows environment details when reporting the result.

```powershell
$PSVersionTable
node --version
npm --version
Get-ExecutionPolicy
cmd /c ver
```
