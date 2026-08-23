# Generates terraform.tfvars from Firebase service account JSON (gitignored).
param(
  [string]$FirebaseJsonPath = "..\..\..\Keys\farmer-management-a5b32-firebase-adminsdk-fbsvc-1af35d1f50.json",
  [string]$MigrationCidr = "49.42.143.178/32",
  [string]$CorsOrigins = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"
$TfDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$JsonPath = Resolve-Path (Join-Path $TfDir $FirebaseJsonPath)
$sa = Get-Content $JsonPath -Raw | ConvertFrom-Json
$escapedKey = ($sa.private_key -replace "`r?`n", '\n') -replace '"', '\"'

$out = @"
aws_region   = "ap-south-1"
environment  = "prod"
project_name = "farmer-registry"

cors_origins = "$CorsOrigins"

firebase_project_id   = "$($sa.project_id)"
firebase_client_email = "$($sa.client_email)"
firebase_private_key  = "$escapedKey"

enable_nat_gateway = false
db_instance_class  = "db.t4g.micro"
db_migration_cidr  = "$MigrationCidr"
desired_count      = 1
image_tag          = "latest"
"@

$target = Join-Path $TfDir "terraform.tfvars"
Set-Content -Path $target -Value $out -Encoding UTF8
Write-Host "Wrote $target"
Write-Host "Update cors_origins when you have a live admin URL."
