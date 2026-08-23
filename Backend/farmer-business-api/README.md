# Farmer Business API

NestJS + **PostgreSQL (Prisma)** backend for the farmer registry (Admin web + Flutter) and optional multi-tenant platform features.

## Quick start (PostgreSQL, no Docker)

See **[SETUP-POSTGRES.md](./SETUP-POSTGRES.md)** for installing PostgreSQL on Windows or using Neon cloud.

```powershell
cd Backend/farmer-business-api
copy .env.example .env   # set DATABASE_URL + GOOGLE_APPLICATION_CREDENTIALS
npm install
npm run db:migrate     # create tables
npm run start:dev
```

API: `http://localhost:3000/api/v1`

Health check: `http://localhost:3000/api/v1/health`

## Deploy to Render (recommended — ~$14/month)

See **[deploy/render/DEPLOY-RENDER.md](./deploy/render/DEPLOY-RENDER.md)** for PostgreSQL + Docker web service on Render.

Quick start:

1. Push repo to GitHub
2. Render → **New Blueprint** → root directory `Backend/farmer-business-api`
3. Set `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `CORS_ORIGINS`
4. Migrate local DB with `deploy/render/scripts/migrate-db-to-render.ps1`

## Deploy to AWS (RDS + ECS)

See **[deploy/aws/DEPLOY-AWS.md](./deploy/aws/DEPLOY-AWS.md)** (~$35–50/month).

## Import Firestore → PostgreSQL

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="E:\path\to\service-account.json"
npm run migrate:firestore-to-postgres              # preview
npm run migrate:firestore-to-postgres -- --apply --drop   # import
```

## Registry routes (`REGISTRY_ONLY=true`)

Firebase Bearer token required. Data in PostgreSQL:

| Table | Firestore source |
|-------|------------------|
| `registry_users` | `users/{uid}` |
| `farmers` | `farmers/{id}` |
| `settings_catalog` | `settings/catalog` |
| `settings_app` | `settings/app` |

| Method | Route |
|--------|-------|
| GET/PATCH | `/registry/users`, `/registry/users/me` |
| GET/POST/PATCH/DELETE | `/registry/farmers` |
| GET/PATCH | `/registry/catalog` |
| GET/PATCH | `/registry/settings/app` |

## Environment

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/farmer_business?schema=public
REGISTRY_ONLY=true
FIREBASE_PROJECT_ID=farmer-management-a5b32
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:push` | Push schema (cloud DBs) |
| `npm run migrate:firestore-to-postgres` | Firestore import |
