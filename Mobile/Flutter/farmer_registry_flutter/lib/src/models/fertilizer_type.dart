class FertilizerType {
  const FertilizerType({
    required this.id,
    required this.name,
    required this.amount,
    required this.price,
  });

  final String id;
  final String name;
  final double amount;
  final double price;

  double get totalCost => amount * price;

  FertilizerType copyWith({
    String? id,
    String? name,
    double? amount,
    double? price,
  }) {
    return FertilizerType(
      id: id ?? this.id,
      name: name ?? this.name,
      amount: amount ?? this.amount,
      price: price ?? this.price,
    );
  }

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'name': name,
      'amount': amount,
      'price': price,
    };
  }

  factory FertilizerType.fromJson(Map<String, Object?> json) {
    return FertilizerType(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
    );
  }

  static List<FertilizerType> getDefaultFertilizers() {
    return [
      const FertilizerType(id: 'dap_1846', name: 'DAP 1846', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'dap_20_20', name: 'DAP 20-20', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'urea', name: 'Urea', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'mop', name: 'Mop', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'nano_urea', name: 'Nano Urea', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'nano_dap', name: 'Nano DAP', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'nayantara', name: 'Nayantara', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'balti', name: 'Balti', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'fatera', name: 'Fatera', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'sagarika', name: 'Sagarika', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'apozyme', name: 'Apozyme', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'vagami', name: 'Vagami', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'lexa', name: 'Lexa', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'griffine', name: 'Griffine', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'zinc', name: 'ZINC', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'hifazat', name: 'Hifazat', amount: 0.0, price: 0.0),
      const FertilizerType(id: 'heranba', name: 'HERANBA', amount: 0.0, price: 0.0),
    ];
  }
}