@echo off
setlocal EnableExtensions

rem Windows distribution test wrapper. Keep this file simple to avoid cmd quoting issues.
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
set "NODE_CMD=node"
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"

"%NODE_CMD%" "%SCRIPT_DIR%dist_test_windows.js" %*
exit /b %ERRORLEVEL%
