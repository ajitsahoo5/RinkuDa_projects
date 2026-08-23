# Deploy Farmer Registry API to AWS

This guide deploys:

- **Amazon RDS PostgreSQL 16** — your registry database
- **Amazon ECS Fargate** — NestJS API container
- **Application Load Balancer** — public HTTP endpoint
- **Amazon ECR** — Docker image registry
- **AWS Secrets Manager** — `DATABASE_URL`, Firebase credentials, CORS

Estimated cost (budget mode, `enable_nat_gateway = false`, Mumbai `ap-south-1`):

| Service | Approx. monthly |
|---------|-----------------|
| RDS `db.t4g.micro` | ~$12–15 |
| Fargate 0.25 vCPU / 512 MB | ~$8–12 |
| ALB | ~$16–20 |
| ECR + logs | ~$1–3 |
| **Total** | **~$35–50** |

Add ~$32/month if you enable NAT Gateway for private-only subnets.

---

## Prerequisites

1. **AWS account** with billing enabled
2. Tools installed on your machine (or use [AWS CloudShell](https://console.aws.amazon.com/cloudshell)):
   - [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
   - [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for building the image)
3. **Firebase service account JSON** — same file as local `GOOGLE_APPLICATION_CREDENTIALS`
4. Local PostgreSQL data already imported (your `rinku_pacs` database)

---

## Step 1 — Configure Terraform

```powershell
cd Backend/farmer-business-api/deploy/aws/terraform
copy terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

| Variable | What to set |
|----------|-------------|
| `cors_origins` | Your admin app URL(s), e.g. `https://admin.yourdomain.com` |
| `firebase_client_email` | From service account JSON `client_email` |
| `firebase_private_key` | From JSON `private_key` — keep `\n` for line breaks |
| `db_migration_cidr` | Your public IP as `x.x.x.x/32` (for one-time DB import) |

Find your IP: https://ifconfig.me

---

## Step 2 — Create AWS infrastructure

```powershell
terraform init
terraform plan
terraform apply
```

Save the outputs:

```powershell
terraform output
```

You will get:

- `api_url` — e.g. `http://farmer-registry-alb-xxx.ap-south-1.elb.amazonaws.com/api/v1`
- `ecr_repository_url` — where to push the Docker image
- `health_url` — test after deploy

---

## Step 3 — Build and push Docker image

From `Backend/farmer-business-api`:

```powershell
# Login to ECR (replace region/account if different)
$region = "ap-south-1"
$account = aws sts get-caller-identity --query Account --output text
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin "$account.dkr.ecr.$region.amazonaws.com"

# Build & push
$ecr = terraform -chdir=deploy/aws/terraform output -raw ecr_repository_url
docker build -t farmer-registry-api .
docker tag farmer-registry-api:latest "${ecr}:latest"
docker push "${ecr}:latest"

# Restart ECS to pick up the image
aws ecs update-service `
  --cluster farmer-registry-cluster `
  --service farmer-registry-api `
  --force-new-deployment `
  --region ap-south-1
```

Or run the helper script:

```powershell
.\deploy\aws\scripts\push-image.ps1
```

Wait ~2 minutes, then open `health_url` in a browser — you should see `{"status":"ok"}`.

---

## Step 4 — Migrate local PostgreSQL data to RDS

### Option A — pg_dump / pg_restore (recommended)

With `db_migration_cidr` set in Terraform, RDS accepts connections from your IP.

Get the database password from Secrets Manager:

```powershell
aws secretsmanager get-secret-value `
  --secret-id farmer-registry/prod/app-secrets `
  --query SecretString `
  --output text | ConvertFrom-Json | Select-Object DATABASE_URL
```

Dump local database:

```powershell
pg_dump -h localhost -U ajit -d rinku_pacs -Fc -f rinku_pacs.dump
```

Restore to RDS (host from `terraform output rds_endpoint`):

```powershell
$host = terraform -chdir=deploy/aws/terraform output -raw rds_endpoint
pg_restore -h $host -U registry_admin -d rinku_pacs --clean --if-exists rinku_pacs.dump
```

**After import succeeds**, remove migration access:

```powershell
# In terraform.tfvars set: db_migration_cidr = ""
terraform apply
```

### Option B — Re-run import scripts against RDS

Set `DATABASE_URL` in your shell to the RDS connection string from Secrets Manager, then:

```powershell
cd Backend/farmer-business-api
npm run db:deploy
npm run import:data-registry-xlsx -- Keys/data-registry-full-2026-08-23.xlsx
```

---

## Step 5 — Point admin-dashboard at AWS

In `Admin - web/admin-dashboard/.env`:

```
VITE_API_BASE_URL=http://YOUR-ALB-DNS/api/v1
```

Rebuild/restart the admin app. Sign in with Firebase — your admin user must exist in `registry_users` on RDS.

Swagger on AWS: `http://YOUR-ALB-DNS/api/v1/docs`

---

## Step 6 — HTTPS (optional but recommended)

1. Register a domain in Route 53 (or any DNS provider)
2. Request a free ACM certificate in **us-east-1** (for CloudFront) or **ap-south-1** (for ALB)
3. Add an HTTPS listener on the ALB and redirect HTTP → HTTPS
4. Update `cors_origins` and `VITE_API_BASE_URL` to `https://api.yourdomain.com/api/v1`

---

## Updating the API after code changes

```powershell
docker build -t farmer-registry-api .
docker push "${ecr}:latest"
aws ecs update-service --cluster farmer-registry-cluster --service farmer-registry-api --force-new-deployment
```

Migrations run automatically on container start (`prisma migrate deploy` in `docker-entrypoint.sh`).

---

## Environment variables (production)

Stored in **Secrets Manager** — do not commit these:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | RDS PostgreSQL connection |
| `FIREBASE_PROJECT_ID` | Firebase project |
| `FIREBASE_CLIENT_EMAIL` | Service account |
| `FIREBASE_PRIVATE_KEY` | Service account key |
| `REGISTRY_ONLY` | `true` for registry mode |
| `CORS_ORIGINS` | Admin web origins |
| `PORT` | `3000` |
| `API_PREFIX` | `api/v1` |

Alternative: set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full JSON string instead of email + key.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| ECS tasks keep restarting | Check CloudWatch log group `/ecs/farmer-registry-api` |
| `401` from API | Firebase token invalid; check service account matches project |
| CORS errors | Add admin URL to `cors_origins` in Terraform, `terraform apply` |
| Can't connect to RDS | Ensure `db_migration_cidr` includes your IP; RDS SG allows 5432 |
| Health check fails | Wait 60s after deploy; verify `/api/v1/health` returns 200 |

---

## Tear down

```powershell
cd deploy/aws/terraform
terraform destroy
```

This deletes RDS (unless `deletion_protection` is on for prod), ECS, ALB, and secrets.

---

## Architecture

```
Internet
   │
   ▼
Application Load Balancer (public)
   │
   ▼
ECS Fargate (API container :3000)
   │
   ├── Secrets Manager (env vars)
   │
   ▼
RDS PostgreSQL (private VPC, not public)
```

Firebase Auth verification happens inside the API container (outbound HTTPS to Google).
