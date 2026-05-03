import '../../../models/crop_catalog_entry.dart';
import '../../../models/farmer.dart';
import '../../../models/fertilizer_type.dart';

/// Thrown when `settings/catalog` does not have enough [stock] for a registration.
class InsufficientCatalogStockException implements Exception {
  InsufficientCatalogStockException(this.message);
  final String message;
  @override
  String toString() => message;
}

abstract class FarmersRepository {
  Stream<List<Farmer>> watchFarmers();
  Future<Farmer?> getById(String id);

  /// Another farmer using the same Aadhaar (12 digits) or mobile (10 digits), if any.
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
  Stream<String?> watchGoogleSheetLink();
  Future<void> setGoogleSheetLink(String? link);

  /// `settings/catalog` document, `fertilizers` array (id, name, price, unit).
  Stream<List<FertilizerType>> watchFertilizerCatalog();

  /// Same document, `crops` array (id, name).
  Stream<List<CropCatalogEntry>> watchCropCatalog();

  /// Same document, `cscProducts` array (legacy `otherPecsItems` supported when reading).
  Stream<List<FertilizerType>> watchCscProductsCatalog();

  /// Same document, `seeds` array.
  Stream<List<FertilizerType>> watchSeedsCatalog();

  /// Same document, `pesticides` array.
  Stream<List<FertilizerType>> watchPesticidesCatalog();

  /// `settings/catalog` → `remarkPresets` (array of strings for remarks dropdown).
  Stream<List<String>> watchRemarkOptions();
}

