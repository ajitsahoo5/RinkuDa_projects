# Pre-flight checks before AWS deploy
$ErrorActionPreference = "Continue"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $Root

Write-Host ""
Write-Host "=== Farmer Registry AWS Deploy - Pre-flight ===" -ForegroundColor Cyan
Write-Host ""

function Test-Command($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) { Write-Host "[OK] $name" -ForegroundColor Green; return $true }
  Write-Host "[MISSING] $name" -ForegroundColor Red
  return $false
}

$ok = $true
$ok = (Test-Command aws) -and $ok
$ok = (Test-Command terraform) -and $ok
$ok = (Test-Command docker) -and $ok

Write-Host ""
$identity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "[OK] AWS credentials configured" -ForegroundColor Green
  Write-Host $identity
} else {
  Write-Host "[MISSING] AWS credentials - run: aws configure" -ForegroundColor Red
  Write-Host "  You need Access Key ID + Secret from an IAM user with admin permissions."
  $ok = $false
}

$tfvars = Join-Path $Root "deploy\aws\terraform\terraform.tfvars"
if (Test-Path $tfvars) {
  Write-Host "[OK] terraform.tfvars exists" -ForegroundColor Green
} else {
  Write-Host "[MISSING] terraform.tfvars - copy terraform.tfvars.example and fill in Firebase values" -ForegroundColor Red
  $ok = $false
}

Write-Host ""
if ($ok) {
  Write-Host "Ready to deploy. Next commands:" -ForegroundColor Green
  Write-Host "  cd deploy/aws/terraform"
  Write-Host "  terraform init"
  Write-Host "  terraform plan"
  Write-Host "  terraform apply"
  Write-Host "  cd ../../.."
  Write-Host "  .\deploy\aws\scripts\push-image.ps1"
} else {
  Write-Host "Fix the items above, then re-run this script." -ForegroundColor Yellow
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "Install Docker Desktop: winget install Docker.DockerDesktop" -ForegroundColor Yellow
    Write-Host "Restart PC after install, then start Docker Desktop."
  }
}
