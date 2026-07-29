# Firestore production setup (Admin web + Mobile Flutter)

Both apps share one Firebase project (`farmer-management-a5b32`) and these Firestore paths:

| Path | Purpose |
|------|---------|
| `farmers/{id}` | Farmer registry records |
| `users/{uid}` | Profile for each Firebase Auth user (`admin` or `client`) |
| `settings/catalog` | Inventory, crops, remark presets |
| `settings/app` | `googleSheetLink`, `address`, `gstNumber`, `mobileNumber` |

## 1. Prerequisites

- Firebase project with **Authentication → Email/Password** enabled
- **Cloud Firestore** in production mode (not open test rules)
- Service account JSON for scripts (`GOOGLE_APPLICATION_CREDENTIALS`)

## 2. Migrate existing data

Normalizes legacy mobile profiles (`name` → `displayName`, `user` → `client`):

```powershell
cd "Admin - web/admin-dashboard"
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"

# Preview
npm run migrate:firestore

# Apply
npm run migrate:firestore -- --apply
```

Optional: copy farmers/catalog/app settings from local MongoDB API:

```powershell
$env:MONGODB_URI="mongodb://127.0.0.1:27017/farmer_registry"
npm run migrate:firestore -- --apply --from-mongodb
```

MongoDB `users` are **not** migrated (JWT passwords). Create Firebase users via `seed-admin` or the admin dashboard.

## 3. Seed first admin

```powershell
npm run seed-admin -- you@example.com "yourPassword6+"
```

## 4. Deploy rules, indexes, functions, hosting

```powershell
npm run deploy:all
```

Or individually:

```powershell
npm run deploy:rules
npm run deploy:indexes
npm run deploy:functions
npm run deploy
```

CI on `main` deploys hosting, Firestore rules/indexes, and Cloud Functions when admin-dashboard files change.

## 5. Security model

| Role | Farmers | settings/catalog | settings/app | users |
|------|---------|------------------|--------------|-------|
| **admin** | read/write/delete | read/write | read/write | manage all |
| **client** (mobile field user) | read + create | read/write (stock deduction) | read only | own profile only |

Mobile signups create `users/{uid}` with `role: client`. The admin dashboard rejects non-admin sign-ins.

Rules live in `firestore.rules`. Do **not** use open `allow read, write: if true` in production.

## 6. Mobile Flutter

- Android: `android/app/google-services.json` (same project ID)
- Run `flutterfire configure` for iOS / `firebase_options.dart` when building for iOS
- User profiles use `displayName` and `role: client` (same as admin dashboard)

## 7. Indexes

`firestore.indexes.json` defines:

- `farmers` ordered by `slNo`
- `users` ordered by `email`

Deploy with `npm run deploy:indexes` after changing queries.
