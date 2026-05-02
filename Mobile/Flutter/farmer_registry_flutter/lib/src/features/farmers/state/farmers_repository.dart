import '../../../models/crop_catalog_entry.dart';
import '../../../models/farmer.dart';
import '../../../models/fertilizer_type.dart';

abstract class FarmersRepository {
  Stream<List<Farmer>> watchFarmers();
  Future<Farmer?> getById(String id);

  /// Another farmer using the same Aadhaar (12 digits) or mobile (10 digits), if any.
  /// Pass [excludeFarmerId] when updating an existing document.
  Future<Farmer?> findConflictingFarmer(Farmer farmer, {String? excludeFarmerId});

  Future<void> upsertFarmer(Farmer farmer);
  Future<void> deleteFarmer(String id);
}

abstract class SettingsRepository {
  Stream<String?> watchGoogleSheetLink();
  Future<void> setGoogleSheetLink(String? link);

  /// `settings/catalog` document, `fertilizers` array (id, name, price, unit).
  Stream<List<FertilizerType>> watchFertilizerCatalog();

  /// Same document, `crops` array (id, name).
  Stream<List<CropCatalogEntry>> watchCropCatalog();
}

