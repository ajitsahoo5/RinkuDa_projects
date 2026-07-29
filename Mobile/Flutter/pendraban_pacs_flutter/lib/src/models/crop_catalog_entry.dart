/// One row from Firestore `settings/catalog` → field `crops` (array: id, name).
class CropCatalogEntry {
  const CropCatalogEntry({required this.id, required this.name});

  final String id;
  final String name;

  factory CropCatalogEntry.fromCatalogEntry(Map<String, dynamic> json) {
    return CropCatalogEntry(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
    );
  }

  static List<CropCatalogEntry> parseCatalogDocument(Map<String, dynamic>? docData) {
    final raw = docData?['crops'];
    if (raw is! List) return const [];
    final out = <CropCatalogEntry>[];
    for (final item in raw) {
      if (item is! Map) continue;
      final row = CropCatalogEntry.fromCatalogEntry(Map<String, dynamic>.from(item));
      if (row.id.isEmpty || row.name.isEmpty) continue;
      out.add(row);
    }
    return out;
  }
}

bool cropCatalogMatches(List<CropCatalogEntry> a, List<CropCatalogEntry> b) {
  if (identical(a, b)) return true;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i].id != b[i].id || a[i].name != b[i].name) return false;
  }
  return true;
}
