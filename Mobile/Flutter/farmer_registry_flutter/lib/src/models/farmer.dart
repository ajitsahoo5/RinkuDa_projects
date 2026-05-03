import 'package:uuid/uuid.dart';
import 'fertilizer_type.dart';

const _uuid = Uuid();

/// Digits only — for comparing Aadhaar across different formatting.
String normalizedAadharDigits(String raw) =>
    raw.replaceAll(RegExp(r'\D'), '');

/// Digits only — for comparing mobile numbers across different formatting.
String normalizedMobileDigits(String raw) =>
    raw.replaceAll(RegExp(r'\D'), '');

/// Reads CSC Products from Firestore: prefers `cscProducts`, falls back to legacy `otherPecsItems`.
List<FertilizerType> _cscProductsFromFarmerJson(Map<String, Object?> json) {
  final primary = json['cscProducts'];
  if (primary is List && primary.isNotEmpty) {
    return primary
        .map((f) => FertilizerType.fromJson(f as Map<String, Object?>))
        .toList();
  }
  final legacy = json['otherPecsItems'];
  if (legacy is List && legacy.isNotEmpty) {
    return legacy
        .map((f) => FertilizerType.fromJson(f as Map<String, Object?>))
        .toList();
  }
  return const [];
}

class Farmer {
  const Farmer({
    required this.id,
    required this.slNo,
    required this.dateOfPurchase,
    required this.landOwnerName,
    required this.villageOrMouza,
    required this.khataNo,
    required this.area,
    required this.farmerName,
    required this.aadharNo,
    required this.mobileNo,
    required this.cropsName,
    required this.fertilizers,
    this.cscProducts = const [],
    this.seeds = const [],
    this.pesticides = const [],
    this.remarks = '',
  });

  factory Farmer.create({
    required int slNo,
    required DateTime dateOfPurchase,
    required String landOwnerName,
    required String villageOrMouza,
    required String khataNo,
    required double area,
    required String farmerName,
    required String aadharNo,
    required String mobileNo,
    required String cropsName,
    List<FertilizerType>? fertilizers,
    List<FertilizerType>? cscProducts,
    List<FertilizerType>? seeds,
    List<FertilizerType>? pesticides,
    String? remarks,
  }) {
    return Farmer(
      id: _uuid.v4(),
      slNo: slNo,
      dateOfPurchase: dateOfPurchase,
      landOwnerName: landOwnerName,
      villageOrMouza: villageOrMouza,
      khataNo: khataNo,
      area: area,
      farmerName: farmerName,
      aadharNo: aadharNo,
      mobileNo: mobileNo,
      cropsName: cropsName,
      fertilizers: fertilizers ?? const [],
      cscProducts: cscProducts ?? const [],
      seeds: seeds ?? const [],
      pesticides: pesticides ?? const [],
      remarks: remarks ?? '',
    );
  }

  final String id;
  final int slNo;
  final DateTime dateOfPurchase;
  final String landOwnerName;
  final String villageOrMouza;
  final String khataNo;
  final double area;
  final String farmerName;
  final String aadharNo;
  final String mobileNo;
  final String cropsName;
  // All fertilizer types
  final List<FertilizerType> fertilizers;
  /// CSC Products (`settings/catalog` → `cscProducts`; legacy field `otherPecsItems`).
  final List<FertilizerType> cscProducts;
  /// Seed products (`settings/catalog` → `seeds`).
  final List<FertilizerType> seeds;
  /// Pesticide products (`settings/catalog` → `pesticides`).
  final List<FertilizerType> pesticides;
  final String remarks;

