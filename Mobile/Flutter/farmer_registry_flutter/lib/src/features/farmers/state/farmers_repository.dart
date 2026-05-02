import '../../../models/farmer.dart';

abstract class FarmersRepository {
  Stream<List<Farmer>> watchFarmers();
  Future<Farmer?> getById(String id);
  Future<void> upsertFarmer(Farmer farmer);
  Future<void> deleteFarmer(String id);
}

abstract class SettingsRepository {
  Stream<String?> watchGoogleSheetLink();
  Future<void> setGoogleSheetLink(String? link);
}

