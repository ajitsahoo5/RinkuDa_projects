class FertilizerType {
  const FertilizerType({
    required this.id,
    required this.name,
    required this.amount,
    required this.price,
    this.unit = '',
    /// Catalog only: available quantity. Missing or `null` in Firestore is treated as **0**.
    this.stock,
  });

  final String id;
  final String name;
  final double amount;
  final double price;

  /// Display unit from catalog (e.g. `bag`, `kg`). Empty means treat labels as kg.
  final String unit;

  /// Catalog inventory (Firestore `stock`). Not stored on farmer line items.
  final double? stock;

  double get totalCost => amount * price;

  /// Available quantity for UI and limits; missing [stock] is **0**.
  double get effectiveCatalogStock => stock ?? 0.0;

  /// Short inventory text for lists and dropdowns (no value or ≤0 → **0**).
  String get catalogStockLabel {
    final s = effectiveCatalogStock;
    final u = unit.trim();
    if (s <= 0) {
      return u.isEmpty ? '0' : '0 $u';
    }
    final qty = s == s.roundToDouble() ? s.round().toString() : s.toStringAsFixed(2);
    return u.isEmpty ? '$qty in stock' : '$qty $u';
  }

  /// Picker row: product name plus [catalogStockLabel].
  String get choiceLabelWithStock => '${name.trim()} · $catalogStockLabel';

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
    double? stock,
  }) {
    return FertilizerType(
      id: id ?? this.id,
      name: name ?? this.name,
      amount: amount ?? this.amount,
      price: price ?? this.price,
      unit: unit ?? this.unit,
      stock: stock ?? this.stock,
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
      stock: (json['stock'] as num?)?.toDouble(),
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
      stock: (json['stock'] as num?)?.toDouble(),
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
    if ((a[i].effectiveCatalogStock - b[i].effectiveCatalogStock).abs() > 1e-9) return false;
  }
  return true;
}
