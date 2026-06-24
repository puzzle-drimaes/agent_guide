@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Keep Windows console/log output in UTF-8 where possible.
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_ROOT=%%~fI"

if defined AGENT_DEPLOY_DIR (set "DEPLOY_DIR=%AGENT_DEPLOY_DIR%") else set "DEPLOY_DIR=%REPO_ROOT%\agent-deploy"
if not defined TARGET set "TARGET=codex"
if not defined PROFILE set "PROFILE=developer"
if not defined SCOPE set "SCOPE=project"
if not defined DIST_TEST_KEEP_PROJECT set "DIST_TEST_KEEP_PROJECT=1"
if not defined DIST_TEST_RUN_NPM_TEST set "DIST_TEST_RUN_NPM_TEST=0"

set "DATE_PART=%DATE:/=-%"
set "DATE_PART=%DATE_PART:.=-%"
set "DATE_PART=%DATE_PART: =-%"
set "TIME_PART=%TIME::=-%"
set "TIME_PART=%TIME_PART:.=-%"
set "TIME_PART=%TIME_PART: =0%"
set "TIMESTAMP=%DATE_PART%-%TIME_PART%"

if defined DIST_TEST_RESULT_DIR (set "RESULT_DIR=%DIST_TEST_RESULT_DIR%") else set "RESULT_DIR=%SCRIPT_DIR%results"
if not defined PROJECT set "PROJECT=%TEMP%\agent-bundle-dist-test-%TIMESTAMP%"
set "LOG_FILE=%RESULT_DIR%\dist-test-windows-%TIMESTAMP%.log"
set "CLI_JS=%DEPLOY_DIR%\src\cli.js"

if not exist "%RESULT_DIR%" mkdir "%RESULT_DIR%"
if not exist "%PROJECT%" mkdir "%PROJECT%"

break > "%LOG_FILE%"
call :log "Agent bundle distribution test"
call :log "repo: %REPO_ROOT%"
call :log "agent-deploy: %DEPLOY_DIR%"
call :log "target/profile/scope: %TARGET% / %PROFILE% / %SCOPE%"
call :log "project: %PROJECT%"
call :log "log: %LOG_FILE%"

where node >nul 2>nul
if errorlevel 1 goto missing_node
if not exist "%CLI_JS%" goto missing_cli

if defined NPM_BIN (
  set "NPM_CMD=%NPM_BIN%"
) else (
  where npm.cmd >nul 2>nul
  if not errorlevel 1 (
    set "NPM_CMD=npm.cmd"
  ) else (
    where npm >nul 2>nul
    if not errorlevel 1 (
      set "NPM_CMD=npm"
    ) else (
      goto missing_npm
    )
  )
)
call :log "npm command: %NPM_CMD%"

call :step "node --version"
node --version >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail

call :step "%NPM_CMD% --version"
"%NPM_CMD%" --version >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail

