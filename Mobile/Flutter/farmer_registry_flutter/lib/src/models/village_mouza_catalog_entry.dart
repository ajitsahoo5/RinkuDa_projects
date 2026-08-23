/// Dropdown sentinel when the village/mouza is not in the admin catalog (matches web `__other__`).
const kVillageMouzaOtherDropdownId = '__other__';

/// One row from Firestore `settings/catalog` → field `villageMouzas` (array: id, name).
class VillageMouzaCatalogEntry {
  const VillageMouzaCatalogEntry({required this.id, required this.name});

  final String id;
  final String name;

  factory VillageMouzaCatalogEntry.fromCatalogEntry(Map<String, dynamic> json) {
    return VillageMouzaCatalogEntry(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
    );
  }

  static List<VillageMouzaCatalogEntry> parseCatalogDocument(Map<String, dynamic>? docData) {
    final raw = docData?['villageMouzas'];
    if (raw is! List) return const [];
    final out = <VillageMouzaCatalogEntry>[];
    for (final item in raw) {
      if (item is! Map) continue;
      final row = VillageMouzaCatalogEntry.fromCatalogEntry(Map<String, dynamic>.from(item));
      if (row.id.isEmpty || row.name.isEmpty) continue;
      out.add(row);
    }
    out.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    return out;
  }
}

bool villageMouzaCatalogMatches(List<VillageMouzaCatalogEntry> a, List<VillageMouzaCatalogEntry> b) {
  if (identical(a, b)) return true;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i].id != b[i].id || a[i].name != b[i].name) return false;
  }
  return true;
}
