@echo off
rem agent-deploy bundle installer (Windows).
rem
rem Unzip the bundle, then from inside your project run:
rem   install.bat --target claude --profile developer            (project — DEFAULT)
rem   install.bat --target claude --profile developer --global   (user-global %USERPROFILE%\.claude ...)
rem   install.bat --target claude --profile developer --dry-run  (preview only)
setlocal enabledelayedexpansion

set "DIR=%~dp0"
set "SCOPE=project"
set "PASS="

:loop
if "%~1"=="" goto run
if /I "%~1"=="--global" (
  set "SCOPE=home"
) else (
  set "PASS=!PASS! %~1"
)
shift
goto loop

:run
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js가 필요합니다. https://nodejs.org 에서 설치 후 다시 실행하세요.
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
