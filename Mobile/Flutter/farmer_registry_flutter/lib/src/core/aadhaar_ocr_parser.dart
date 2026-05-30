import 'farmer_place_text.dart';

/// Parsed fields from OCR on an Aadhaar card (front).
class AadhaarOcrParseResult {
  const AadhaarOcrParseResult({
    this.name,
    this.aadhaarDigits,
    required this.rawText,
  });

  final String? name;
  /// Twelve digits only, when found.
  final String? aadhaarDigits;
  final String rawText;

  String? get formattedAadhaar => formatAadhaarDigits(aadhaarDigits);

  bool get hasAnyField =>
      (name != null && name!.trim().isNotEmpty) ||
      (aadhaarDigits != null && aadhaarDigits!.length == 12);
}

/// `123456789012` → `1234 5678 9012`
String? formatAadhaarDigits(String? digits) {
  if (digits == null || digits.length != 12) return null;
  return '${digits.substring(0, 4)} ${digits.substring(4, 8)} ${digits.substring(8, 12)}';
}

AadhaarOcrParseResult parseAadhaarOcrText(String rawText) {
  final lines = _normalizeLines(rawText);
  final aadhaar = _extractAadhaarDigits(rawText, lines);
  final name = _extractName(lines);
  return AadhaarOcrParseResult(
    name: name,
    aadhaarDigits: aadhaar,
    rawText: rawText,
  );
}

List<String> _normalizeLines(String raw) {
  return raw
      .split(RegExp(r'[\r\n]+'))
      .map((l) => l.replaceAll(RegExp(r'\s+'), ' ').trim())
      .where((l) => l.isNotEmpty)
      .toList();
}

String? _extractAadhaarDigits(String raw, List<String> lines) {
  final spaced = RegExp(r'\b(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})\b');
  for (final m in spaced.allMatches(raw)) {
    final combined = '${m.group(1)}${m.group(2)}${m.group(3)}';
    if (_isTwelveDigitAadhaar(combined)) return combined;
  }

  for (final line in lines) {
    final digits = line.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 12 && _isTwelveDigitAadhaar(digits)) return digits;
    if (digits.length > 12) {
      for (var i = 0; i <= digits.length - 12; i++) {
        final chunk = digits.substring(i, i + 12);
        if (_isTwelveDigitAadhaar(chunk)) return chunk;
      }
    }
  }

  final allDigits = raw.replaceAll(RegExp(r'\D'), '');
  if (allDigits.length >= 12) {
    for (var i = allDigits.length - 12; i >= 0; i--) {
      final chunk = allDigits.substring(i, i + 12);
      if (_isTwelveDigitAadhaar(chunk)) return chunk;
    }
  }
  return null;
}

bool _isTwelveDigitAadhaar(String digits) =>
    digits.length == 12 && RegExp(r'^\d{12}$').hasMatch(digits);

const _nameSkipSubstrings = <String>[
  'government',
  'india',
  'uidai',
  'unique',
  'identification',
  'authority',
  'aadhaar',
  'aadhar',
  'male',
  'female',
  'transgender',
  'dob',
  'birth',
  'year of',
  'address',
  'help@',
  'www.',
  'http',
  'enrol',
  'enroll',
  'vid',
  'download',
  'भारत',
  'सरकार',
];

String? _extractName(List<String> lines) {
  final dobIndex = _indexOfDobLine(lines);
  if (dobIndex != null) {
    for (var offset = 1; offset <= 3; offset++) {
      final idx = dobIndex - offset;
      if (idx < 0) break;
      final name = _cleanNameCandidate(lines[idx]);
      if (name != null) return name;
    }
  }

  final indiaIndex = lines.indexWhere(
    (l) => l.toLowerCase().contains('india') || l.toLowerCase().contains('भारत'),
  );
  if (indiaIndex >= 0) {
    for (var i = indiaIndex + 1; i < lines.length && i <= indiaIndex + 4; i++) {
      final name = _cleanNameCandidate(lines[i]);
      if (name != null) return name;
    }
  }

  String? best;
  var bestScore = 0;
  final searchEnd = lines.length < 12 ? lines.length : 12;
  for (var i = 0; i < searchEnd; i++) {
    final name = _cleanNameCandidate(lines[i]);
    if (name == null) continue;
    final score = name.replaceAll(RegExp(r'[^A-Za-z]'), '').length;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}

int? _indexOfDobLine(List<String> lines) {
  for (var i = 0; i < lines.length; i++) {
    final lower = lines[i].toLowerCase();
    if (lower.contains('dob') ||
        lower.contains('date of birth') ||
        lower.contains('year of birth') ||
        RegExp(r'\b(yob|y\.?o\.?b)\b').hasMatch(lower)) {
      return i;
    }
    if (RegExp(r'\d{2}[/-]\d{2}[/-]\d{4}').hasMatch(lines[i])) {
      return i;
    }
  }
  return null;
}

String? _cleanNameCandidate(String line) {
  var s = line.trim();
  if (s.isEmpty) return null;

  s = s.replaceFirst(
    RegExp(r'^(S/O|D/O|W/O|C/O)\s*:?\s*', caseSensitive: false),
    '',
  );
  s = s.replaceAll(RegExp(r'\s+'), ' ').trim();

  if (!_looksLikePersonName(s)) return null;
  return _normalizePersonName(s);
}

bool _looksLikePersonName(String s) {
  if (s.length < 2 || s.length > 80) return false;

  final lower = s.toLowerCase();
  for (final skip in _nameSkipSubstrings) {
    if (lower.contains(skip)) return false;
  }

  if (RegExp(r'\d{3,}').hasMatch(s)) return false;
  if (!farmerPlaceTextIsValid(s)) return false;

  final letters = s.replaceAll(RegExp(r'[^A-Za-z\u0900-\u0DFF]'), '');
  return letters.length >= 2;
}

String _normalizePersonName(String s) {
  if (RegExp(r"^[A-Z0-9\s.\-',]+$").hasMatch(s) && s.contains(RegExp(r'[A-Z]'))) {
    return s
        .split(RegExp(r'\s+'))
        .map((w) {
          if (w.isEmpty) return w;
          if (w.length == 1) return w.toUpperCase();
          return '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}';
        })
        .join(' ');
  }
  return s;
}