  Farmer copyWith({
    String? id,
    int? slNo,
    DateTime? dateOfPurchase,
    String? landOwnerName,
    String? villageOrMouza,
    String? khataNo,
    double? area,
    String? farmerName,
    String? aadharNo,
    String? mobileNo,
    String? cropsName,
    List<FertilizerType>? fertilizers,
    List<FertilizerType>? cscProducts,
    List<FertilizerType>? seeds,
    List<FertilizerType>? pesticides,
    String? remarks,
  }) {
    return Farmer(
      id: id ?? this.id,
      slNo: slNo ?? this.slNo,
      dateOfPurchase: dateOfPurchase ?? this.dateOfPurchase,
      landOwnerName: landOwnerName ?? this.landOwnerName,
      villageOrMouza: villageOrMouza ?? this.villageOrMouza,
      khataNo: khataNo ?? this.khataNo,
      area: area ?? this.area,
      farmerName: farmerName ?? this.farmerName,
      aadharNo: aadharNo ?? this.aadharNo,
      mobileNo: mobileNo ?? this.mobileNo,
      cropsName: cropsName ?? this.cropsName,
      fertilizers: fertilizers ?? this.fertilizers,
      cscProducts: cscProducts ?? this.cscProducts,
      seeds: seeds ?? this.seeds,
      pesticides: pesticides ?? this.pesticides,
      remarks: remarks ?? this.remarks,
    );
  }

  // Helper methods for easier access
  double get totalPrice =>
      fertilizers.fold(0.0, (sum, f) => sum + f.totalCost) +
      cscProducts.fold(0.0, (sum, f) => sum + f.totalCost) +
      seeds.fold(0.0, (sum, f) => sum + f.totalCost) +
      pesticides.fold(0.0, (sum, f) => sum + f.totalCost);

  FertilizerType? getFertilizerById(String id) {
    try {
      return fertilizers.firstWhere((f) => f.id == id);
    } catch (e) {
      return null;
    }
  }

  FertilizerType? getCscProductById(String id) {
    try {
      return cscProducts.firstWhere((f) => f.id == id);
    } catch (e) {
      return null;
    }
  }

  FertilizerType? getSeedById(String id) {
    try {
      return seeds.firstWhere((f) => f.id == id);
    } catch (e) {
      return null;
    }
  }

  FertilizerType? getPesticideById(String id) {
    try {
      return pesticides.firstWhere((f) => f.id == id);
    } catch (e) {
      return null;
    }
  }

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'slNo': slNo,
      'dateOfPurchase': dateOfPurchase.toIso8601String(),
      'landOwnerName': landOwnerName,
      'villageOrMouza': villageOrMouza,
      'khataNo': khataNo,
      'area': area,
      'farmerName': farmerName,
      'aadharNo': aadharNo,
      'mobileNo': mobileNo,
      'cropsName': cropsName,
      'fertilizers': fertilizers.map((f) => f.toJson()).toList(),
      'cscProducts': cscProducts.map((f) => f.toJson()).toList(),
      'seeds': seeds.map((f) => f.toJson()).toList(),
      'pesticides': pesticides.map((f) => f.toJson()).toList(),
      'remarks': remarks,
    };
  }

  factory Farmer.fromJson(Map<String, Object?> json) {
    return Farmer(
      id: (json['id'] ?? '').toString(),
      slNo: (json['slNo'] as num?)?.toInt() ?? 0,
      dateOfPurchase: json['dateOfPurchase'] != null 
          ? DateTime.parse(json['dateOfPurchase'].toString())
          : DateTime.now(),
      landOwnerName: (json['landOwnerName'] ?? '').toString(),
      villageOrMouza: (json['villageOrMouza'] ?? '').toString(),
      khataNo: (json['khataNo'] ?? '').toString(),
      area: (json['area'] as num?)?.toDouble() ?? 0.0,
      farmerName: (json['farmerName'] ?? '').toString(),
      aadharNo: (json['aadharNo'] ?? '').toString(),
      mobileNo: (json['mobileNo'] ?? '').toString(),
      cropsName: (json['cropsName'] ?? '').toString(),
      fertilizers: json['fertilizers'] != null
          ? (json['fertilizers'] as List).map((f) => FertilizerType.fromJson(f as Map<String, Object?>)).toList()
          : const [],
      cscProducts: _cscProductsFromFarmerJson(json),
      seeds: json['seeds'] != null
          ? (json['seeds'] as List).map((f) => FertilizerType.fromJson(f as Map<String, Object?>)).toList()
          : const [],
      pesticides: json['pesticides'] != null
          ? (json['pesticides'] as List).map((f) => FertilizerType.fromJson(f as Map<String, Object?>)).toList()
          : const [],
      remarks: (json['remarks'] ?? '').toString(),
    );
  }
}

