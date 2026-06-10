## Firebase (Firestore) setup

This app uses **Firebase Firestore** (same project as the admin dashboard):

- `farmers` — farmer records (real-time list, registration with stock deduction)
- `settings/catalog` — fertilizers, pesticides, seeds, CSC products, crops, remark presets
- `settings/app` — `googleSheetLink`
- `users/{uid}` — profile (`displayName`, `role: client`, `active`)

### Production rules

Production security rules are maintained in the admin dashboard repo:

`Admin - web/admin-dashboard/firestore.rules`

Deploy them before releasing the mobile app:

```bash
cd "Admin - web/admin-dashboard"
firebase deploy --only firestore:rules,firestore:indexes
```

**Do not** use open dev rules (`allow read, write: if true`) in production.

See `Admin - web/admin-dashboard/FIRESTORE_PRODUCTION.md` for migration and deployment steps.

### Connect Flutter to Firebase

Initialize via `Firebase.initializeApp()` in `lib/main.dart`.

#### Recommended (FlutterFire CLI)

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

#### Manual

- Android: `android/app/google-services.json`
- iOS: `ios/Runner/GoogleService-Info.plist`

### User sign-up

Field users sign up in the app. Firestore stores:

```json
{
  "email": "user@example.com",
  "displayName": "Field User",
  "role": "client",
  "active": true
}
```

Administrators are created via the admin dashboard or `npm run seed-admin` in the admin project — not via mobile sign-up.

### Firestore structure (farmers)

Document ID: farmer UUID (`id` field in the app).

Fields match the admin dashboard: `slNo`, `dateOfPurchase`, `landOwnerName`, `villageOrMouza`, `khataNo`, `area`, `farmerName`, `aadharNo`, `mobileNo`, `cropsName`, purchase line arrays, `remarks`, etc.

Create documents by registering a farmer in the app (or via the admin dashboard).
