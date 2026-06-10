/// Firestore `users/{uid}` profile (aligned with admin dashboard).
class AppUser {
  const AppUser({
    required this.active,
    required this.email,
    required this.displayName,
    required this.role,
  });

  final bool active;
  final String email;
  final String displayName;
  final String role;

  static AppUser fromFirestoreMap(Map<String, Object?> json) {
    final displayNameRaw = json['displayName'] ?? json['name'];
    final roleRaw = (json['role'] ?? 'client').toString().toLowerCase();
    final role = roleRaw == 'admin'
        ? 'admin'
        : roleRaw == 'user'
            ? 'client'
            : 'client';
    return AppUser(
      active: _readBool(json['active'], fallback: true),
      email: (json['email'] ?? '').toString(),
      displayName: displayNameRaw?.toString().trim() ?? '',
      role: role,
    );
  }

  Map<String, Object?> toFirestoreMap() {
    return <String, Object?>{
      'active': active,
      'email': email,
      'displayName': displayName.trim().isEmpty ? null : displayName.trim(),
      'role': role == 'admin' ? 'admin' : 'client',
    };
  }

  static bool _readBool(Object? v, {required bool fallback}) {
    if (v is bool) return v;
    return fallback;
  }
}
