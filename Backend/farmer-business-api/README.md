# Farmer Business API

NestJS + PostgreSQL + Prisma backend for multi-tenant PACS / farmer-buyer business operations.

Phase 1 includes:

- Firebase Auth verification (same login as Flutter apps)
- Platform super admin creates businesses
- One user belongs to one business
- Prisma schema for `businesses` and `users`

## Stack

- NestJS 11
- PostgreSQL 16
- Prisma
- Firebase Admin SDK

## Quick start

```bash
cd Backend/farmer-business-api
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev --name init_phase1
npm run db:seed
npm run start:dev
```

API base: `http://localhost:3000/api/v1`

## Environment

See `.env.example` for all variables. Minimum for local dev:

- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `SEED_PLATFORM_FIREBASE_UID` (your Firebase Auth UID for platform admin seed)

## Roles

| Role | business_id | Purpose |
|------|-------------|---------|
| `PLATFORM_SUPER_ADMIN` | null | Create/list businesses |
| `BUSINESS_SUPER_ADMIN` | set | Full control inside one PACS |
| `ADMIN` | set | Staff admin |
| `USER` | set | Field user |

## Phase 1 routes

| Method | Route | Auth |
|--------|-------|------|
| GET | `/health` | Public |
| GET | `/auth/me` | Firebase Bearer token |
| POST | `/businesses` | Platform super admin |
| GET | `/businesses` | Platform super admin |
| GET | `/businesses/mine` | Business users |

### Example

```http
GET /api/v1/auth/me
Authorization: Bearer <firebase-id-token>
```

```http
POST /api/v1/businesses
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "name": "Bhela PACS",
  "code": "BHELA-PACS",
  "gstNo": "21AABAB1923D2ZN",
  "address": "Baripada"
}
```

## Project layout

```
src/
  common/          guards, decorators, constants
  prisma/          PrismaService
  modules/
    auth/          Firebase token verify, GET /auth/me
    businesses/    Platform business CRUD (phase 1)
    health/
prisma/
  schema.prisma
  seed.ts
```

## Next phases

- Phase 2: `product_categories`, `products`, stock
- Phase 3: `farmers` (buyers)
- Phase 4: `sales`, `sale_lines`, stock deduction
- Phase 5: Firestore migration scripts

## Notes

- Users must exist in Postgres before first Firebase login (except platform seed).
- Business staff creation endpoints come in a later phase.
- This repo is separate from the older Mongo `farmer-registry-api`.
