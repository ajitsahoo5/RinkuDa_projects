import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/crop_catalog_entry.dart';
import '../../../models/village_mouza_catalog_entry.dart';
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

List<String> remarkOptionsFromCatalog(Map<String, dynamic>? data) {
  if (data == null) return const <String>[];
  final raw = data['remarkPresets'];
  if (raw is! List) return const <String>[];
  final out = <String>[];
  for (final e in raw) {
    final s = _parseRemarkPresetItem(e);
    if (s != null && s.isNotEmpty) out.add(s);
  }
  return out;
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

class FarmersListNotifier extends AsyncNotifier<List<Farmer>> {
  @override
  Future<List<Farmer>> build() {
    return ref.read(farmersRepositoryProvider).fetchFarmers();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(farmersRepositoryProvider).fetchFarmers(),
    );
  }
}

/// Cached farmer list — fetched once per session; call [FarmersListNotifier.refresh] to reload.
final farmersListProvider = AsyncNotifierProvider<FarmersListNotifier, List<Farmer>>(
  FarmersListNotifier.new,
);

class CatalogDataNotifier extends AsyncNotifier<Map<String, dynamic>?> {
  @override
  Future<Map<String, dynamic>?> build() {
    return ref.read(settingsRepositoryProvider).fetchCatalogData();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(settingsRepositoryProvider).fetchCatalogData(),
    );
  }
}

final catalogDataProvider = AsyncNotifierProvider<CatalogDataNotifier, Map<String, dynamic>?>(
  CatalogDataNotifier.new,
);

class GoogleSheetLinkFetchNotifier extends AsyncNotifier<String?> {
  @override
  Future<String?> build() {
    return ref.read(settingsRepositoryProvider).fetchGoogleSheetLink();
  }
}

final googleSheetLinkFetchProvider = AsyncNotifierProvider<GoogleSheetLinkFetchNotifier, String?>(
  GoogleSheetLinkFetchNotifier.new,
);

class NextSlNumberNotifier extends AsyncNotifier<int> {
  @override
  Future<int> build() {
    return ref.read(farmersRepositoryProvider).fetchNextSlNo();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(farmersRepositoryProvider).fetchNextSlNo(),
    );
  }
}

final nextSlNumberProvider = AsyncNotifierProvider<NextSlNumberNotifier, int>(
  NextSlNumberNotifier.new,
);

final farmerByIdProvider = FutureProvider.autoDispose.family<Farmer?, String>((ref, id) {
  return ref.read(farmersRepositoryProvider).getById(id);
});

AsyncValue<T> _mapCatalog<T>(AsyncValue<Map<String, dynamic>?> catalog, T Function(Map<String, dynamic>?) map) {
  return catalog.when(
    data: (d) => AsyncValue.data(map(d)),
    loading: () => const AsyncValue.loading(),
    error: AsyncValue.error,
  );
}

final fertilizerCatalogProvider = Provider<AsyncValue<List<FertilizerType>>>((ref) {
  return _mapCatalog(ref.watch(catalogDataProvider), (data) {
    if (data == null) return const <FertilizerType>[];
    return FertilizerType.parseCatalogDocument(Map<String, dynamic>.from(data));
  });
});

final cropCatalogProvider = Provider<AsyncValue<List<CropCatalogEntry>>>((ref) {
  return _mapCatalog(ref.watch(catalogDataProvider), (data) {
    if (data == null) return const <CropCatalogEntry>[];
    return CropCatalogEntry.parseCatalogDocument(Map<String, dynamic>.from(data));
  });
});

final villageMouzaCatalogProvider = Provider<AsyncValue<List<VillageMouzaCatalogEntry>>>((ref) {
  return _mapCatalog(ref.watch(catalogDataProvider), (data) {
    if (data == null) return const <VillageMouzaCatalogEntry>[];
    return VillageMouzaCatalogEntry.parseCatalogDocument(Map<String, dynamic>.from(data));
  });
});

final cscProductsCatalogProvider = Provider<AsyncValue<List<FertilizerType>>>((ref) {
  return _mapCatalog(ref.watch(catalogDataProvider), (data) {
    if (data == null) return const <FertilizerType>[];
    return FertilizerType.parseCscProductsCatalog(Map<String, dynamic>.from(data));
  });
});

final seedsCatalogProvider = Provider<AsyncValue<List<FertilizerType>>>((ref) {
  return _mapCatalog(ref.watch(catalogDataProvider), (data) {
    if (data == null) return const <FertilizerType>[];
    return FertilizerType.parseSeedsCatalog(Map<String, dynamic>.from(data));
  });
});

final pesticidesCatalogProvider = Provider<AsyncValue<List<FertilizerType>>>((ref) {
  return _mapCatalog(ref.watch(catalogDataProvider), (data) {
    if (data == null) return const <FertilizerType>[];
    return FertilizerType.parsePesticidesCatalog(Map<String, dynamic>.from(data));
  });
});

final remarkOptionsCatalogProvider = Provider<AsyncValue<List<String>>>((ref) {
  return _mapCatalog(ref.watch(catalogDataProvider), remarkOptionsFromCatalog);
});

final filteredFarmersProvider = Provider<List<Farmer>>((ref) {
  final all = ref.watch(farmersListProvider).value ?? const <Farmer>[];
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

/// Re-fetch farmers and catalog after a registration (stock + list change).
Future<void> refreshFarmersAndCatalog(WidgetRef ref) async {
  await Future.wait([
    ref.read(farmersListProvider.notifier).refresh(),
    ref.read(catalogDataProvider.notifier).refresh(),
    ref.read(nextSlNumberProvider.notifier).refresh(),
  ]);
}
