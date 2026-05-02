/// Firestore `users/{uid}` profile (same fields as admin dashboard / console).
class AppUser {
  const AppUser({
    required this.active,
    required this.email,
    required this.name,
    required this.role,
  });

  final bool active;
  final String email;
  final String name;
  final String role;

  static AppUser fromFirestoreMap(Map<String, Object?> json) {
    return AppUser(
      active: _readBool(json['active'], fallback: true),
      email: (json['email'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      role: (json['role'] ?? 'user').toString(),
    );
  }

  Map<String, Object?> toFirestoreMap() {
    return <String, Object?>{
      'active': active,
      'email': email,
      'name': name,
      'role': role,
    };
  }

  static bool _readBool(Object? v, {required bool fallback}) {
    if (v is bool) return v;
    return fallback;
  }
}
