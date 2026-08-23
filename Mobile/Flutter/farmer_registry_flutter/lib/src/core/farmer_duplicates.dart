import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../models/farmer.dart'
    show Farmer, normalizedAadharDigits, normalizedMobileDigits;

String _normalizedLandParcelPart(String raw) => raw.trim().toLowerCase();

String _displayName(Farmer farmer) {
  final name = farmer.farmerName.trim();
  return name.isEmpty ? 'Existing farmer' : name;
}

/// True when [farmer] has the same Khata No + Mouza pair as the draft values.
bool khataMouzaCombinationMatches(
  Farmer farmer,
  String khataNo,
  String villageOrMouza,
) {
  final khata = _normalizedLandParcelPart(khataNo);
  final mouza = _normalizedLandParcelPart(villageOrMouza);
  if (khata.isEmpty || mouza.isEmpty) return false;
  return _normalizedLandParcelPart(farmer.khataNo) == khata &&
      _normalizedLandParcelPart(farmer.villageOrMouza) == mouza;
}

/// Another farmer with the same Khata No + Mouza combination, if any.
Farmer? findDuplicateKhataMouzaFarmer(
  List<Farmer> existing, {
  required String khataNo,
  required String villageOrMouza,
  String? excludeFarmerId,
}) {
  for (final farmer in existing) {
    if (excludeFarmerId != null && farmer.id == excludeFarmerId) continue;
    if (khataMouzaCombinationMatches(farmer, khataNo, villageOrMouza)) {
      return farmer;
    }
  }
  return null;
}

/// Short inline hint under Khata / Mouza fields.
String duplicateKhataMouzaFieldError(Farmer duplicate) {
  return 'Already registered (SL No ${duplicate.slNo})';
}

String duplicateKhataMouzaAlertTitle() => 'Duplicate Khata & Mouza';

String duplicateKhataMouzaAlertBody({
  required String khataNo,
  required String villageOrMouza,
  required Farmer duplicate,
}) {
  return 'Khata No "$khataNo" with Mouza "$villageOrMouza" is already registered '
      'for another farmer.\n\n'
      'Existing record\n'
      'SL No: ${duplicate.slNo}\n'
      'Farmer: ${_displayName(duplicate)}';
}

/// Form validation when both Khata No and Mouza are filled.
String? validateKhataMouzaCombinationUnique({
  required List<Farmer> existingFarmers,
  required String? khataNo,
  required String? villageOrMouza,
  String? excludeFarmerId,
}) {
  final khata = (khataNo ?? '').trim();
  final mouza = (villageOrMouza ?? '').trim();
  if (khata.isEmpty || mouza.isEmpty) return null;

  final duplicate = findDuplicateKhataMouzaFarmer(
    existingFarmers,
    khataNo: khata,
    villageOrMouza: mouza,
    excludeFarmerId: excludeFarmerId,
  );
  if (duplicate == null) return null;

  return duplicateKhataMouzaFieldError(duplicate);
}

/// In-memory duplicate check using the already-subscribed farmers list (no extra Firestore reads).
Farmer? findConflictingFarmerInList(
  List<Farmer> existing,
  Farmer farmer, {
  String? excludeFarmerId,
}) {
  final a = normalizedAadharDigits(farmer.aadharNo);
  final m = normalizedMobileDigits(farmer.mobileNo);
  final checkAadhar = a.length == 12;
  final checkMobile = m.length == 10 && RegExp(r'^[6-9]\d{9}$').hasMatch(m);
  final checkKhataMouza = farmer.khataNo.trim().isNotEmpty &&
      farmer.villageOrMouza.trim().isNotEmpty;
  if (!checkAadhar && !checkMobile && !checkKhataMouza) return null;

  for (final other in existing) {
    if (excludeFarmerId != null && other.id == excludeFarmerId) continue;
    if (checkAadhar) {
      final oa = normalizedAadharDigits(other.aadharNo);
      if (oa.length == 12 && oa == a) return other;
    }
    if (checkMobile) {
      final om = normalizedMobileDigits(other.mobileNo);
      if (RegExp(r'^[6-9]\d{9}$').hasMatch(om) && om == m) return other;
    }
    if (checkKhataMouza &&
        khataMouzaCombinationMatches(
          other,
          farmer.khataNo,
          farmer.villageOrMouza,
        )) {
      return other;
    }
  }
  return null;
}

