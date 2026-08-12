import 'package:pendraban_pacs_flutter/src/core/farmer_duplicates.dart';
import 'package:pendraban_pacs_flutter/src/models/farmer.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Farmer sample({
    required String id,
    required String khataNo,
    required String villageOrMouza,
    String farmerName = 'Test Farmer',
    int slNo = 1,
  }) {
    return Farmer(
      id: id,
      slNo: slNo,
      dateOfPurchase: DateTime(2024),
      landOwnerName: 'Owner',
      villageOrMouza: villageOrMouza,
      khataNo: khataNo,
      area: 1,
      farmerName: farmerName,
      aadharNo: '',
      mobileNo: '',
      cropsName: 'Paddy',
      fertilizers: const [],
      cscProducts: const [],
      seeds: const [],
      pesticides: const [],
      remarks: 'Cash',
    );
  }

  group('validateKhataMouzaCombinationUnique', () {
    test('allows unique combination', () {
      expect(
        validateKhataMouzaCombinationUnique(
          existingFarmers: [
            sample(id: '1', khataNo: '10', villageOrMouza: 'Baripada'),
          ],
          khataNo: '11',
          villageOrMouza: 'Baripada',
        ),
        isNull,
      );
    });

    test('rejects duplicate combination ignoring case and spaces', () {
      final existing = [
        sample(
          id: '1',
          khataNo: ' 42 ',
          villageOrMouza: 'Suliapada',
          farmerName: 'Ramesh',
          slNo: 7,
        ),
      ];
      expect(
        validateKhataMouzaCombinationUnique(
          existingFarmers: existing,
          khataNo: '42',
          villageOrMouza: 'suliapada',
        ),
        contains('Already registered'),
      );
    });

    test('skips check when either field is empty', () {
      expect(
        validateKhataMouzaCombinationUnique(
          existingFarmers: [
            sample(id: '1', khataNo: '10', villageOrMouza: 'Baripada'),
          ],
          khataNo: '',
          villageOrMouza: 'Baripada',
        ),
        isNull,
      );
    });

    test('excludes current farmer when editing', () {
      final existing = [
        sample(id: 'edit-me', khataNo: '10', villageOrMouza: 'Baripada'),
      ];
      expect(
        validateKhataMouzaCombinationUnique(
          existingFarmers: existing,
          khataNo: '10',
          villageOrMouza: 'Baripada',
          excludeFarmerId: 'edit-me',
        ),
        isNull,
      );
    });
  });
}
