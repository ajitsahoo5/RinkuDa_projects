## Firebase (Firestore) — Pendraban PACS

This app uses **Firebase project `pendraban-pacs`** (separate from Bhela).

| Path | Purpose |
|------|---------|
| `farmers/{id}` | Farmer records |
| `settings/catalog` | Fertilizers, pesticides, seeds, CSC products, crops, remarks |
| `settings/app` | `googleSheetLink`, `address`, `gstNumber`, `mobileNumber` |
| `users/{uid}` | Profile (`displayName`, `role: client`, `active`) |

### Android package

`com.rinkuda.pendraban_pacs` — configured in `android/app/google-services.json`.

### Production rules

Deploy from the **Pendraban admin** project (not Bhela):

```powershell
cd "Admin - web/pendraban-admin"
firebase deploy --only firestore:rules,firestore:indexes --project pendraban-pacs
```

See `Admin - web/pendraban-admin/PENDRABAN_SETUP.md`.

### Run locally

```powershell
cd "Mobile/Flutter/pendraban_pacs_flutter"
flutter pub get
flutter run
```

### Field users

Sign up in the app → Firestore `users/{uid}` with `role: client`. Admins are created only via the admin web (`admin@ppacs.com`).

### Invoice letterhead

PDF/Word invoices read **address, GST, and mobile** from Firestore `settings/app` (set in admin web → **Settings**), plus static Pendraban name and registration line.
