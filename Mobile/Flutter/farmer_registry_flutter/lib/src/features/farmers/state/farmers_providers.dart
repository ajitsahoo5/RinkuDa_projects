import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/crop_catalog_entry.dart';
import '../../../models/farmer.dart';
import '../../../models/fertilizer_type.dart';
import 'farmers_repository.dart';
import 'firestore_repositories.dart';

/// Firestore catalog rows first; keeps legacy fertilizer rows on [farmer] that are not in the catalog.
List<FertilizerType> mergeCatalogWithFarmerRows(List<FertilizerType> catalog, Farmer? farmer) {
  if (farmer == null) return catalog;
  final ids = catalog.map((e) => e.id).toSet();
  final extras = <FertilizerType>[
    for (final f in farmer.fertilizers)
      if (!ids.contains(f.id)) f,
  ];
  return [...catalog, ...extras];
}

/// Same as [mergeCatalogWithFarmerRows] for CSC Products (`cscProducts` on the farmer document).
List<FertilizerType> mergeCscProductsCatalogWithFarmerRows(List<FertilizerType> catalog, Farmer? farmer) {
  if (farmer == null) return catalog;
  final ids = catalog.map((e) => e.id).toSet();
  final extras = <FertilizerType>[
    for (final f in farmer.cscProducts)
      if (!ids.contains(f.id)) f,
  ];
  return [...catalog, ...extras];
}

List<FertilizerType> mergeSeedsCatalogWithFarmerRows(List<FertilizerType> catalog, Farmer? farmer) {
  if (farmer == null) return catalog;
  final ids = catalog.map((e) => e.id).toSet();
  final extras = <FertilizerType>[
    for (final f in farmer.seeds)
      if (!ids.contains(f.id)) f,
  ];
  return [...catalog, ...extras];
}

List<FertilizerType> mergePesticidesCatalogWithFarmerRows(List<FertilizerType> catalog, Farmer? farmer) {
  if (farmer == null) return catalog;
  final ids = catalog.map((e) => e.id).toSet();
  final extras = <FertilizerType>[
    for (final f in farmer.pesticides)
      if (!ids.contains(f.id)) f,
  ];
  return [...catalog, ...extras];
}

DateTime _calendarDateLocal(DateTime d) {
  final l = d.toLocal();
  return DateTime(l.year, l.month, l.day);
}

class FarmerFilter {
  const FarmerFilter({
    this.purchaseDateFrom,
    this.purchaseDateTo,
  });

  /// Inclusive lower bound (calendar day, local). Null = no lower bound.
  final DateTime? purchaseDateFrom;
  /// Inclusive upper bound (calendar day, local). Null = no upper bound.
  final DateTime? purchaseDateTo;

  FarmerFilter copyWith({
    DateTime? purchaseDateFrom,
    DateTime? purchaseDateTo,
  }) {
    return FarmerFilter(
      purchaseDateFrom: purchaseDateFrom ?? this.purchaseDateFrom,
      purchaseDateTo: purchaseDateTo ?? this.purchaseDateTo,
    );
  }

  bool get isEmpty => purchaseDateFrom == null && purchaseDateTo == null;
}

class FarmerSearchQueryController extends Notifier<String> {
  @override
  String build() => '';

  void set(String v) => state = v;
  void clear() => state = '';
}

final farmerSearchQueryProvider =
    NotifierProvider<FarmerSearchQueryController, String>(FarmerSearchQueryController.new);

class FarmerFilterController extends Notifier<FarmerFilter> {
  @override
  FarmerFilter build() => const FarmerFilter();

  void set(FarmerFilter f) => state = f;
  void clear() => state = const FarmerFilter();
}

final farmerFilterProvider = NotifierProvider<FarmerFilterController, FarmerFilter>(FarmerFilterController.new);

class GoogleSheetLinkController extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String? link) => state = link;
}

final googleSheetLinkProvider =
    NotifierProvider<GoogleSheetLinkController, String?>(GoogleSheetLinkController.new);

final farmersRepositoryProvider = Provider<FarmersRepository>((ref) {
  return FirestoreFarmersRepository();
});

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return FirestoreSettingsRepository();
});

final farmersStreamProvider = StreamProvider<List<Farmer>>((ref) {
  return ref.watch(farmersRepositoryProvider).watchFarmers();
});

final googleSheetLinkStreamProvider = StreamProvider<String?>((ref) {
  return ref.watch(settingsRepositoryProvider).watchGoogleSheetLink();
});

final fertilizerCatalogProvider = StreamProvider<List<FertilizerType>>((ref) {
  return ref.watch(settingsRepositoryProvider).watchFertilizerCatalog();
});

final cropCatalogProvider = StreamProvider<List<CropCatalogEntry>>((ref) {
  return ref.watch(settingsRepositoryProvider).watchCropCatalog();
});

final cscProductsCatalogProvider = StreamProvider<List<FertilizerType>>((ref) {
  return ref.watch(settingsRepositoryProvider).watchCscProductsCatalog();
});

final seedsCatalogProvider = StreamProvider<List<FertilizerType>>((ref) {
  return ref.watch(settingsRepositoryProvider).watchSeedsCatalog();
});

final pesticidesCatalogProvider = StreamProvider<List<FertilizerType>>((ref) {
  return ref.watch(settingsRepositoryProvider).watchPesticidesCatalog();
});

/// `settings/catalog` → `remarkPresets` (strings). Empty stream slice falls back in [FarmerForm].
final remarkOptionsCatalogProvider = StreamProvider<List<String>>((ref) {
  return ref.watch(settingsRepositoryProvider).watchRemarkOptions();
});

final filteredFarmersProvider = Provider<List<Farmer>>((ref) {
  final all = ref.watch(farmersStreamProvider).value ?? const <Farmer>[];
  final q = ref.watch(farmerSearchQueryProvider).trim().toLowerCase();
  final filter = ref.watch(farmerFilterProvider);

  bool matchesQuery(Farmer f) {
    if (q.isEmpty) return true;
    return f.farmerName.toLowerCase().contains(q) ||
        f.landOwnerName.toLowerCase().contains(q) ||
        f.aadharNo.toLowerCase().contains(q) ||
        f.khataNo.toLowerCase().contains(q) ||
        f.villageOrMouza.toLowerCase().contains(q) ||
        f.mobileNo.toLowerCase().contains(q) ||
        f.cropsName.toLowerCase().contains(q);
  }

  bool matchesFilter(Farmer f) {
    if (filter.isEmpty) return true;
    final d = _calendarDateLocal(f.dateOfPurchase);
    if (filter.purchaseDateFrom != null) {
      final from = _calendarDateLocal(filter.purchaseDateFrom!);
      if (d.isBefore(from)) return false;
    }
    if (filter.purchaseDateTo != null) {
      final to = _calendarDateLocal(filter.purchaseDateTo!);
      if (d.isAfter(to)) return false;
    }
    return true;
  }

  return [
    for (final f in all)
      if (matchesQuery(f) && matchesFilter(f)) f,
  ];
});

final nextSlNumberProvider = Provider<int>((ref) {
  final farmers = ref.watch(farmersStreamProvider).value ?? const <Farmer>[];
  if (farmers.isEmpty) return 1;
  
  final maxSlNo = farmers.map((f) => f.slNo).reduce((a, b) => a > b ? a : b);
  return maxSlNo + 1;
});

