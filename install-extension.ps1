#!/usr/bin/env powershell
# Script to install the cp-ninja extension in VS Code

Write-Host "Installing CP-Ninja extension..." -ForegroundColor Green

# Try to find VS Code Insiders first, then regular VS Code
$codeInsiders = Get-Command "code-insiders" -ErrorAction SilentlyContinue
$code = Get-Command "code" -ErrorAction SilentlyContinue

if ($codeInsiders) {
    Write-Host "Found VS Code Insiders, installing extension..." -ForegroundColor Yellow
    & code-insiders --install-extension .\cp-ninja.vsix --force
} elseif ($code) {
    Write-Host "Found VS Code, installing extension..." -ForegroundColor Yellow
    & code --install-extension .\cp-ninja.vsix --force
} else {
    Write-Host "VS Code not found in PATH. Please install manually:" -ForegroundColor Red
    Write-Host "1. Open VS Code/VS Code Insiders" -ForegroundColor White
    Write-Host "2. Press Ctrl+Shift+P" -ForegroundColor White
    Write-Host "3. Type 'Extensions: Install from VSIX...'" -ForegroundColor White
    Write-Host "4. Select the file: $(Get-Location)\cp-ninja.vsix" -ForegroundColor White
}

Write-Host "After installation, restart VS Code completely (not just reload window)" -ForegroundColor Green
Write-Host "Then test: @cp-ninja:brainstorming in chat" -ForegroundColor Green