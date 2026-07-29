# Pendraban PACS — Admin dashboard setup

Separate Firebase project from Bhela. **No shared data.**

| Item | Value |
|------|--------|
| Firebase project ID | `pendraban-pacs` |
| Admin folder | `Admin - web/pendraban-admin` |
| Web app | Pendraban Admin |

## Live admin URL

**https://pendraban-pacs.web.app**

## Admin login

| Field | Value |
|-------|--------|
| Email | `admin@ppacs.com` |
| Password | `Ppacs@Admin2026` |

Change the password after first login (Settings → or Firebase Console → Authentication).

## Already done

- Firebase project `pendraban-pacs` created
- Firestore + security rules deployed
- **Email/Password Authentication** enabled
- Admin user `admin@ppacs.com` created (Auth + Firestore `users/{uid}` role `admin`)
- **Hosting deployed** → https://pendraban-pacs.web.app
- Web app registered; `.env` filled with SDK config
- Branding, logo, gold theme applied

## Cloud Functions (Users page)

User management (`adminCreateUser`, `adminDeleteUser`) requires **Cloud Functions**, which need an **open** billing account. Deploy failed with:

> Billing account is not open

When billing is active, run:

```powershell
cd "Admin - web/pendraban-admin"
npm run deploy:functions
```

Until then, the dashboard login, farmers, catalog, and **Settings** (address/GST/mobile) work. The **Users** page needs functions.

## Finish setup (one-time)

### 1. Enable Email/Password sign-in

Firebase Console → **Authentication** → **Sign-in method** → enable **Email/Password**.

### 2. Deploy Cloud Functions + Hosting (optional until you go live)

```powershell
cd "Admin - web/pendraban-admin"
npm install
npm run deploy:all
```

Functions (`adminCreateUser`, `adminDeleteUser`) are required for the **Users** page.

### 3. Create the first admin account

Download a **service account key** for `pendraban-pacs`:

Firebase Console → Project settings → Service accounts → **Generate new private key**

Then:

```powershell
cd "Admin - web/pendraban-admin"
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\pendraban-pacs-serviceAccount.json"
npm run seed-admin -- admin@pendraban.in "YourSecurePassword6+"
```

Replace email and password. Sign in at `npm run dev` → http://localhost:5173

**Manual alternative (Firebase Console):**

1. Authentication → Users → **Add user** (email + password).
2. Copy the new user’s **UID**.
3. Firestore → **Start collection** `users` → document ID = that UID → fields:
   - `email` (string)
   - `role` = `admin`
   - `active` = `true` (boolean)
   - `displayName` (string, optional)

### 4. Organization settings (address / GST / mobile)

After login: sidebar → **Settings** → save address, GST, and mobile.

Stored in Firestore `settings/app` (`address`, `gstNumber`, `mobileNumber`).

### 5. Seed catalog

Use **Catalog** pages (fertilizers, seeds, etc.) or copy from Bhela manually.

## Local dev

```powershell
cd "Admin - web/pendraban-admin"
npm run dev
```

## Firestore paths

Same schema as Bhela, isolated project:

| Path | Purpose |
|------|---------|
| `farmers/{id}` | Farmer records |
| `users/{uid}` | Auth profiles (`admin` / `client`) |
| `settings/catalog` | Inventory + presets |
| `settings/app` | `googleSheetLink`, `address`, `gstNumber`, `mobileNumber` |

## Next: Flutter Android app

```powershell
cd "Mobile/Flutter/pendraban_pacs_flutter"
flutter pub get
flutter run
```

- Package: `com.rinkuda.pendraban_pacs`
- Firebase: `pendraban-pacs` (`android/app/google-services.json`)
- Invoices use address/GST/mobile from admin **Settings** (Firestore `settings/app`)
- Field staff: sign up in the app (role `client`); catalog must be seeded in admin first
