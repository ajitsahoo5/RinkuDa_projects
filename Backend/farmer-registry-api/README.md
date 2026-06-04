# Farmer Registry API

NestJS + MongoDB backend for the RinkuDa farmer registry platform. Domain models and routes mirror the existing **Admin web** (`Admin - web/admin-dashboard`) and **Mobile** (`Mobile/Flutter/farmer_registry_flutter`) apps that currently use Firebase/Firestore.

## Project layout

Aligned with client app structure:

| Layer | Web (React) | Mobile (Flutter) | Backend (NestJS) |
|-------|-------------|------------------|------------------|
| Features | `src/pages/*` | `lib/src/features/*` | `src/modules/*` |
| Models | `src/types/*` | `lib/src/models/*` | `schemas/` + `dto/` per module |
| Data access | `src/lib/*Crud.ts` | `state/*_repository.dart` | `*.service.ts` |
| Auth | Firebase Auth + `users` profile | `features/auth` | `modules/auth` (JWT) |

### Modules

- **auth** — `POST /api/v1/auth/login` (JWT)
- **users** — admin user CRUD (`users` collection, roles `admin` \| `client`)
- **farmers** — farmer registry CRUD + catalog stock deduction on create
- **catalog** — `settings/catalog` equivalent (fertilizers, pesticides, seeds, CSC products, crops, remarks)
- **settings** — `settings/app` equivalent (`googleSheetLink`)
- **health** — `GET /api/v1/health`

## Prerequisites

- Node.js 20+
- MongoDB 6+ running locally or a connection string

## Setup

```bash
cd Backend/farmer-registry-api
cp .env.example .env
npm install
npm run seed:admin
npm run start:dev
```

API base URL: `http://localhost:3000/api/v1`

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CORS_ORIGINS` | Comma-separated allowed origins |

## API overview

### Auth

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "changeme123" }
```

Use the returned `accessToken` as `Authorization: Bearer <token>`.

### Farmers (admin)

- `GET /api/v1/farmers?mouja=&minAcre=&maxAcre=`
- `GET /api/v1/farmers/:id`
- `POST /api/v1/farmers` — creates farmer and deducts catalog stock (same rules as mobile `registerFarmerWithStockDeduction`)
- `PATCH /api/v1/farmers/:id`
- `DELETE /api/v1/farmers/:id`

Farmer JSON shape matches web/mobile (`slNo`, `dateOfPurchase`, purchase lines, etc.). Document `id` is stored as `externalId` in MongoDB (UUID compatible with Firestore doc IDs).

### Catalog (admin)

- `GET /api/v1/catalog`
- `PATCH /api/v1/catalog` — partial update of catalog sections

### Users (admin)

- `GET /api/v1/users/me` — any signed-in user
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:uid`
- `DELETE /api/v1/users/:uid`

### Settings (admin)

- `GET /api/v1/settings/app`
- `PATCH /api/v1/settings/app`

## MongoDB collections

| Collection | Firestore equivalent |
|------------|---------------------|
| `farmers` | `farmers/{id}` |
| `users` | `users/{uid}` |
| `settings_catalog` | `settings/catalog` |
| `settings_app` | `settings/app` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app |
| `npm run seed:admin` | Create first admin from env |

## Next steps for client integration

1. Point web/mobile HTTP clients at this API instead of Firestore (or run both during migration).
2. Replace Firebase Auth with JWT login + bearer tokens.
3. Keep the same DTO field names so forms and exports need minimal changes.
