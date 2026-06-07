const _ones = <String>[
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const _tens = <String>[
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

String _lessThanHundredWords(int n) {
  if (n == 0) return '';
  if (n < 20) return _ones[n];
  final tens = n ~/ 10;
  final ones = n % 10;
  if (ones == 0) return _tens[tens];
  return '${_tens[tens]} ${_ones[ones]}';
}

String _indianIntegerWords(int n) {
  if (n == 0) return 'Zero';

  final parts = <String>[];

  if (n >= 10000000) {
    parts.add('${_indianIntegerWords(n ~/ 10000000)} Crore');
    n %= 10000000;
  }
  if (n >= 100000) {
    parts.add('${_indianIntegerWords(n ~/ 100000)} Lakh');
    n %= 100000;
  }
  if (n >= 1000) {
    parts.add('${_indianIntegerWords(n ~/ 1000)} Thousand');
    n %= 1000;
  }
  if (n >= 100) {
    parts.add('${_ones[n ~/ 100]} Hundred');
    n %= 100;
  }
  if (n > 0) {
    parts.add(_lessThanHundredWords(n));
  }

  return parts.join(' ');
}

/// Converts [amount] to invoice-style words using the Indian numbering system.
///
/// Example: `1234567.50` →
/// `Rupees Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven and Fifty Paise Only`
String amountInIndianWords(double amount) {
  final roundedPaise = (amount * 100).round();
  final rupees = roundedPaise ~/ 100;
  final paise = roundedPaise % 100;

  final buffer = StringBuffer('Rupees ');
  buffer.write(_indianIntegerWords(rupees));
  if (paise > 0) {
    buffer.write(' and ${_indianIntegerWords(paise)} Paise');
  }
  buffer.write(' Only');
  return buffer.toString();
}
