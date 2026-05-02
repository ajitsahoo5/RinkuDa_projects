import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/farmer.dart';
import 'farmers_repository.dart';

class FirestoreFarmersRepository implements FarmersRepository {
  FirestoreFarmersRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  CollectionReference<Map<String, Object?>> get _farmers =>
      _db.collection('farmers');

  @override
  Stream<List<Farmer>> watchFarmers() {
    return _farmers.orderBy('slNo').snapshots().map((snap) {
      return [
        for (final doc in snap.docs) Farmer.fromJson({'id': doc.id, ...doc.data()}),
      ];
    });
  }

  @override
  Future<Farmer?> getById(String id) async {
    final doc = await _farmers.doc(id).get();
    if (!doc.exists) return null;
    return Farmer.fromJson({'id': doc.id, ...?doc.data()});
  }

  @override
  Future<void> upsertFarmer(Farmer farmer) async {
    await _farmers.doc(farmer.id).set(farmer.toJson()..remove('id'), SetOptions(merge: true));
  }

  @override
  Future<void> deleteFarmer(String id) async {
    await _farmers.doc(id).delete();
  }
}

class FirestoreSettingsRepository implements SettingsRepository {
  FirestoreSettingsRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  DocumentReference<Map<String, Object?>> get _doc =>
      _db.collection('settings').doc('app');

  @override
  Stream<String?> watchGoogleSheetLink() {
    return _doc.snapshots().map((snap) {
      final data = snap.data();
      final v = data?['googleSheetLink'];
      if (v == null) return null;
      return v.toString();
    });
  }

  @override
  Future<void> setGoogleSheetLink(String? link) async {
    await _doc.set(
      {'googleSheetLink': link},
      SetOptions(merge: true),
    );
  }
}

