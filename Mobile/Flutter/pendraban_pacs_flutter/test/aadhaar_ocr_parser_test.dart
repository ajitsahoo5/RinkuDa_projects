import 'package:pendraban_pacs_flutter/src/core/aadhaar_ocr_parser.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('parseAadhaarOcrText', () {
    test('extracts spaced Aadhaar and name before DOB', () {
      const raw = '''
Government of India
RAM KUMAR SHARMA
DOB: 15/08/1990
Male
1234 5678 9012
''';
      final result = parseAadhaarOcrText(raw);
      expect(result.aadhaarDigits, '123456789012');
      expect(result.formattedAadhaar, '1234 5678 9012');
      expect(result.name, 'Ram Kumar Sharma');
    });

    test('extracts compact 12-digit Aadhaar', () {
      const raw = 'Name: SITA DEVI\n987654321098';
      final result = parseAadhaarOcrText(raw);
      expect(result.aadhaarDigits, '987654321098');
    });

    test('formatAadhaarDigits returns null for invalid length', () {
      expect(formatAadhaarDigits('123'), isNull);
      expect(formatAadhaarDigits('123456789012'), '1234 5678 9012');
    });
  });
}
