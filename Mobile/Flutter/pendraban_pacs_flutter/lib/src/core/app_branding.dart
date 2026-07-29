import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../models/app_organization_settings.dart';

/// Shown under the launcher icon, app bars, auth screens, PDF/Excel captions, etc.
const String kAppDisplayName = 'Pendraban PACS';

/// Legal name on invoices (letterhead line 1).
const String kPacsLegalName = 'PENDRABAN PRIMARY AGRICULTURAL CREDIT SOCIETY';

/// Registration line when GST/address not yet set in admin Settings.
const String kPacsRegistrationLine = 'Regd no 206 KH.  DATED 29/04/1955';

/// Prefix for monetary amounts on PDF / Word invoices (e.g. `Rs. 1,234.50`).
const String kInvoiceCurrencyPrefix = 'Rs. ';

/// Fallback letterhead when Firestore `settings/app` has no org fields yet.
const List<String> kInvoiceSellerLetterheadLines = [
  kPacsLegalName,
  '',
  kPacsRegistrationLine,
  '',
  'Mob NO —',
];

/// Letterhead for PDF / Word — merges admin Settings (Firestore) with static PACS name.
List<String> buildInvoiceLetterhead(AppOrganizationSettings? org) {
  final address = org?.address?.trim();
  final gst = org?.gstNumber?.trim();
  final mobile = org?.mobileNumber?.trim();

  final regGstLine = gst != null && gst.isNotEmpty
      ? '$kPacsRegistrationLine \t\t\t\t GST NO. $gst'
      : kPacsRegistrationLine;

  return [
    kPacsLegalName,
    '',
    if (address != null && address.isNotEmpty) address,
    regGstLine,
    '',
    if (mobile != null && mobile.isNotEmpty) 'Mob NO $mobile' else 'Mob NO —',
  ];
}

/// Source image for launcher icon & in-app logo (keep in sync via `flutter_launcher_icons`).
const String kAppLogoAsset = 'assets/branding/app_icon.png';

/// Circular badge used on sign-in / sign-up.
class AppLogoCircle extends StatelessWidget {
  const AppLogoCircle({super.key, this.size = 96});

  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: Image.asset(
        kAppLogoAsset,
        width: size,
        height: size,
        fit: BoxFit.cover,
        filterQuality: FilterQuality.high,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: size,
            height: size,
            color: Theme.of(context).colorScheme.primaryContainer,
            alignment: Alignment.center,
            child: PhosphorIcon(
              PhosphorIconsBold.storefront,
              size: size * 0.45,
              color: Theme.of(context).colorScheme.onPrimaryContainer,
            ),
          );
        },
      ),
    );
  }
}
