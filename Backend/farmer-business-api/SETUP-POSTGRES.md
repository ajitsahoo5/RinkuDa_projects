# PostgreSQL setup (no Docker)

The API stores all farmer registry data in **PostgreSQL** via Prisma.

## Option A — Install PostgreSQL on Windows (recommended local)

1. Download **PostgreSQL 16** from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer — remember the `postgres` user password
3. Open **SQL Shell (psql)** or pgAdmin and create the database:

```sql
CREATE DATABASE farmer_business;
```

4. Update `.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/farmer_business?schema=public
```

5. Create tables:

```powershell
cd Backend/farmer-business-api
npm run db:migrate
```

## Option B — Free cloud PostgreSQL (Neon)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project → copy the connection string
3. Paste into `.env` as `DATABASE_URL=...`
4. Run `npm run db:push` (applies schema without local migrate history)

## Firebase + migration

Set in `.env`:

```
GOOGLE_APPLICATION_CREDENTIALS=E:\path\to\service-account.json
FIREBASE_PROJECT_ID=farmer-management-a5b32
```

Import Firestore data:

```powershell
npm run migrate:firestore-to-postgres              # preview
npm run migrate:firestore-to-postgres -- --apply --drop   # import
```

## Start API

```powershell
npm run start:dev
```

Health check: `http://localhost:3000/api/v1/health`

## Tables created

| Table | Firestore source |
|-------|------------------|
| `registry_users` | `users/{uid}` |
| `farmers` | `farmers/{id}` |
| `settings_catalog` | `settings/catalog` |
| `settings_app` | `settings/app` |

Plus optional platform tables: `businesses`, `users` (when `REGISTRY_ONLY=false`).
