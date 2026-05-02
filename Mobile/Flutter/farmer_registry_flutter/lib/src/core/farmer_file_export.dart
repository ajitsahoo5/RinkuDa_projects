import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:archive/archive.dart';
import 'package:path/path.dart' as p;

import 'package:excel/excel.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import '../models/farmer.dart';
import '../models/fertilizer_type.dart';
import 'app_branding.dart';
import 'farmer_table_rows.dart';

String _filenameStamp() => DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

String _safeFileSegment(String name) {
  var s =
      name.replaceAll(RegExp(r'[<>:"/\\|?*]'), '_').replaceAll(RegExp(r'\s+'), '_').trim();
  if (s.isEmpty) s = 'farmer';
  return s.length > 48 ? s.substring(0, 48) : s;
}

String _xmlEsc(String s) => s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

String _wordPara(String text) =>
    '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    '<w:r><w:t xml:space="preserve">${_xmlEsc(text)}</w:t></w:r></w:p>';

List<FertilizerType> _invoiceFertilizers(Farmer farmer) =>
    farmer.fertilizers.where((x) => x.amount > 0 || x.price > 0).toList();

Iterable<String> _invoiceTextLines(Farmer farmer, {required String currency}) sync* {
  final dateStr = DateFormat('yyyy-MM-dd').format(farmer.dateOfPurchase);
  yield '$kAppDisplayName — Invoice';
  yield 'Generated: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now())}';
  yield '';
  yield 'Farmer: ${farmer.farmerName}';
  yield 'SL No: ${farmer.slNo}';
  yield 'Date of purchase: $dateStr';
  yield 'Land owner: ${farmer.landOwnerName}';
  yield 'Village/Mouza: ${farmer.villageOrMouza}';
  yield 'Khata No: ${farmer.khataNo}';
  yield 'Area: ${farmer.area}';
  yield 'Aadhaar: ${farmer.aadharNo.isEmpty ? '—' : farmer.aadharNo}';
  yield 'Mobile: ${farmer.mobileNo.isEmpty ? '—' : farmer.mobileNo}';
  yield 'Crops: ${farmer.cropsName.isEmpty ? '—' : farmer.cropsName}';
  yield '';
  yield 'Fertilizer supply';
  final rows = _invoiceFertilizers(farmer);
  if (rows.isEmpty) {
    yield '(No line items with amount or price)';
  } else {
    for (final f in rows) {
      final u = f.unit.trim().isEmpty ? 'kg' : f.unit.toLowerCase();
      final line = (f.amount * f.price).toStringAsFixed(2);
      yield '${f.name}: ${f.amount} $u × $currency${f.price} = $currency$line';
    }
  }
  yield '';
  yield 'Total: $currency${farmer.totalPrice.toStringAsFixed(2)}';
  if (farmer.remarks.trim().isNotEmpty) {
    yield '';
    yield 'Remarks:';
    yield farmer.remarks.trim();
  }
}

Uint8List _encodeInvoiceDocx(Farmer farmer) {
  final body = StringBuffer()
    ..write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    ..write(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    )
    ..write('<w:body>');
  for (final line in _invoiceTextLines(farmer, currency: '₹')) {
    body.write(_wordPara(line));
  }
  body.write(
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
    '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>'
    '</w:sectPr>',
  );
  body.write('</w:body></w:document>');

  final docBytes = utf8.encode(body.toString());

  const ct = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>''';

  const rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>''';

  final archive = Archive()
    ..addFile(
      ArchiveFile('[Content_Types].xml', utf8.encode(ct).length, utf8.encode(ct)),
    )
    ..addFile(ArchiveFile('_rels/.rels', utf8.encode(rels).length, utf8.encode(rels)))
    ..addFile(ArchiveFile('word/document.xml', docBytes.length, docBytes));

  final zipped = ZipEncoder().encode(archive);
  if (zipped == null) {
    throw StateError('Word export failed.');
  }
  return Uint8List.fromList(zipped);
}

pw.Widget _pdfLabelValue(String label, String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 4),
    child: pw.RichText(
      text: pw.TextSpan(
        children: [
          pw.TextSpan(
            text: '$label ',
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9),
          ),
          pw.TextSpan(
            text: value.isEmpty ? '—' : value,
            style: const pw.TextStyle(fontSize: 9),
          ),
        ],
      ),
    ),
  );
}

