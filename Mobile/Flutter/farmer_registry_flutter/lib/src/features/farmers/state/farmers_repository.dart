import '../../../models/farmer.dart';

/// Thrown when `settings/catalog` does not have enough [stock] for a registration.
class InsufficientCatalogStockException implements Exception {
  InsufficientCatalogStockException(this.message);
  final String message;
  @override
  String toString() => message;
}

abstract class FarmersRepository {
  /// One-time read of all farmers (no live listener).
  Future<List<Farmer>> fetchFarmers();

  /// Reads at most one document for the next serial number.
  Future<int> fetchNextSlNo();

  Future<Farmer?> getById(String id);

  /// Another farmer using the same Aadhaar (12 digits), mobile (10 digits),
  /// or Khata No + Mouza combination, if any.
  /// Pass [excludeFarmerId] when updating an existing document.
  Future<Farmer?> findConflictingFarmer(Farmer farmer, {String? excludeFarmerId});

  Future<void> upsertFarmer(Farmer farmer);
  Future<void> deleteFarmer(String id);

  /// Saves the farmer and subtracts issued quantities from catalog `stock` fields
  /// (`settings/catalog`) in one transaction. Each purchased catalog id must exist on the
  /// matching array (`fertilizers`, `cscProducts`/`otherPecsItems`, `seeds`, `pesticides`);
  /// missing or null `stock` on a row is treated as **0** units available.
  Future<void> registerFarmerWithStockDeduction(Farmer farmer);
}

abstract class SettingsRepository {
  Future<String?> fetchGoogleSheetLink();
  Future<void> setGoogleSheetLink(String? link);

  /// Single-document read of `settings/catalog`.
  Future<Map<String, dynamic>?> fetchCatalogData();
}
