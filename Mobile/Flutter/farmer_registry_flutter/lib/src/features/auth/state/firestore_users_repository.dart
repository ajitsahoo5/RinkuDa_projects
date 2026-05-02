import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../../models/app_user.dart';

class FirestoreUsersRepository {
  FirestoreUsersRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  DocumentReference<Map<String, Object?>> refForUid(String uid) =>
      _db.collection('users').doc(uid);

  Stream<AppUser?> watchProfile(String uid) {
    return refForUid(uid).snapshots().map((snap) {
      final data = snap.data();
      if (data == null) return null;
      return AppUser.fromFirestoreMap(data);
    });
  }

  Future<AppUser?> getProfile(String uid) async {
    final snap = await refForUid(uid).get();
    final data = snap.data();
    if (data == null) return null;
    return AppUser.fromFirestoreMap(data);
  }

  /// New self-service signups: `role` is always `user`.
  Future<void> writeSignupProfile({
    required String uid,
    required String email,
    required String name,
  }) async {
    final profile = AppUser(
      active: true,
      email: email,
      name: name,
      role: 'user',
    );
    await refForUid(uid).set(profile.toFirestoreMap(), SetOptions(merge: true));
  }

  /// First sign-in without a Firestore row (e.g. Auth created before Firestore provisioning).
  Future<AppUser> bootstrapProfileFromAuth(User user) async {
    final email = user.email ?? '';
    final derivedName = email.isNotEmpty ? email.split('@').first.trim() : 'User';
    final profile = AppUser(
      active: true,
      email: email,
      name: derivedName.isNotEmpty ? derivedName : 'User',
      role: 'user',
    );
    await refForUid(user.uid).set(profile.toFirestoreMap(), SetOptions(merge: true));
    return profile;
  }
}