for /f %%V in ('node -p "process.versions.node.split(String.fromCharCode(46))[0]"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 18 goto old_node
call :log "Node version OK"

if /i "%TARGET%"=="codex" (
  set "ENTRY_PATH=%PROJECT%\AGENTS.md"
  set "STATE_PATH=%PROJECT%\.agent-deploy\install-state.json"
  set "FEEDBACK_SKILL_PATH=%PROJECT%\.agents\skills\agent-bundle-feedback\SKILL.md"
  set "CONFIG_PATH=%PROJECT%\.codex\config.toml"
) else if /i "%TARGET%"=="gemini" (
  set "ENTRY_PATH=%PROJECT%\GEMINI.md"
  set "STATE_PATH=%PROJECT%\.agent-deploy\install-state.json"
  set "FEEDBACK_SKILL_PATH=%PROJECT%\.gemini\skills\agent-bundle-feedback\SKILL.md"
  set "CONFIG_PATH="
) else if /i "%TARGET%"=="claude" (
  set "ENTRY_PATH="
  set "STATE_PATH=%PROJECT%\.claude\agent-install-state.json"
  set "FEEDBACK_SKILL_PATH=%PROJECT%\.claude\skills\agent-bundle-feedback\SKILL.md"
  set "CONFIG_PATH=%PROJECT%\.mcp.json"
) else if /i "%TARGET%"=="cursor" (
  set "ENTRY_PATH="
  set "STATE_PATH=%PROJECT%\.cursor\agent-install-state.json"
  set "FEEDBACK_SKILL_PATH=%PROJECT%\.cursor\skills\agent-bundle-feedback\SKILL.md"
  set "CONFIG_PATH=%PROJECT%\.cursor\mcp.json"
) else (
  call :fail_message "unsupported TARGET: %TARGET%"
  exit /b 1
)

pushd "%DEPLOY_DIR%" || goto fail
call :step "%NPM_CMD% run validate"
"%NPM_CMD%" run validate >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail_popd

if "%DIST_TEST_RUN_NPM_TEST%"=="1" (
  if exist "test" (
    call :step "%NPM_CMD% test"
    "%NPM_CMD%" test >> "%LOG_FILE%" 2>&1
    if errorlevel 1 goto fail_popd
  ) else (
    call :log "npm test skipped: test directory not found"
  )
) else (
  call :log "npm test skipped: DIST_TEST_RUN_NPM_TEST=%DIST_TEST_RUN_NPM_TEST%"
)
popd

call :step "doctor before apply"
node "%CLI_JS%" doctor --project "%PROJECT%" >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail

call :step "apply dry-run"
node "%CLI_JS%" apply --target "%TARGET%" --profile "%PROFILE%" --scope "%SCOPE%" --project "%PROJECT%" --dry-run >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail
if defined ENTRY_PATH if exist "%ENTRY_PATH%" goto dry_run_written
if exist "%STATE_PATH%" goto dry_run_written

call :step "apply backup"
node "%CLI_JS%" apply --target "%TARGET%" --profile "%PROFILE%" --scope "%SCOPE%" --project "%PROJECT%" --backup >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail
if defined ENTRY_PATH if not exist "%ENTRY_PATH%" goto missing_path
if not exist "%STATE_PATH%" goto missing_path
if not exist "%FEEDBACK_SKILL_PATH%" goto missing_path
if defined CONFIG_PATH if not exist "%CONFIG_PATH%" goto missing_path

call :step "doctor after apply"
node "%CLI_JS%" doctor --project "%PROJECT%" >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail

call :step "update dry-run"
node "%CLI_JS%" update --target "%TARGET%" --profile "%PROFILE%" --scope "%SCOPE%" --project "%PROJECT%" --dry-run >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail

call :step "repair dry-run"
node "%CLI_JS%" repair --target "%TARGET%" --profile "%PROFILE%" --scope "%SCOPE%" --project "%PROJECT%" --dry-run >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail

call :step "uninstall dry-run"
node "%CLI_JS%" uninstall --target "%TARGET%" --profile "%PROFILE%" --scope "%SCOPE%" --project "%PROJECT%" --dry-run >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto fail
if not exist "%STATE_PATH%" goto missing_path

call :log "Generated files sample:"
dir /s /b "%PROJECT%" >> "%LOG_FILE%" 2>&1

call :log ""
call :log "DIST TEST PASS"
call :log "log: %LOG_FILE%"
call :log "project: %PROJECT%"

for %%I in ("%PROJECT%") do set "PROJECT_NAME=%%~nxI"
if "%DIST_TEST_KEEP_PROJECT%"=="0" (
  if "!PROJECT_NAME:~0,23!"=="agent-bundle-dist-test-" (
    rmdir /s /q "%PROJECT%"
    call :log "project cleanup: removed"
  ) else (
    call :log "project cleanup: skipped for non-generated project path"
  )
) else (
  call :log "project cleanup: kept"
)
exit /b 0

:missing_node
call :fail_message "node is required (>= 18)"
exit /b 1

:missing_npm
call :fail_message "npm is required. Set NPM_BIN=npm.cmd if needed."
exit /b 1

:missing_cli
call :fail_message "agent-deploy CLI not found: %CLI_JS%"
exit /b 1

:old_node
call :fail_message "Node >= 18 required"
exit /b 1

:dry_run_written
call :fail_message "dry-run wrote files unexpectedly"
exit /b 1

:missing_path
call :fail_message "expected installed path not found"
exit /b 1

:fail_popd
popd

goto fail

:fail
call :fail_message "command failed"
exit /b 1

:fail_message
call :log ""
call :log "DIST TEST FAIL"
call :log "%~1"
call :log "log: %LOG_FILE%"
call :log "project: %PROJECT%"
exit /b 0

:step
call :log ""
call :log "==> %~1"
exit /b 0

:log
if "%~1"=="" (
  echo(
  echo(>> "%LOG_FILE%"
) else (
  echo %~1
  echo %~1>> "%LOG_FILE%"
)
exit /b 0
