# Dump local PostgreSQL and restore to AWS RDS.
# Requires: pg_dump, pg_restore on PATH, db_migration_cidr set in Terraform.

param(
  [string]$LocalHost = "localhost",
  [string]$LocalUser = "ajit",
  [string]$LocalDb = "rinku_pacs",
  [string]$DumpFile = "rinku_pacs.dump"
)

$ErrorActionPreference = "Stop"
$TfDir = Join-Path $PSScriptRoot "..\terraform"

$RdsHost = terraform -chdir=$TfDir output -raw rds_endpoint
$RdsDb = terraform -chdir=$TfDir output -raw rds_database_name
$RdsUser = terraform -chdir=$TfDir output -raw db_username

Write-Host "Fetching DATABASE_URL from Secrets Manager..."
$SecretJson = aws secretsmanager get-secret-value `
  --secret-id "farmer-registry/prod/app-secrets" `
  --query SecretString `
  --output text
$DbUrl = ($SecretJson | ConvertFrom-Json).DATABASE_URL

Write-Host "Dumping local database $LocalDb ..."
pg_dump -h $LocalHost -U $LocalUser -d $LocalDb -Fc -f $DumpFile

Write-Host "Restoring to RDS $RdsHost ..."
Write-Host "You will be prompted for the RDS password (from Secrets Manager DATABASE_URL)."
pg_restore -h $RdsHost -U $RdsUser -d $RdsDb --clean --if-exists $DumpFile

Write-Host "Done. Remove db_migration_cidr from terraform.tfvars and run terraform apply to lock RDS."
