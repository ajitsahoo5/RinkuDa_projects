import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/farmer.dart';
import 'farmers_repository.dart';
import 'firestore_repositories.dart';

class FarmerFilter {
  const FarmerFilter({
    this.mouja,
    this.minAcre,
    this.maxAcre,
  });

  final String? mouja;
  final double? minAcre;
  final double? maxAcre;

  FarmerFilter copyWith({
    String? mouja,
    double? minAcre,
    double? maxAcre,
  }) {
    return FarmerFilter(
      mouja: mouja ?? this.mouja,
      minAcre: minAcre ?? this.minAcre,
      maxAcre: maxAcre ?? this.maxAcre,
    );
  }

  bool get isEmpty => (mouja == null || mouja!.trim().isEmpty) && minAcre == null && maxAcre == null;
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
    final moujaOk = (filter.mouja == null || filter.mouja!.trim().isEmpty)
        ? true
        : f.villageOrMouza.toLowerCase() == filter.mouja!.trim().toLowerCase();
    final minOk = filter.minAcre == null ? true : f.area >= filter.minAcre!;
    final maxOk = filter.maxAcre == null ? true : f.area <= filter.maxAcre!;
    return moujaOk && minOk && maxOk;
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

