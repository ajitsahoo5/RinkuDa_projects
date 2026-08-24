import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/farmer.dart' show Farmer;
import '../../../models/fertilizer_type.dart';
import 'farmers_repository.dart';

const double _kStockEpsilon = 1e-9;

Map<String, double> _sumPositiveAmountsById(List<FertilizerType> lines) {
  final m = <String, double>{};
  for (final l in lines) {
    if (l.amount <= _kStockEpsilon) continue;
    final id = l.id.trim();
    if (id.isEmpty) continue;
    m[id] = (m[id] ?? 0) + l.amount;
  }
  return m;
}

String _catalogRowId(Map<String, dynamic> row) => row['id']?.toString().trim() ?? '';

void _deductStockFromCatalogRows({
  required List<Map<String, dynamic>> rows,
  required Map<String, double> requestedById,
  required String categoryLabel,
}) {
  for (final e in requestedById.entries) {
    final id = e.key;
    final requested = e.value;
    if (requested <= _kStockEpsilon) continue;
    final idx = rows.indexWhere((m) => _catalogRowId(m) == id);
    if (idx < 0) {
      throw InsufficientCatalogStockException(
        'No inventory row with id "$id" under $categoryLabel '
        '(issued ${_formatQty(requested)}). '
        'Ensure settings/catalog lists this product with the same id as in the app.',
      );
    }
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

void _applyDeductionToCatalogField({
  required Map<String, dynamic> catalogData,
  required String arrayKey,
  required List<FertilizerType> farmerLines,
  required String categoryLabel,
}) {
  final requested = _sumPositiveAmountsById(farmerLines);
  if (requested.isEmpty) return;

  final raw = catalogData[arrayKey];
  if (raw is! List) {
    throw InsufficientCatalogStockException(
      'settings/catalog has no valid "$arrayKey" list. '
      'Cannot subtract ${categoryLabel.toLowerCase()} stock for this registration.',
    );
  }
  final rows = <Map<String, dynamic>>[
    for (final item in raw)
      if (item is Map) Map<String, dynamic>.from(item),
  ];
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
  Future<List<Farmer>> fetchFarmers() async {
    final snap = await _farmers.orderBy('slNo', descending: true).get();
    return [
      for (final doc in snap.docs) Farmer.fromJson({'id': doc.id, ...doc.data()}),
    ];
  }

  @override
  Future<int> fetchNextSlNo() async {
    final snap = await _farmers.orderBy('slNo', descending: true).limit(1).get();
    if (snap.docs.isEmpty) return 1;
    final raw = snap.docs.first.data()['slNo'];
    final max = raw is num ? raw.toInt() : int.tryParse('$raw');
    return (max != null && max > 0) ? max + 1 : 1;
  }

  @override
  Future<Farmer?> getById(String id) async {
    final doc = await _farmers.doc(id).get();
    if (!doc.exists) return null;
    return Farmer.fromJson({'id': doc.id, ...?doc.data()});
  }

  @override
  Future<Farmer?> findConflictingFarmer(Farmer farmer, {String? excludeFarmerId}) async {
    throw UnsupportedError(
      'Use findConflictingFarmerInList with the cached farmers stream instead '
      '(avoids reading the entire farmers collection).',
    );
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
  Future<String?> fetchGoogleSheetLink() async {
    final snap = await _doc.get();
    final data = snap.data();
    final v = data?['googleSheetLink'];
    if (v == null) return null;
    return v.toString();
  }

  @override
  Future<void> setGoogleSheetLink(String? link) async {
    await _doc.set(
      {'googleSheetLink': link},
      SetOptions(merge: true),
    );
  }

  @override
  Future<Map<String, dynamic>?> fetchCatalogData() async {
    final snap = await _catalogDoc.get();
    return snap.data();
  }
}

