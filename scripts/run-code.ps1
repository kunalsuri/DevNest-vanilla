#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start the DevNest development server, killing any existing instance first.

.DESCRIPTION
    Checks whether the dev server (npm run dev) is already listening on the
    configured port. If it is, the occupying process is stopped gracefully
    before a fresh server process is started in the current terminal.

.PARAMETER Port
    TCP port to check for an existing server. Defaults to 5000.

.EXAMPLE
    .\scripts\run-code.ps1
    .\scripts\run-code.ps1 -Port 3000

.NOTES
    Requires Node.js >= 20 and npm >= 10.
    Run from the repository root or any subdirectory — the script always
    changes into the repository root before starting the server.
#>

[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 5000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Helpers ──────────────────────────────────────────────────────────────────

function Write-Step {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "  ✔ $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "  ⚠ $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  ✖ $Message" -ForegroundColor Red
}

# ── Locate repository root ────────────────────────────────────────────────────

$repoRoot = $PSScriptRoot | Split-Path -Parent
if (-not (Test-Path (Join-Path $repoRoot 'package.json'))) {
    Write-Fail "Cannot locate package.json. Expected repository root: $repoRoot"
    exit 1
}

Set-Location $repoRoot

# ── Verify prerequisites ──────────────────────────────────────────────────────

Write-Host ''
Write-Host '══════════════════════════════════════════' -ForegroundColor DarkGray
Write-Host '  DevNest — dev server launcher           ' -ForegroundColor White
Write-Host '══════════════════════════════════════════' -ForegroundColor DarkGray
Write-Host ''

# Node.js
try {
    $nodeVersion = node --version 2>&1
    $nodeMajor   = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt 20) {
        Write-Fail "Node.js $nodeVersion detected. Version 20+ is required."
        exit 1
    }
    Write-Ok "Node.js $nodeVersion"
} catch {
    Write-Fail 'Node.js is not installed or not on PATH.'
    exit 1
}

# npm
try {
    $npmVersion = npm --version 2>&1
    Write-Ok "npm $npmVersion"
} catch {
    Write-Fail 'npm is not installed or not on PATH.'
    exit 1
}

# node_modules
if (-not (Test-Path (Join-Path $repoRoot 'node_modules'))) {
    Write-Warn 'node_modules not found — running npm install first...'
    npm install
}

# ── Kill any process already bound to $Port ───────────────────────────────────

Write-Host ''
Write-Step "Checking port $Port..."

$occupyingPid = $null

try {
    # netstat is available on all Windows versions; -ano gives PIDs
    $netstatLines = netstat -ano 2>$null |
        Select-String "TCP\s+[0-9.:]+:$Port\s+[0-9.:]+\s+LISTENING"

    if ($netstatLines) {
        # Extract PID from the last whitespace-delimited token
        $occupyingPid = ($netstatLines[0].Line -split '\s+')[-1] -as [int]
    }
} catch {
    # Non-fatal — fall through and attempt to start regardless
}

if ($occupyingPid -and $occupyingPid -gt 0) {
    try {
        $proc = Get-Process -Id $occupyingPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Warn "Port $Port in use by PID $occupyingPid ($($proc.ProcessName)) — stopping it..."
            Stop-Process -Id $occupyingPid -Force
            # Wait up to 5 s for the port to be released
            $waited = 0
            do {
                Start-Sleep -Milliseconds 300
                $waited += 300
                $stillBound = netstat -ano 2>$null |
                    Select-String "TCP\s+[0-9.:]+:$Port\s+[0-9.:]+\s+LISTENING"
            } while ($stillBound -and $waited -lt 5000)

            if ($stillBound) {
                Write-Fail "Port $Port is still in use after stopping PID $occupyingPid. Aborting."
                exit 1
            }
            Write-Ok "Process $occupyingPid stopped. Port $Port is free."
        }
    } catch {
        Write-Fail "Failed to stop process on port ${Port}: $_"
        exit 1
    }
} else {
    Write-Ok "Port $Port is free."
}

# ── Start the dev server ──────────────────────────────────────────────────────

Write-Host ''
Write-Step 'Starting dev server (npm run dev)...'
Write-Host '  Press Ctrl+C to stop.' -ForegroundColor DarkGray
Write-Host ''

npm run dev
