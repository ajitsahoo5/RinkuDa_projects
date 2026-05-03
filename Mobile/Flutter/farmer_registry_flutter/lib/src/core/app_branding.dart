import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Shown under the launcher icon, app bars, auth screens, PDF/Excel captions, etc.
const String kAppDisplayName = 'Bhela pacs business';

/// Prefix for monetary amounts on PDF / Word invoices (e.g. `Rs. 1,234.50`).
const String kInvoiceCurrencyPrefix = 'Rs. ';

/// Letterhead on PDF / Word invoices (seller address and contact).
const List<String> kInvoiceSellerLetterheadLines = [
  'BHELA PRIMARY AGRICULTURE CO.OPERATIVE SOCIETY',
  '',
  'At/Po. Bhela',
  'Dist. Nuapada',
  'Pin 766106',
  'Regd no 77 KH.  DATED 15/04/1955',
  'GST NO. 21AABAB1923D2ZN',
  '',
  'Mob NO 9337755725',
];

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
