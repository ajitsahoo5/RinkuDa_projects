# Release signing (local only — do not commit)

Generate keystore (once):

```powershell
cd "Mobile/Flutter/pendraban_pacs_flutter/android"
keytool -genkeypair -v -storetype PKCS12 -keystore pendraban-release.jks -alias pendraban -keyalg RSA -keysize 2048 -validity 10000
```

Copy `key.properties.example` → `key.properties` and set passwords.

Build signed APK:

```powershell
cd "Mobile/Flutter/pendraban_pacs_flutter"
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

**Back up `pendraban-release.jks` and passwords** — required for Play Store updates.
