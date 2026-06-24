[CmdletBinding()]
param(
  [string]$Target = $(if ($env:TARGET) { $env:TARGET } else { "codex" }),
  [string]$Profile = $(if ($env:PROFILE) { $env:PROFILE } else { "developer" }),
  [string]$Scope = $(if ($env:SCOPE) { $env:SCOPE } else { "project" }),
  [string]$Project = $env:PROJECT,
  [string]$AgentDeployDir = $env:AGENT_DEPLOY_DIR,
  [string]$NpmCommand = $env:NPM_BIN,
  [bool]$KeepProject = $(if ($env:DIST_TEST_KEEP_PROJECT) { $env:DIST_TEST_KEEP_PROJECT -notmatch '^(0|false|no)$' } else { $true }),
  [bool]$RunNpmTest = $(if ($env:DIST_TEST_RUN_NPM_TEST) { $env:DIST_TEST_RUN_NPM_TEST -notmatch '^(0|false|no)$' } else { $true })
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
if (-not $AgentDeployDir) {
  $AgentDeployDir = Join-Path $RepoRoot "agent-deploy"
}
$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$ResultDir = if ($env:DIST_TEST_RESULT_DIR) { $env:DIST_TEST_RESULT_DIR } else { Join-Path $ScriptDir "results" }
if (-not $Project) {
  $Project = Join-Path $env:TEMP "agent-bundle-dist-test-$Timestamp"
}
$LogFile = Join-Path $ResultDir "dist-test-windows-$Timestamp.log"

New-Item -ItemType Directory -Force $ResultDir | Out-Null
New-Item -ItemType Directory -Force $Project | Out-Null

$transcriptStarted = $false
try {
  Start-Transcript -Path $LogFile -Force | Out-Null
  $transcriptStarted = $true

  function Invoke-Step {
    param(
      [Parameter(Mandatory = $true)][string]$Name,
      [Parameter(Mandatory = $true)][scriptblock]$Action
    )
    Write-Host ""
    Write-Host "==> $Name"
    & $Action
  }

  function Invoke-Tool {
    param(
      [Parameter(Mandatory = $true)][string]$File,
      [Parameter(Mandatory = $true)][string[]]$Arguments
    )
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$File exited with code $LASTEXITCODE"
    }
  }

  function Assert-PathExists {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path $Path)) {
      throw "expected path not found: $Path"
    }
  }

  function Assert-PathAbsent {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (Test-Path $Path) {
      throw "path should not exist after dry-run: $Path"
    }
  }

  Write-Host "Agent bundle distribution test"
  Write-Host "repo: $RepoRoot"
  Write-Host "agent-deploy: $AgentDeployDir"
  Write-Host "target/profile/scope: $Target / $Profile / $Scope"
  Write-Host "project: $Project"
  Write-Host "timestamp: $Timestamp UTC"

  if (-not $NpmCommand) {
    $NpmCmd = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
    if ($NpmCmd) {
      $NpmCommand = $NpmCmd.Source
    } else {
      $NpmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
      if ($NpmCmd) {
        $NpmCommand = $NpmCmd.Source
      } else {
        throw "npm is required. Set -NpmCommand or NPM_BIN to npm.cmd when needed."
      }
    }
  }
  Write-Host "npm command: $NpmCommand"

  Invoke-Step "node --version" { Invoke-Tool "node" @("--version") }
  Invoke-Step "npm --version" { Invoke-Tool $NpmCommand @("--version") }
  Invoke-Step "node version check" {
    Invoke-Tool "node" @("-e", "const v=Number(process.versions.node.split('.')[0]); if (v < 18) { console.error('Node >= 18 required, got ' + process.version); process.exit(1); } console.log('Node version OK: ' + process.version);")
  }

  switch ($Target) {
    "codex" {
      $EntryPath = Join-Path $Project "AGENTS.md"
      $StatePath = Join-Path $Project ".agent-deploy\install-state.json"
      $FeedbackSkillPath = Join-Path $Project ".agents\skills\agent-bundle-feedback\SKILL.md"
      $ConfigPath = Join-Path $Project ".codex\config.toml"
    }
    "gemini" {
      $EntryPath = Join-Path $Project "GEMINI.md"
      $StatePath = Join-Path $Project ".agent-deploy\install-state.json"
      $FeedbackSkillPath = Join-Path $Project ".gemini\skills\agent-bundle-feedback\SKILL.md"
      $ConfigPath = ""
    }
    "claude" {
      $EntryPath = ""
      $StatePath = Join-Path $Project ".claude\agent-install-state.json"
      $FeedbackSkillPath = Join-Path $Project ".claude\skills\agent-bundle-feedback\SKILL.md"
      $ConfigPath = Join-Path $Project ".mcp.json"
    }
    "cursor" {
      $EntryPath = ""
      $StatePath = Join-Path $Project ".cursor\agent-install-state.json"
      $FeedbackSkillPath = Join-Path $Project ".cursor\skills\agent-bundle-feedback\SKILL.md"
      $ConfigPath = Join-Path $Project ".cursor\mcp.json"
    }
    default {
      throw "unsupported Target for dist_test.ps1 assertions: $Target"
    }
  }

  Set-Location $AgentDeployDir

  Invoke-Step "npm run validate" { Invoke-Tool $NpmCommand @("run", "validate") }
  if ($RunNpmTest -and (Test-Path (Join-Path $AgentDeployDir "test"))) {
    Invoke-Step "npm test" { Invoke-Tool $NpmCommand @("test") }
  } else {
    Write-Host ""
    Write-Host "==> npm test skipped"
    Write-Host "reason: RunNpmTest=$RunNpmTest or test directory not found"
  }

  Invoke-Step "doctor before apply" { Invoke-Tool "node" @("src\cli.js", "doctor", "--project", $Project) }
  Invoke-Step "apply dry-run" { Invoke-Tool "node" @("src\cli.js", "apply", "--target", $Target, "--profile", $Profile, "--scope", $Scope, "--project", $Project, "--dry-run") }
  if ($EntryPath) { Assert-PathAbsent $EntryPath }
  Assert-PathAbsent $StatePath

  Invoke-Step "apply backup" { Invoke-Tool "node" @("src\cli.js", "apply", "--target", $Target, "--profile", $Profile, "--scope", $Scope, "--project", $Project, "--backup") }
  if ($EntryPath) { Assert-PathExists $EntryPath }
  Assert-PathExists $StatePath
  Assert-PathExists $FeedbackSkillPath
  if ($ConfigPath) { Assert-PathExists $ConfigPath }

  Invoke-Step "doctor after apply" { Invoke-Tool "node" @("src\cli.js", "doctor", "--project", $Project) }
  Invoke-Step "update dry-run" { Invoke-Tool "node" @("src\cli.js", "update", "--target", $Target, "--profile", $Profile, "--scope", $Scope, "--project", $Project, "--dry-run") }
  Invoke-Step "repair dry-run" { Invoke-Tool "node" @("src\cli.js", "repair", "--target", $Target, "--profile", $Profile, "--scope", $Scope, "--project", $Project, "--dry-run") }
  Invoke-Step "uninstall dry-run" { Invoke-Tool "node" @("src\cli.js", "uninstall", "--target", $Target, "--profile", $Profile, "--scope", $Scope, "--project", $Project, "--dry-run") }
  Assert-PathExists $StatePath

  Write-Host ""
  Write-Host "Generated files sample:"
  Get-ChildItem -Path $Project -Recurse -File | Select-Object -First 80 -ExpandProperty FullName

  Write-Host ""
  Write-Host "DIST TEST PASS"
  Write-Host "log: $LogFile"
  Write-Host "project: $Project"

  if ((-not $KeepProject) -and ((Split-Path -Leaf $Project) -like "agent-bundle-dist-test-*")) {
    Remove-Item -Recurse -Force $Project
    Write-Host "project cleanup: removed"
  } elseif (-not $KeepProject) {
    Write-Host "project cleanup: skipped for non-generated project path"
  } else {
    Write-Host "project cleanup: kept"
  }
} catch {
  Write-Host ""
  Write-Host "DIST TEST FAIL"
  Write-Host "log: $LogFile"
  Write-Host "project: $Project"
  Write-Host $_
  exit 1
} finally {
  if ($transcriptStarted) {
    Stop-Transcript | Out-Null
  }
}
