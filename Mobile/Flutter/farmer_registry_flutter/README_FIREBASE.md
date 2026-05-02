## Firebase (Firestore) setup

This app is now wired to **Firebase Firestore** for:

- `farmers` collection: farmer records (real-time list)
- `settings/app` document: `googleSheetLink`

### 1) Create Firebase project

- In Firebase console, create a project
- Enable **Cloud Firestore**

### 2) Connect Flutter app to Firebase

This repo initializes Firebase via:

- `Firebase.initializeApp()` in `lib/main.dart`

So you must add platform Firebase configs.

#### Recommended (FlutterFire CLI)

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

This will generate `firebase_options.dart` and add platform config files.

#### Manual

- Android: add `android/app/google-services.json`
- iOS: add `ios/Runner/GoogleService-Info.plist`

### 3) Firestore structure

Create documents by using the app UI (Create farmer).

- Collection: `farmers`
  - Document ID: farmer `id` (uuid)
  - Fields:
    - `slNo` (number)
    - `name` (string)
    - `adharNo` (string)
    - `khataOrPlotNo` (string)
    - `mouja` (string)
    - `landInAcre` (number)
    - `ureaSupplied` (string)
    - `signatureOfFarmer` (string)
    - `contactNo` (string)

- Collection: `settings`
  - Doc: `app`
  - Field: `googleSheetLink` (string)

### 4) Suggested security rules (dev)

Use only for development/testing:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

