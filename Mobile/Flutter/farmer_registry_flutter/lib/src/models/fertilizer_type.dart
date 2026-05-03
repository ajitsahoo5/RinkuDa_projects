class FertilizerType {
  const FertilizerType({
    required this.id,
    required this.name,
    required this.amount,
    required this.price,
    this.unit = '',
  });

  final String id;
  final String name;
  final double amount;
  final double price;

  /// Display unit from catalog (e.g. `bag`, `kg`). Empty means treat labels as kg.
  final String unit;

  double get totalCost => amount * price;

  /// Label for amount field, e.g. `Amount (bag)`.
  String get amountFieldLabel {
    final u = unit.trim();
    if (u.isEmpty) return 'Amount (kg)';
    return 'Amount (${u.toLowerCase()})';
  }

  /// Label for price field, e.g. `Price per bag (₹)`.
  String get priceFieldLabel {
    final u = unit.trim();
    if (u.isEmpty) return 'Price per kg (₹)';
    return 'Price per ${u.toLowerCase()} (₹)';
  }

  FertilizerType copyWith({
    String? id,
    String? name,
    double? amount,
    double? price,
    String? unit,
  }) {
    return FertilizerType(
      id: id ?? this.id,
      name: name ?? this.name,
      amount: amount ?? this.amount,
      price: price ?? this.price,
      unit: unit ?? this.unit,
    );
  }

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'name': name,
      'amount': amount,
      'price': price,
      if (unit.isNotEmpty) 'unit': unit,
    };
  }

  factory FertilizerType.fromJson(Map<String, Object?> json) {
    return FertilizerType(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      unit: (json['unit'] ?? '').toString(),
    );
  }

  /// One row from Firestore `settings/catalog` → field `fertilizers` (array).
  factory FertilizerType.fromCatalogEntry(Map<String, dynamic> json) {
    return FertilizerType(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      amount: 0,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      unit: (json['unit'] ?? '').toString(),
    );
  }

  static List<FertilizerType> parseCatalogDocument(Map<String, dynamic>? docData) {
    return _parseNamedCatalogArray(docData, 'fertilizers');
  }

  /// `settings/catalog` → field `cscProducts` (falls back to legacy `otherPecsItems`).
  static List<FertilizerType> parseCscProductsCatalog(Map<String, dynamic>? docData) {
    final primary = _parseNamedCatalogArray(docData, 'cscProducts');
    if (primary.isNotEmpty) return primary;
    return _parseNamedCatalogArray(docData, 'otherPecsItems');
  }

  static List<FertilizerType> parseSeedsCatalog(Map<String, dynamic>? docData) {
    return _parseNamedCatalogArray(docData, 'seeds');
  }

  static List<FertilizerType> parsePesticidesCatalog(Map<String, dynamic>? docData) {
    return _parseNamedCatalogArray(docData, 'pesticides');
  }

  static List<FertilizerType> _parseNamedCatalogArray(
    Map<String, dynamic>? docData,
    String arrayField,
  ) {
    final raw = docData?[arrayField];
    if (raw is! List) return const [];
    final out = <FertilizerType>[];
    for (final item in raw) {
      if (item is! Map) continue;
      final row = FertilizerType.fromCatalogEntry(Map<String, dynamic>.from(item));
      if (row.id.isEmpty || row.name.isEmpty) continue;
      out.add(row);
    }
    return out;
  }
}

bool fertilizerDefinitionsMatch(List<FertilizerType> a, List<FertilizerType> b) {
  if (identical(a, b)) return true;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i].id != b[i].id || a[i].name != b[i].name) return false;
  }
  return true;
}
