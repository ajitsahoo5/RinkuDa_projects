import 'dart:developer' as developer;

import 'package:extension_google_sign_in_as_googleapis_auth/extension_google_sign_in_as_googleapis_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:googleapis/sheets/v4.dart' as sheets;

import '../models/farmer.dart';

/// Tab used for farmer export (must exist in the spreadsheet).
const String kFarmerSheetTabName = 'Sheet1';

final List<String> _sheetScopes = [sheets.SheetsApi.spreadsheetsScope];

/// Extracts spreadsheet ID from a full URL or a raw ID string.
String? spreadsheetIdFromLink(String linkOrId) {
  final t = linkOrId.trim();
  if (t.isEmpty) return null;
  final fromUrl = RegExp(r'/spreadsheets/d/([a-zA-Z0-9_-]+)').firstMatch(t)?.group(1);
  if (fromUrl != null) return fromUrl;
  if (RegExp(r'^[a-zA-Z0-9_-]{30,}$').hasMatch(t.replaceAll(' ', ''))) {
    return t.replaceAll(' ', '');
  }
  return null;
}

String _fertilizerSummary(Farmer f) {
  return f.fertilizers
      .where((x) => x.amount > 0 || x.price > 0)
      .map((x) => '${x.name}: ${x.amount} × ${x.price}')
      .join('; ');
}

List<List<Object?>> _buildSheetRows(List<Farmer> farmers) {
  final sorted = List<Farmer>.from(farmers)..sort((a, b) => a.slNo.compareTo(b.slNo));
  const header = [
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
      [
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
        _fertilizerSummary(f),
        f.id,
        now,
      ],
  ];
}

/// Interactive sign-in + Sheets scope (call from a button). Required once per device/user.
Future<bool> ensureGoogleSheetsAuthorization(BuildContext context) async {
  try {
    final account = await GoogleSignIn.instance.authenticate(scopeHint: _sheetScopes);
    await account.authorizationClient.authorizeScopes(_sheetScopes);
    if (!context.mounted) return true;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Google account linked — sheet will sync every 2 minutes.')),
    );
    return true;
  } on GoogleSignInException catch (e) {
    if (!context.mounted) return false;
    switch (e.code) {
      case GoogleSignInExceptionCode.canceled:
      case GoogleSignInExceptionCode.interrupted:
      case GoogleSignInExceptionCode.uiUnavailable:
        return false;
      default:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google sign-in failed: ${e.description ?? e.code.name}')),
        );
        return false;
    }
  }
}

/// Writes all farmers to the first sheet (replaces values). Uses existing Google session only (no UI).
Future<void> syncFarmersToGoogleSheet({
  required String? sheetLink,
  required List<Farmer>? farmers,
}) async {
  if (sheetLink == null || sheetLink.trim().isEmpty || farmers == null) return;

  final spreadsheetId = spreadsheetIdFromLink(sheetLink);
  if (spreadsheetId == null) {
    developer.log('Invalid sheet link or ID', name: 'SheetSync');
    return;
  }

  final Future<GoogleSignInAccount?>? lightAuth =
      GoogleSignIn.instance.attemptLightweightAuthentication();
  final GoogleSignInAccount? account = lightAuth != null ? await lightAuth : null;
  if (account == null) {
    developer.log('No Google session — use “Sign in for sheet sync” on the dashboard', name: 'SheetSync');
    return;
  }

  final auth = await account.authorizationClient.authorizationForScopes(_sheetScopes);
  if (auth == null) {
    developer.log('Sheets scope not granted yet — use “Sign in for sheet sync”', name: 'SheetSync');
    return;
  }

  final httpClient = auth.authClient(scopes: _sheetScopes);
  try {
    final api = sheets.SheetsApi(httpClient);
    final rows = _buildSheetRows(farmers);
    final clearRange = '$kFarmerSheetTabName!A:ZZ';

    await api.spreadsheets.values.batchClear(
      sheets.BatchClearValuesRequest(ranges: [clearRange]),
      spreadsheetId,
    );

    await api.spreadsheets.values.update(
      sheets.ValueRange(values: rows),
      spreadsheetId,
      '$kFarmerSheetTabName!A1',
      valueInputOption: 'USER_ENTERED',
    );

    developer.log('Synced ${farmers.length} farmers to sheet', name: 'SheetSync');
  } catch (e, st) {
    developer.log('Sheet sync failed', name: 'SheetSync', error: e, stackTrace: st);
  } finally {
    httpClient.close();
  }
}
