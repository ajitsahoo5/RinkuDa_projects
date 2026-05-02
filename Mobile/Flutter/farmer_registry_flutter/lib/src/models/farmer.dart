import 'package:uuid/uuid.dart';
import 'fertilizer_type.dart';

const _uuid = Uuid();

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
      fertilizers: fertilizers ?? FertilizerType.getDefaultFertilizers(),
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
      remarks: remarks ?? this.remarks,
    );
  }

  // Helper methods for easier access
  double get totalPrice => fertilizers.fold(0.0, (sum, f) => sum + f.totalCost);

  FertilizerType? getFertilizerById(String id) {
    try {
      return fertilizers.firstWhere((f) => f.id == id);
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
          : FertilizerType.getDefaultFertilizers(),
      remarks: (json['remarks'] ?? '').toString(),
    );
  }
}

