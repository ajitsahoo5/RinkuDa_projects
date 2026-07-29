/// Organization details from Firestore `settings/app` (set in admin web → Settings).
class AppOrganizationSettings {
  const AppOrganizationSettings({
    this.address,
    this.gstNumber,
    this.mobileNumber,
  });

  final String? address;
  final String? gstNumber;
  final String? mobileNumber;

  static AppOrganizationSettings? fromFirestore(Map<String, dynamic>? data) {
    if (data == null) return null;
    String? str(String key) {
      final v = data[key];
      if (v == null) return null;
      final s = v.toString().trim();
      return s.isEmpty ? null : s;
    }

    final settings = AppOrganizationSettings(
      address: str('address'),
      gstNumber: str('gstNumber'),
      mobileNumber: str('mobileNumber'),
    );
    if (settings.address == null &&
        settings.gstNumber == null &&
        settings.mobileNumber == null) {
      return null;
    }
    return settings;
  }
}
