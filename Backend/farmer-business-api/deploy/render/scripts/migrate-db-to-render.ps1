# Restore local PostgreSQL dump to Render Postgres (External URL).
param(
  [Parameter(Mandatory = $true)]
  [string]$ExternalDatabaseUrl,
  [string]$LocalHost = "localhost",
  [string]$LocalUser = "ajit",
  [string]$LocalDb = "rinku_pacs",
  [string]$DumpFile = "rinku_pacs.dump"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $Root

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump not found. Install PostgreSQL client tools and add to PATH."
}

Write-Host "Dumping local database $LocalDb ..."
pg_dump -h $LocalHost -U $LocalUser -d $LocalDb -Fc -f $DumpFile

Write-Host "Restoring to Render Postgres ..."
$env:PGSSLMODE = "require"
pg_restore -d $ExternalDatabaseUrl --clean --if-exists --no-owner --no-acl $DumpFile

Write-Host "Done. Test API health:"
Write-Host "  https://YOUR-SERVICE.onrender.com/api/v1/health"
