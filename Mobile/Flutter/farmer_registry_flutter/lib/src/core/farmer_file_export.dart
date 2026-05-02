import 'dart:io';

import 'package:path/path.dart' as p;

import 'package:excel/excel.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import '../models/farmer.dart';
import 'app_branding.dart';
import 'farmer_table_rows.dart';

String _filenameStamp() => DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

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
