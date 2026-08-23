# Build and push API image to ECR, then redeploy ECS.
# Run from Backend/farmer-business-api

param(
  [string]$Region = "ap-south-1",
  [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $Root

Write-Host "Getting AWS account..."
$Account = aws sts get-caller-identity --query Account --output text

Write-Host "Logging in to ECR..."
aws ecr get-login-password --region $Region |
  docker login --username AWS --password-stdin "$Account.dkr.ecr.$Region.amazonaws.com"

$Ecr = terraform -chdir=deploy/aws/terraform output -raw ecr_repository_url
if (-not $Ecr) { throw "Run terraform apply first to create ECR repository." }

Write-Host "Building Docker image..."
docker build -t farmer-registry-api .

Write-Host "Pushing $Ecr`:$ImageTag ..."
docker tag farmer-registry-api:latest "${Ecr}:${ImageTag}"
docker push "${Ecr}:${ImageTag}"

$Cluster = terraform -chdir=deploy/aws/terraform output -raw ecs_cluster_name
$Service = terraform -chdir=deploy/aws/terraform output -raw ecs_service_name

Write-Host "Forcing ECS deployment on $Cluster / $Service ..."
aws ecs update-service `
  --cluster $Cluster `
  --service $Service `
  --force-new-deployment `
  --region $Region `
  --output text

Write-Host "Done. Health check:"
terraform -chdir=deploy/aws/terraform output -raw health_url
