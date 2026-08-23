# Deploy Farmer Registry API on Render

Deploy **PostgreSQL + NestJS API** on [Render](https://render.com) — simpler and cheaper than AWS for this project.

## What you get

| Resource | Render service | Approx. cost |
|----------|----------------|--------------|
| PostgreSQL 16 | Render Postgres (Starter) | **~$7/month** |
| NestJS API | Render Web Service (Docker, Starter) | **~$7/month** |
| **Total** | | **~$14/month (~₹1,200)** |

Free web tier exists but **spins down after 15 min idle** (slow first request). Postgres has no permanent free tier on new accounts — use **Starter**.

---

## Prerequisites

1. [Render account](https://dashboard.render.com/register)
2. GitHub repo with your code pushed (or connect Git later)
3. Firebase service account values from:
   `Keys/farmer-management-a5b32-firebase-adminsdk-fbsvc-*.json`

---

## Option A — One-click Blueprint (recommended)

### 1. Push code to GitHub

Ensure `Backend/farmer-business-api/` is in your repo (with `Dockerfile`, `render.yaml`, `prisma/`).

### 2. Create Blueprint on Render

1. [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint**
2. Connect your GitHub repo
3. Set **Root Directory** to:
   ```
   Backend/farmer-business-api
   ```
4. Render detects `render.yaml` → **Apply**

### 3. Set secret environment variables

When prompted (or after deploy: **farmer-registry-api** → **Environment**):

| Key | Value |
|-----|--------|
| `FIREBASE_CLIENT_EMAIL` | From JSON `client_email` |
| `FIREBASE_PRIVATE_KEY` | From JSON `private_key` — paste entire key including `-----BEGIN PRIVATE KEY-----` lines |
| `CORS_ORIGINS` | `http://localhost:5173,https://your-admin.onrender.com` |

**Tip for private key on Render:** paste as multi-line in the dashboard (not `\n` escapes).

### 4. Wait for deploy

- Build: Docker image + `prisma migrate deploy` on start
- Health check: `/api/v1/health`
- Live URL: `https://farmer-registry-api.onrender.com` (name may vary)

Test:

```
https://YOUR-SERVICE.onrender.com/api/v1/health
https://YOUR-SERVICE.onrender.com/api/v1/docs
```

---

## Option B — Manual setup (no Blueprint)

### 1. Create PostgreSQL

1. **New +** → **PostgreSQL**
2. Name: `farmer-registry-db`
3. Database: `rinku_pacs`
4. User: `registry`
5. Region: **Singapore** (closest to India)
6. Plan: **Starter**
7. Create → copy **Internal Database URL** and **External Database URL**

### 2. Create Web Service

1. **New +** → **Web Service**
2. Connect repo, root directory: `Backend/farmer-business-api`
3. **Runtime: Docker**
4. Plan: **Starter**
5. Region: **Singapore**
6. Health check path: `/api/v1/health`

**Environment variables:**

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Internal Database URL from step 1 |
| `REGISTRY_ONLY` | `true` |
| `API_PREFIX` | `api/v1` |
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `farmer-management-a5b32` |
| `FIREBASE_CLIENT_EMAIL` | (secret) |
| `FIREBASE_PRIVATE_KEY` | (secret) |
| `CORS_ORIGINS` | `http://localhost:5173` |

7. **Create Web Service**

---

## Migrate local data to Render Postgres

Use the **External Database URL** from Render (starts with `postgresql://...`).

### Option 1 — pg_dump / pg_restore

```powershell
# Dump local DB
pg_dump -h localhost -U ajit -d rinku_pacs -Fc -f rinku_pacs.dump

# Restore to Render (paste External URL when prompted, or use env var)
$env:RENDER_DATABASE_URL = "postgresql://registry:xxxx@dpg-xxxx.singapore-postgres.render.com/rinku_pacs"
pg_restore -d $env:RENDER_DATABASE_URL --clean --if-exists rinku_pacs.dump
```

Or run:

```powershell
cd Backend/farmer-business-api
.\deploy\render\scripts\migrate-db-to-render.ps1 -ExternalDatabaseUrl "YOUR_EXTERNAL_URL"
```

### Option 2 — Re-import Excel

```powershell
$env:DATABASE_URL = "YOUR_RENDER_EXTERNAL_URL"
cd Backend/farmer-business-api
npm run db:deploy
npm run import:data-registry-xlsx -- Keys/data-registry-full-2026-08-23.xlsx
```

**After import:** remove wide IP access if you added it in Render Postgres settings.

---

## Point admin-dashboard at Render

In `Admin - web/admin-dashboard/.env`:

```env
VITE_API_BASE_URL=https://farmer-registry-api.onrender.com/api/v1
```

Restart admin dev server. Sign in with Firebase — admin user must exist in `registry_users` on Render Postgres.

---

## Deploy updates

Push to GitHub → Render auto-redeploys (if auto-deploy is on).

Manual: Dashboard → **farmer-registry-api** → **Manual Deploy** → **Deploy latest commit**.

Migrations run automatically on each deploy (`docker-entrypoint.sh`).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Prisma | Ensure `prisma/` and `package-lock.json` are committed |
| `401` from API | Check `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` |
| CORS errors | Add admin URL to `CORS_ORIGINS`, redeploy |
| DB connection failed | Web service must use **Internal** Database URL, not External |
| Slow first request | Free/Starter spin-down — upgrade plan or use a uptime ping |
| Health check fails | Confirm path is `/api/v1/health` and service listens on `$PORT` |

---

## Render vs AWS (your project)

| | Render | AWS (our Terraform) |
|--|--------|---------------------|
| Monthly cost | **~$14** | **~$35–50** |
| Setup time | **~30 min** | **2–4 hours** |
| DevOps | Minimal | VPC, ECS, ALB, IAM |
| Best for | Small admin API + DB | Large scale / enterprise |

---

## Tear down

Render Dashboard → select **farmer-registry-api** → **Settings** → **Delete Web Service**

Same for **farmer-registry-db** PostgreSQL instance.
