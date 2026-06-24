@echo off
rem Force UTF-8 so Korean messages render correctly on the default console code page.
chcp 65001 >nul
rem agent-deploy bundle installer (Windows).
rem
rem Unzip the bundle, then from inside your project run:
rem   install.bat --target codex --profile developer             (project — DEFAULT)
rem   install.bat --target gemini --profile developer            (project GEMINI.md, .gemini ...)
rem   install.bat --target claude --profile developer --global   (user-global %USERPROFILE%\.claude ...)
rem   install.bat --target codex --profile developer --dry-run   (preview only)
setlocal enabledelayedexpansion

set "DIR=%~dp0"
set "SCOPE=project"
set "PASS="

:loop
if "%~1"=="" goto run
if /I "%~1"=="--global" (
  set "SCOPE=home"
) else (
  rem Re-quote each passthrough arg so values with spaces survive
  rem (e.g. --project "C:\My Projects\repo").
  set PASS=!PASS! "%~1"
)
shift
goto loop

:run
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js가 필요합니다. https://nodejs.org 에서 LTS^(^>=18^) 설치 후 다시 실행하세요.
  echo ^(설치 후에도 문제가 있으면 진단: node "%DIR%src\cli.js" doctor^)
  exit /b 1
)

if /I "%SCOPE%"=="home" (
  echo -^> 전역^(home^) 설치: %USERPROFILE%
  node "%DIR%src\cli.js" apply --scope home !PASS!
) else (
  echo -^> 프로젝트 설치: %CD%
  node "%DIR%src\cli.js" apply --scope project --project "%CD%" !PASS!
)
endlocal