pw.Document _buildFarmerInvoicePdfDoc(Farmer farmer) {
  const currency = '₹';
  final pdf = pw.Document();
  final fertRows = _invoiceFertilizers(farmer);
  pdf.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(40),
      build: (ctx) => [
        pw.Text(
          kAppDisplayName,
          style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
        ),
        pw.Text(
          'Invoice',
          style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
        ),
        pw.SizedBox(height: 8),
        pw.Text(
          'Generated ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now())}',
          style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
        ),
        pw.SizedBox(height: 16),
        pw.Text(
          farmer.farmerName,
          style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold),
        ),
        pw.Text('SL No ${farmer.slNo}', style: const pw.TextStyle(fontSize: 10)),
        pw.SizedBox(height: 12),
        _pdfLabelValue('Date of purchase', DateFormat('yyyy-MM-dd').format(farmer.dateOfPurchase)),
        _pdfLabelValue('Land owner', farmer.landOwnerName),
        _pdfLabelValue('Village/Mouza', farmer.villageOrMouza),
        _pdfLabelValue('Khata No', farmer.khataNo),
        _pdfLabelValue('Area', '${farmer.area}'),
        _pdfLabelValue('Aadhaar', farmer.aadharNo),
        _pdfLabelValue('Mobile', farmer.mobileNo),
        _pdfLabelValue('Crops', farmer.cropsName),
        pw.SizedBox(height: 14),
        pw.Text(
          'Fertilizer supply',
          style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold),
        ),
        pw.SizedBox(height: 6),
        if (fertRows.isEmpty)
          pw.Text(
            '(No line items with amount or price)',
            style: const pw.TextStyle(fontSize: 9),
          )
        else
          pw.Table(
            border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
            columnWidths: {
              0: const pw.FlexColumnWidth(2.2),
              1: const pw.FlexColumnWidth(1.2),
              2: const pw.FlexColumnWidth(1.3),
              3: const pw.FlexColumnWidth(1.3),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey300),
                children: [
                  _pdfTableCell('Item', header: true),
                  _pdfTableCell('Amount', header: true),
                  _pdfTableCell('Unit price', header: true),
                  _pdfTableCell('Line total', header: true),
                ],
              ),
              for (final f in fertRows)
                pw.TableRow(
                  children: [
                    _pdfTableCell(f.name),
                    _pdfTableCell(
                      '${f.amount} ${f.unit.trim().isEmpty ? 'kg' : f.unit.toLowerCase()}',
                    ),
                    _pdfTableCell('$currency${f.price}'),
                    _pdfTableCell('$currency${(f.amount * f.price).toStringAsFixed(2)}'),
                  ],
                ),
            ],
          ),
        pw.SizedBox(height: 14),
        pw.Container(
          padding: const pw.EdgeInsets.all(10),
          decoration: pw.BoxDecoration(
            color: PdfColors.grey200,
            border: pw.Border.all(color: PdfColors.grey500),
          ),
          child: pw.Text(
            'Total: $currency${farmer.totalPrice.toStringAsFixed(2)}',
            style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
          ),
        ),
        if (farmer.remarks.trim().isNotEmpty) ...[
          pw.SizedBox(height: 12),
          pw.Text('Remarks', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 4),
          pw.Text(farmer.remarks.trim(), style: const pw.TextStyle(fontSize: 9)),
        ],
      ],
    ),
  );
  return pdf;
}

pw.Widget _pdfTableCell(String text, {bool header = false}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
    child: pw.Text(
      text,
      style: pw.TextStyle(
        fontSize: header ? 8 : 8,
        fontWeight: header ? pw.FontWeight.bold : pw.FontWeight.normal,
      ),
    ),
  );
}

