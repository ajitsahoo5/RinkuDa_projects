import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/crop_catalog_entry.dart';
import '../../../models/farmer.dart' show Farmer, normalizedAadharDigits, normalizedMobileDigits;
import '../../../models/fertilizer_type.dart';
import 'farmers_repository.dart';

const double _kStockEpsilon = 1e-9;

Map<String, double> _sumPositiveAmountsById(List<FertilizerType> lines) {
  final m = <String, double>{};
  for (final l in lines) {
    if (l.amount <= _kStockEpsilon) continue;
    m[l.id] = (m[l.id] ?? 0) + l.amount;
  }
  return m;
}

void _deductStockFromCatalogRows({
  required List<Map<String, dynamic>> rows,
  required Map<String, double> requestedById,
  required String categoryLabel,
}) {
  for (final e in requestedById.entries) {
    final id = e.key;
    final requested = e.value;
    if (requested <= _kStockEpsilon) continue;
    final idx = rows.indexWhere((m) => m['id']?.toString() == id);
    if (idx < 0) continue;
    final row = Map<String, dynamic>.from(rows[idx]);
    final rawStock = row['stock'];
    final stock = rawStock == null ? 0.0 : (rawStock as num).toDouble();
    if (requested > stock + _kStockEpsilon) {
      final name = row['name']?.toString() ?? id;
      throw InsufficientCatalogStockException(
        'Not enough stock for $categoryLabel "$name" '
        '(requested ${_formatQty(requested)}, available ${_formatQty(stock)}).',
      );
    }
    row['stock'] = stock - requested;
    rows[idx] = row;
  }
}

String _formatQty(double v) {
  if (v == v.roundToDouble()) return v.round().toString();
  return v.toStringAsFixed(2);
}

/// `remarkPresets` may be plain strings or objects like `{ "name": "Loan" }`.
/// Returns only the display name, never a JSON/map string.
String? _parseRemarkPresetItem(dynamic e) {
  if (e == null) return null;
  if (e is String) {
    final s = e.trim();
    return s.isEmpty ? null : s;
  }
  if (e is Map) {
    final m = Map<String, dynamic>.from(e);
    for (final key in ['name', 'label', 'title']) {
      final v = m[key];
      if (v is String) {
        final s = v.trim();
        if (s.isNotEmpty) return s;
      }
    }
    return null;
  }
  return null;
}

void _applyDeductionToCatalogField({
  required Map<String, dynamic> catalogData,
  required String arrayKey,
  required List<FertilizerType> farmerLines,
  required String categoryLabel,
}) {
  final raw = catalogData[arrayKey];
  if (raw is! List) return;
  final rows = <Map<String, dynamic>>[
    for (final item in raw)
      if (item is Map) Map<String, dynamic>.from(item),
  ];
  final requested = _sumPositiveAmountsById(farmerLines);
  _deductStockFromCatalogRows(
    rows: rows,
    requestedById: requested,
    categoryLabel: categoryLabel,
  );
  catalogData[arrayKey] = rows;
}

String _cscCatalogArrayKey(Map<String, dynamic> catalogData) {
  if (catalogData['cscProducts'] is List) return 'cscProducts';
  if (catalogData['otherPecsItems'] is List) return 'otherPecsItems';
  return 'cscProducts';
}

class FirestoreFarmersRepository implements FarmersRepository {
  FirestoreFarmersRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  CollectionReference<Map<String, Object?>> get _farmers =>
      _db.collection('farmers');

  DocumentReference<Map<String, Object?>> get _catalogDoc =>
      _db.collection('settings').doc('catalog');

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
  Future<void> registerFarmerWithStockDeduction(Farmer farmer) async {
    await _db.runTransaction((transaction) async {
      final catalogSnap = await transaction.get(_catalogDoc);
      if (!catalogSnap.exists || catalogSnap.data() == null) {
        throw InsufficientCatalogStockException(
          'Inventory catalog is missing (settings/catalog).',
        );
      }
      final catalogData = Map<String, dynamic>.from(catalogSnap.data()!);

      _applyDeductionToCatalogField(
        catalogData: catalogData,
        arrayKey: 'fertilizers',
        farmerLines: farmer.fertilizers,
        categoryLabel: 'Fertilizer',
      );
      _applyDeductionToCatalogField(
        catalogData: catalogData,
        arrayKey: _cscCatalogArrayKey(catalogData),
        farmerLines: farmer.cscProducts,
        categoryLabel: 'CSC product',
      );
      _applyDeductionToCatalogField(
        catalogData: catalogData,
        arrayKey: 'seeds',
        farmerLines: farmer.seeds,
        categoryLabel: 'Seed',
      );
      _applyDeductionToCatalogField(
        catalogData: catalogData,
        arrayKey: 'pesticides',
        farmerLines: farmer.pesticides,
        categoryLabel: 'Pesticide',
      );

      transaction.set(_catalogDoc, catalogData, SetOptions(merge: true));
      transaction.set(
        _farmers.doc(farmer.id),
        farmer.toJson()..remove('id'),
        SetOptions(merge: true),
      );
    });
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

  @override
  Stream<List<String>> watchRemarkOptions() {
    return _catalogDoc.snapshots().map((snap) {
      final data = snap.data();
      if (data == null) return const <String>[];
      final raw = data['remarkPresets'];
      if (raw is! List) return const <String>[];
      final out = <String>[];
      for (final e in raw) {
        final s = _parseRemarkPresetItem(e);
        if (s != null && s.isNotEmpty) out.add(s);
      }
      return out;
    });
  }
}

