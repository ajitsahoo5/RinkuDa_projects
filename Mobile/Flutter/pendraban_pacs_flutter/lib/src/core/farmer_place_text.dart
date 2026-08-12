import 'package:characters/characters.dart';
import 'package:flutter/services.dart';

/// Allowed code points for person / place names: letters (Latin + major Indian
/// scripts), digits, space, and `.'-,`. Surrogate pairs / emoji / symbols are rejected.
bool farmerPlaceRuneAllowed(int cp) {
  if (cp == 0x20) return true;
  if (cp >= 0x30 && cp <= 0x39) return true;
  if (cp >= 0x41 && cp <= 0x5A) return true;
  if (cp >= 0x61 && cp <= 0x7A) return true;
  if (cp == 0x27 || cp == 0x2019) return true;
  if (cp == 0x2D || cp == 0x2013 || cp == 0x2014) return true;
  if (cp == 0x2E || cp == 0x2C) return true;
  if (cp == 0x200C || cp == 0x200D) return true;

  if (cp >= 0x00C0 && cp <= 0x024F) return true;
  if (cp >= 0x1E00 && cp <= 0x1EFF) return true;

  if (cp >= 0x0600 && cp <= 0x06FF) return true;

  if (cp >= 0x0900 && cp <= 0x097F) return true;
  if (cp >= 0x0980 && cp <= 0x09FF) return true;
  if (cp >= 0x0A00 && cp <= 0x0AFF) return true;
  if (cp >= 0x0B00 && cp <= 0x0BFF) return true;
  if (cp >= 0x0C00 && cp <= 0x0CFF) return true;
  if (cp >= 0x0D00 && cp <= 0x0DFF) return true;

  return false;
}

bool _farmerPlaceGraphemeAllowed(String g) {
  if (g.isEmpty) return true;
  for (final r in g.runes) {
    if (!farmerPlaceRuneAllowed(r)) return false;
  }
  return true;
}

bool farmerPlaceTextIsValid(String text) {
  for (final g in text.characters) {
    if (!_farmerPlaceGraphemeAllowed(g)) return false;
  }
  return true;
}

/// Validation for required / optional name & village fields.
String? validateFarmerPlaceInput(String? value, {required bool requiredField}) {
  final raw = value ?? '';
  if (raw.trim().isEmpty) {
    return requiredField ? 'This field is required' : null;
  }
  if (!farmerPlaceTextIsValid(raw)) {
    return 'Use only letters, numbers, spaces, or . , - \'. No symbols or emoji.';
  }
  return null;
}

/// Strips disallowed characters while typing / pasting.
class FarmerPlaceTextFormatter extends TextInputFormatter {
  const FarmerPlaceTextFormatter();

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final buf = StringBuffer();
    for (final g in newValue.text.characters) {
      if (_farmerPlaceGraphemeAllowed(g)) buf.write(g);
    }
    final t = buf.toString();
    if (t == newValue.text) return newValue;
    return TextEditingValue(
      text: t,
      selection: TextSelection.collapsed(offset: t.length),
    );
  }
}