/// Builds a single-farmer invoice PDF and opens the share sheet (save / print / WhatsApp, etc.).
Future<void> shareFarmerInvoicePdf(Farmer farmer) async {
  final pdf = _buildFarmerInvoicePdfDoc(farmer);
  final bytes = await pdf.save();

  final dir = await getTemporaryDirectory();
  final path = p.join(
    dir.path,
    'invoice_sl${farmer.slNo}_${_safeFileSegment(farmer.farmerName)}_${_filenameStamp()}.pdf',
  );
  await File(path).writeAsBytes(bytes, flush: true);

  await SharePlus.instance.share(
    ShareParams(
      files: <XFile>[
        XFile(path, mimeType: 'application/pdf', name: p.basename(path)),
      ],
      subject: '$kAppDisplayName — Invoice ${farmer.farmerName}',
      text: '$kAppDisplayName — Invoice (SL ${farmer.slNo})',
    ),
  );
}

/// Builds a Word [.docx] invoice and opens the share sheet.
Future<void> shareFarmerInvoiceDocx(Farmer farmer) async {
  final bytes = _encodeInvoiceDocx(farmer);

  final dir = await getTemporaryDirectory();
  final path = p.join(
    dir.path,
    'invoice_sl${farmer.slNo}_${_safeFileSegment(farmer.farmerName)}_${_filenameStamp()}.docx',
  );
  await File(path).writeAsBytes(bytes, flush: true);

  await SharePlus.instance.share(
    ShareParams(
      files: <XFile>[
        XFile(
          path,
          mimeType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          name: p.basename(path),
        ),
      ],
      subject: '$kAppDisplayName — Invoice ${farmer.farmerName}',
      text: '$kAppDisplayName — Invoice (SL ${farmer.slNo})',
    ),
  );
}

/// Builds an `.xlsx` and opens the platform share sheet.
Future<void> shareFarmersAsExcel(List<Farmer> farmers) async {
  final rows = buildFarmerTableRows(farmers);
  final excel = Excel.createExcel();
  final sheetName = excel.sheets.keys.first;
  excel.rename(sheetName, 'Farmers');
  final sheet = excel['Farmers'];

  for (var r = 0; r < rows.length; r++) {
    for (var c = 0; c < rows[r].length; c++) {
      sheet
          .cell(CellIndex.indexByColumnRow(columnIndex: c, rowIndex: r))
          .value = TextCellValue(rows[r][c]?.toString() ?? '');
    }
  }

  final bytes = excel.encode();
  if (bytes == null) {
    throw StateError('Excel export failed.');
  }

  final dir = await getTemporaryDirectory();
  final path = p.join(dir.path, 'farmers_${_filenameStamp()}.xlsx');
  await File(path).writeAsBytes(bytes, flush: true);

  await SharePlus.instance.share(
    ShareParams(
      files: <XFile>[
        XFile(
          path,
          mimeType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          name: p.basename(path),
        ),
      ],
      subject: kAppDisplayName,
      text: '$kAppDisplayName — export (${farmers.length} farmers)',
    ),
  );
}

/// Builds a PDF and opens the platform share sheet.
Future<void> shareFarmersAsPdf(List<Farmer> farmers) async {
  final rows = buildFarmerTableRows(farmers);
  final stringRows = rows.map((r) => r.map((e) => e?.toString() ?? '').toList()).toList();
  final headers = stringRows.first;
  final body = stringRows.skip(1).toList();

  final pdf = pw.Document();
  pdf.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4.landscape,
      margin: const pw.EdgeInsets.all(22),
      build: (pw.Context ctx) {
        return [
          pw.Text(
            '$kAppDisplayName (${farmers.length} farmers)',
            style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 10),
          pw.TableHelper.fromTextArray(
            headers: headers,
            data: body,
            headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 7),
            cellStyle: const pw.TextStyle(fontSize: 6),
            headerDecoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey700, width: 0.35),
              color: PdfColors.grey300,
            ),
            cellPadding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
            cellAlignment: pw.Alignment.centerLeft,
            headerAlignment: pw.Alignment.centerLeft,
          ),
        ];
      },
    ),
  );

  final bytes = await pdf.save();

  final dir = await getTemporaryDirectory();
  final path = p.join(dir.path, 'farmers_${_filenameStamp()}.pdf');
  await File(path).writeAsBytes(bytes, flush: true);

  await SharePlus.instance.share(
    ShareParams(
      files: <XFile>[
        XFile(
          path,
          mimeType: 'application/pdf',
          name: p.basename(path),
        ),
      ],
      subject: kAppDisplayName,
      text: '$kAppDisplayName — export (${farmers.length} farmers)',
    ),
  );
}
