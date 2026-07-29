import 'package:farmer_registry_flutter/src/core/farmer_place_text.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('validateKhataAndMouzaDistinct', () {
    test('allows different values', () {
      expect(
        validateKhataAndMouzaDistinct(khataNo: '123', villageOrMouza: 'Baripada'),
        isNull,
      );
    });

    test('rejects same value ignoring case and spaces', () {
      expect(
        validateKhataAndMouzaDistinct(khataNo: ' 42 ', villageOrMouza: '42'),
        isNotNull,
      );
      expect(
        validateKhataAndMouzaDistinct(khataNo: 'abc', villageOrMouza: 'ABC'),
        isNotNull,
      );
    });

    test('skips check when either field is empty', () {
      expect(
        validateKhataAndMouzaDistinct(khataNo: '', villageOrMouza: 'Baripada'),
        isNull,
      );
      expect(
        validateKhataAndMouzaDistinct(khataNo: '123', villageOrMouza: ''),
        isNull,
      );
    });
  });
}
