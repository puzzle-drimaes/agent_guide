#!/usr/bin/env pwsh
# agent-deploy bundle installer (Windows PowerShell).
#
# Unzip the bundle, then from inside your project run (PowerShell / pwsh):
#   .\install.ps1 --target codex --profile developer             (project — DEFAULT)
#   .\install.ps1 --target gemini --profile developer            (project GEMINI.md, .gemini ...)
#   .\install.ps1 --target claude --profile developer --global   (user-global $env:USERPROFILE\.claude ...)
#   .\install.ps1 --target codex --profile developer --dry-run   (preview only)
#
# If PowerShell blocks the script (execution policy / downloaded-file mark), run:
#   pwsh -ExecutionPolicy Bypass -File .\install.ps1 --target codex --profile developer --dry-run
#   (or with Windows PowerShell: powershell -ExecutionPolicy Bypass -File .\install.ps1 ...)
# To clear the downloaded-file mark once: Unblock-File .\install.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$dir = $PSScriptRoot
$cli = Join-Path (Join-Path $dir 'src') 'cli.js'

if (-not (Test-Path -LiteralPath $cli)) {
  Write-Error "agent-deploy bundle 구조를 확인할 수 없습니다: $cli 없음 (zip을 푼 폴더 안에서 실행하세요)"
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js가 필요합니다. https://nodejs.org 에서 LTS(>=18) 설치 후 다시 실행하세요."
  Write-Host "(설치 후에도 문제가 있으면 진단: node `"$cli`" doctor)"
  exit 1
}

# PowerShell arrays preserve each argument verbatim, so passthrough values with
# spaces (e.g. --project "C:\My Projects\repo") survive without manual re-quoting.
$scope = 'project'
$rest = @()
foreach ($a in $args) {
  if ($a -eq '--global') { $scope = 'home' } else { $rest += $a }
}

if ($scope -eq 'home') {
  Write-Host "-> 전역(home) 설치: $env:USERPROFILE"
  & node $cli apply --scope home @rest
} else {
  Write-Host "-> 프로젝트 설치: $((Get-Location).Path)"
  & node $cli apply --scope project --project (Get-Location).Path @rest
}
exit $LASTEXITCODE
