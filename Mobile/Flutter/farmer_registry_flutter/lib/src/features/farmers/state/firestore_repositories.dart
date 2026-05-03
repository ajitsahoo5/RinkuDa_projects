import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/crop_catalog_entry.dart';
import '../../../models/farmer.dart' show Farmer, normalizedAadharDigits, normalizedMobileDigits;
import '../../../models/fertilizer_type.dart';
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
  Future<Farmer?> findConflictingFarmer(Farmer farmer, {String? excludeFarmerId}) async {
    final a = normalizedAadharDigits(farmer.aadharNo);
    final m = normalizedMobileDigits(farmer.mobileNo);
    final checkAadhar = a.length == 12;
    final checkMobile = m.length == 10 && RegExp(r'^[6-9]\d{9}$').hasMatch(m);
    if (!checkAadhar && !checkMobile) return null;

    final snap = await _farmers.get();
    for (final doc in snap.docs) {
      if (doc.id == excludeFarmerId) continue;
      final other = Farmer.fromJson({'id': doc.id, ...doc.data()});
      if (checkAadhar) {
        final oa = normalizedAadharDigits(other.aadharNo);
        if (oa.length == 12 && oa == a) return other;
      }
      if (checkMobile) {
        final om = normalizedMobileDigits(other.mobileNo);
        if (RegExp(r'^[6-9]\d{9}$').hasMatch(om) && om == m) return other;
      }
    }
    return null;
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

  DocumentReference<Map<String, Object?>> get _catalogDoc =>
      _db.collection('settings').doc('catalog');

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

  @override
  Stream<List<FertilizerType>> watchFertilizerCatalog() {
    return _catalogDoc.snapshots().map((snap) {
      final data = snap.data();
      if (data == null) return const <FertilizerType>[];
      return FertilizerType.parseCatalogDocument(Map<String, dynamic>.from(data));
    });
  }

  @override
  Stream<List<CropCatalogEntry>> watchCropCatalog() {
    return _catalogDoc.snapshots().map((snap) {
      final data = snap.data();
      if (data == null) return const <CropCatalogEntry>[];
      return CropCatalogEntry.parseCatalogDocument(Map<String, dynamic>.from(data));
    });
  }

  @override
  Stream<List<FertilizerType>> watchCscProductsCatalog() {
    return _catalogDoc.snapshots().map((snap) {
      final data = snap.data();
      if (data == null) return const <FertilizerType>[];
      return FertilizerType.parseCscProductsCatalog(Map<String, dynamic>.from(data));
    });
  }

  @override
  Stream<List<FertilizerType>> watchSeedsCatalog() {
    return _catalogDoc.snapshots().map((snap) {
      final data = snap.data();
      if (data == null) return const <FertilizerType>[];
      return FertilizerType.parseSeedsCatalog(Map<String, dynamic>.from(data));
    });
  }

  @override
  Stream<List<FertilizerType>> watchPesticidesCatalog() {
    return _catalogDoc.snapshots().map((snap) {
      final data = snap.data();
      if (data == null) return const <FertilizerType>[];
      return FertilizerType.parsePesticidesCatalog(Map<String, dynamic>.from(data));
    });
  }
}

