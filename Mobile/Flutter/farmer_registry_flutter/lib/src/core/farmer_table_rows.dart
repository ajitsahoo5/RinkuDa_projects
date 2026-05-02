import '../models/farmer.dart';

String farmerFertilizerSummaryPlain(Farmer f) {
  return f.fertilizers
      .where((x) => x.amount > 0 || x.price > 0)
      .map((x) => '${x.name}: ${x.amount} × ${x.price}')
      .join('; ');
}

/// Same columns as Google Sheet sync (header + sorted rows).
List<List<Object?>> buildFarmerTableRows(List<Farmer> farmers) {
  final sorted = List<Farmer>.from(farmers)..sort((a, b) => a.slNo.compareTo(b.slNo));
  const header = <Object?>[
    'SL No',
    'Date of Purchase',
    'Land Owner',
    'Village/Mouza',
    'Khata No',
    'Area',
    'Farmer Name',
    'Aadhaar',
    'Mobile',
    'Crops',
    'Total Price (₹)',
    'Remarks',
    'Fertilizers',
    'Firestore ID',
    'Synced at (UTC)',
  ];
  final now = DateTime.now().toUtc().toIso8601String();
  return [
    header,
    for (final f in sorted)
      <Object?>[
        f.slNo,
        f.dateOfPurchase.toIso8601String().split('T').first,
        f.landOwnerName,
        f.villageOrMouza,
        f.khataNo,
        f.area,
        f.farmerName,
        f.aadharNo,
        f.mobileNo,
        f.cropsName,
        f.totalPrice,
        f.remarks,
        farmerFertilizerSummaryPlain(f),
        f.id,
        now,
      ],
  ];
}
