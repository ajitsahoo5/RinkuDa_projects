import 'package:firebase_auth/firebase_auth.dart';

import '../../models/app_user.dart';
import 'state/firestore_users_repository.dart';

/// Returns `null` if the user may proceed; otherwise a human-readable blocker message.
Future<String?> ensureSignedInProfileOrMessage({
  required User user,
  required FirestoreUsersRepository repo,
}) async {
  try {
    AppUser? profile = await repo.getProfile(user.uid);
    profile ??= await repo.bootstrapProfileFromAuth(user);
    if (!profile.active) return 'This account has been deactivated.';
    return null;
  } on FirebaseException catch (e) {
    return 'Could not load your profile (${e.code}).';
  }
}

/// Writes `users/{uid}` after Auth signup. Returns an error message on failure.
Future<String?> completeSignupProfile({
  required User user,
  required String displayName,
  required FirestoreUsersRepository repo,
}) async {
  try {
    final email = user.email ?? '';
    await repo.writeSignupProfile(
      uid: user.uid,
      email: email,
      name: displayName.trim(),
    );
    return null;
  } on FirebaseException catch (e) {
    return 'Could not save your profile (${e.code}). Try again.';
  }
}
