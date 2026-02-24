#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$Repo = 'IMMINJU/claude-pet'
$InstallDir = if ($env:CLAUDE_PET_HOME) { $env:CLAUDE_PET_HOME } else { "$env:LOCALAPPDATA\claude-pet" }

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Err($msg) { Write-Host "Error: $msg" -ForegroundColor Red; exit 1 }

# --- Detect latest release ---------------------------------------------------

Write-Info 'Claude Pet installer (Windows)'

try {
    $release = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest"
    $Tag = $release.tag_name
} catch {
    Write-Err "Could not fetch latest release: $_"
}

Write-Info "Release: $Tag"

$Asset = 'claude-pet-windows-x86_64.exe'
$DownloadUrl = "https://github.com/$Repo/releases/download/$Tag/$Asset"

# --- Download ----------------------------------------------------------------

if (!(Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }

$ExePath = Join-Path $InstallDir 'claude-pet.exe'
Write-Info "Downloading $Asset ..."
Invoke-WebRequest -Uri $DownloadUrl -OutFile $ExePath -UseBasicParsing

# Hooks are registered automatically when the app starts — no setup needed.

# --- PATH hint ---------------------------------------------------------------

$userPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
if ($userPath -notlike "*$InstallDir*") {
    Write-Info ''
    Write-Info "Add to PATH? (adds $InstallDir to your user PATH)"
    $answer = Read-Host '  [Y/n]'
    if ($answer -eq '' -or $answer -match '^[Yy]') {
        [Environment]::SetEnvironmentVariable('PATH', "$InstallDir;$userPath", 'User')
        $env:PATH = "$InstallDir;$env:PATH"
        Write-Info 'Added to PATH. Restart your terminal to use "claude-pet" directly.'
    }
}

Write-Info ''
Write-Info "Installed to $ExePath"
Write-Info 'Run:  claude-pet'