enum FarmerConflictKind { aadhaar, mobile, khataMouza, other }

FarmerConflictKind farmerConflictKind(Farmer draft, Farmer conflict) {
  final a = normalizedAadharDigits(draft.aadharNo);
  if (a.length == 12 && normalizedAadharDigits(conflict.aadharNo) == a) {
    return FarmerConflictKind.aadhaar;
  }
  final m = normalizedMobileDigits(draft.mobileNo);
  if (m.length == 10 &&
      RegExp(r'^[6-9]\d{9}$').hasMatch(m) &&
      normalizedMobileDigits(conflict.mobileNo) == m) {
    return FarmerConflictKind.mobile;
  }
  if (khataMouzaCombinationMatches(
    conflict,
    draft.khataNo,
    draft.villageOrMouza,
  )) {
    return FarmerConflictKind.khataMouza;
  }
  return FarmerConflictKind.other;
}

String farmerConflictAlertTitle(Farmer draft, Farmer conflict) {
  switch (farmerConflictKind(draft, conflict)) {
    case FarmerConflictKind.aadhaar:
      return 'Duplicate Aadhaar';
    case FarmerConflictKind.mobile:
      return 'Duplicate mobile number';
    case FarmerConflictKind.khataMouza:
      return duplicateKhataMouzaAlertTitle();
    case FarmerConflictKind.other:
      return 'Duplicate farmer record';
  }
}

/// User-facing message when [conflict] blocks saving [draft].
String farmerConflictMessage(Farmer draft, Farmer conflict) {
  switch (farmerConflictKind(draft, conflict)) {
    case FarmerConflictKind.aadhaar:
      return 'This Aadhaar number is already registered for '
          'SL No ${conflict.slNo} (${_displayName(conflict)}).';
    case FarmerConflictKind.mobile:
      return 'This mobile number is already registered for '
          'SL No ${conflict.slNo} (${_displayName(conflict)}).';
    case FarmerConflictKind.khataMouza:
      return duplicateKhataMouzaAlertBody(
        khataNo: draft.khataNo.trim(),
        villageOrMouza: draft.villageOrMouza.trim(),
        duplicate: conflict,
      );
    case FarmerConflictKind.other:
      return 'This record conflicts with SL No ${conflict.slNo} '
          '(${_displayName(conflict)}).';
  }
}

Future<void> showDuplicateKhataMouzaAlert(
  BuildContext context, {
  required String khataNo,
  required String villageOrMouza,
  required Farmer duplicate,
}) {
  return _showConflictAlertDialog(
    context,
    title: duplicateKhataMouzaAlertTitle(),
    message: duplicateKhataMouzaAlertBody(
      khataNo: khataNo,
      villageOrMouza: villageOrMouza,
      duplicate: duplicate,
    ),
  );
}

Future<void> showFarmerSaveConflictAlert(
  BuildContext context, {
  required Farmer draft,
  required Farmer conflict,
}) {
  return _showConflictAlertDialog(
    context,
    title: farmerConflictAlertTitle(draft, conflict),
    message: farmerConflictMessage(draft, conflict),
  );
}

Future<void> _showConflictAlertDialog(
  BuildContext context, {
  required String title,
  required String message,
}) async {
  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      icon: PhosphorIcon(
        PhosphorIconsBold.warningCircle,
        color: Theme.of(ctx).colorScheme.error,
        size: 32,
      ),
      title: Text(title),
      content: SingleChildScrollView(
        child: Text(message),
      ),
      actions: [
        FilledButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('OK'),
        ),
      ],
    ),
  );
}
