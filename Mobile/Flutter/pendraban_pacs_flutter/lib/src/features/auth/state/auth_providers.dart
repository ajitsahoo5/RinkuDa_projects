import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_user.dart';
import 'firestore_users_repository.dart';

final firestoreUsersRepositoryProvider = Provider<FirestoreUsersRepository>((ref) {
  return FirestoreUsersRepository();
});

/// Real-time Firestore `users/{uid}` for the current Firebase Auth user.
final currentUserProfileProvider = StreamProvider<AppUser?>((ref) {
  final repo = ref.watch(firestoreUsersRepositoryProvider);
  return FirebaseAuth.instance.authStateChanges().asyncExpand((User? user) {
    if (user == null) return Stream<AppUser?>.value(null);
    return repo.watchProfile(user.uid);
  });
});
