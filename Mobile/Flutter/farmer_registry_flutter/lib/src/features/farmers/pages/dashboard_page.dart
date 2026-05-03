import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../core/app_branding.dart';
import '../../../core/farmer_file_export.dart';
import '../../../core/glass.dart';
import '../../auth/pages/login_page.dart';
import '../../auth/state/auth_providers.dart';
import '../../../models/farmer.dart';
import '../state/farmers_providers.dart';
import '../widgets/info_line.dart';
import 'create_farmer_page.dart';
import 'farmer_details_page.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  static const routeName = 'dashboard';
  static const routePath = '/';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final farmersAsync = ref.watch(farmersStreamProvider);
    final farmers = ref.watch(filteredFarmersProvider);
    final allFarmers = farmersAsync.value ?? const <Farmer>[];
    final filter = ref.watch(farmerFilterProvider);
    final query = ref.watch(farmerSearchQueryProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);

    return AppBackground(
      child: Scaffold(
        appBar: AppBar(
          title: const Text(kAppDisplayName),
          actions: [
            IconButton(
              tooltip: 'Create',
              onPressed: () => context.pushNamed(CreateFarmerPage.routeName),
              icon: PhosphorIcon(PhosphorIconsBold.plus, color: Theme.of(context).colorScheme.primary),
            ),
            PopupMenuButton<String>(
              tooltip: 'Account',
              icon: PhosphorIcon(PhosphorIconsBold.userCircle, color: Theme.of(context).colorScheme.onSurface),
              onSelected: (value) async {
                if (value != 'sign_out') return;
                await FirebaseAuth.instance.signOut();
                if (!context.mounted) return;
                context.go(LoginPage.routePath);
              },
              itemBuilder: (BuildContext context) {
                final authEmail = FirebaseAuth.instance.currentUser?.email;
                final profile = profileAsync.maybeWhen(
                  data: (p) => p,
                  orElse: () => null,
                );
                final name = profile?.name.trim() ?? '';
                final titleText = name.isNotEmpty ? name : 'Account';
                final subtitleText = profile != null
                    ? '${profile.role} · ${profile.email.isNotEmpty ? profile.email : (authEmail ?? '')}'
                    : (authEmail ?? 'Signed in');
                return <PopupMenuEntry<String>>[
                  PopupMenuItem<String>(
                    enabled: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          titleText,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          subtitleText,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.black.withValues(alpha: 0.65),
                              ),
                        ),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  PopupMenuItem<String>(
                    value: 'sign_out',
                    child: Row(
                      children: [
                        PhosphorIcon(PhosphorIconsBold.signOut, size: 20, color: Theme.of(context).colorScheme.error),
                        const SizedBox(width: 12),
                        Text('Sign out', style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      ],
                    ),
                  ),
                ];
              },
            ),
          ],
        ),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              GlassContainer(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            onChanged: (v) => ref.read(farmerSearchQueryProvider.notifier).set(v),
                            decoration: const InputDecoration(
                              hintText: 'Search by name, adhar, mouja, contact…',
                              prefixIcon: PhosphorIcon(PhosphorIconsBold.magnifyingGlass),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        FilledButton.tonalIcon(
                          onPressed: () => _openPurchaseDateFilterSheet(context, ref),
                          icon: const PhosphorIcon(PhosphorIconsBold.calendarBlank),
                          label: const Text('Purchase date'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(
                          avatar: PhosphorIcon(PhosphorIconsBold.users, size: 18, color: Theme.of(context).colorScheme.primary),
                          label: Text('${farmers.length} shown / ${allFarmers.length} total'),
                        ),
                        if (query.trim().isNotEmpty)
                          InputChip(
                            label: Text('Search: "${query.trim()}"'),
                            onDeleted: () => ref.read(farmerSearchQueryProvider.notifier).clear(),
                          ),
                        if (!filter.isEmpty)
                          InputChip(
                            label: Text(_filterLabel(filter)),
                            onDeleted: () => ref.read(farmerFilterProvider.notifier).clear(),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              // Google Sheet UI (Firestore `settings/app` link + Sheets sync). Kept as reference —
              // app still triggers background sync via `FarmerRegistryApp` when a link is configured.
              // GlassContainer(
              //   child: Row(
              //     children: [
              //       Expanded(child: Column(
              //         crossAxisAlignment: CrossAxisAlignment.start,
              //         children: [
              //           Text('Google Sheet link', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              //           SizedBox(height: 6),
              //           Text(sheetLink?.trim().isEmpty != false ? 'Create or paste your sheet link here.' : sheetLink!),
              //           SizedBox(height: 6),
              //           Text('Farmers sync to tab "$kFarmerSheetTabName" after Google sign-in.', ...),
              //         ],
              //       )),
              //       IconButton(... copy / share / open / Sheets sign-in …),
              //     ],
              //   ),
              // ),

              GlassContainer(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Export registry',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Download Excel (.xlsx) or PDF for the farmers currently listed below '
                      '(${farmers.length} of ${allFarmers.length}${allFarmers.isEmpty ? '' : '; adjust search or purchase date to change the set'}).',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.black.withValues(alpha: 0.58),
                          ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            icon: const PhosphorIcon(PhosphorIconsBold.microsoftExcelLogo),
                            label: const Text('Excel (.xlsx)'),
                            onPressed: farmersAsync.isLoading || farmers.isEmpty
                                ? null
                                : () async {
                                    FocusManager.instance.primaryFocus?.unfocus();
                                    try {
                                      await shareFarmersAsExcel(farmers);
                                    } catch (e, st) {
                                      assert(() {
                                        debugPrint('$e\n$st');
                                        return true;
                                      }());
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Could not export: $e')),
                                      );
                                    }
                                  },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton.tonalIcon(
                            icon: const PhosphorIcon(PhosphorIconsBold.filePdf),
                            label: const Text('PDF'),
                            onPressed: farmersAsync.isLoading || farmers.isEmpty
                                ? null
                                : () async {
                                    FocusManager.instance.primaryFocus?.unfocus();
                                    try {
                                      await shareFarmersAsPdf(farmers);
                                    } catch (e, st) {
                                      assert(() {
                                        debugPrint('$e\n$st');
                                        return true;
                                      }());
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Could not export: $e')),
                                      );
                                    }
                                  },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (farmersAsync.isLoading)
                GlassContainer(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 26),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Loading farmers…',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                )
              else if (farmersAsync.hasError)
                GlassContainer(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    child: Column(
                      children: [
                        PhosphorIcon(PhosphorIconsBold.cloudSlash, size: 36, color: Colors.black.withValues(alpha: 0.45)),
                        const SizedBox(height: 10),
                        Text(
                          'Couldn’t load from Firebase',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${farmersAsync.error}',
                          maxLines: 4,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Colors.black.withValues(alpha: 0.6)),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              else if (farmers.isEmpty)
                GlassContainer(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 22),
                    child: Column(
                      children: [
                        PhosphorIcon(PhosphorIconsBold.tray, size: 36, color: Colors.black.withValues(alpha: 0.42)),
                        const SizedBox(height: 8),
                        Text(
                          'No farmers found',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Try clearing search or purchase date, or create a new record.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Colors.black.withValues(alpha: 0.6)),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        FilledButton.icon(
                          onPressed: () => context.pushNamed(CreateFarmerPage.routeName),
                          icon: const PhosphorIcon(PhosphorIconsBold.plus),
                          label: const Text('Create farmer'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...[
                  for (final f in farmers) ...[
                    _FarmerCard(farmer: f),
                    const SizedBox(height: 12),
                  ],
                ],
            ],
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.pushNamed(CreateFarmerPage.routeName),
          icon: const PhosphorIcon(PhosphorIconsBold.plus, color: Colors.white),
          label: const Text('Create'),
        ),
      ),
    );
  }
}

DateTime _purchaseCalendarDay(DateTime d) {
  final l = d.toLocal();
  return DateTime(l.year, l.month, l.day);
}

String _filterLabel(FarmerFilter f) {
  if (f.isEmpty) return '';
  final df = DateFormat.yMMMd();
  final parts = <String>[];
  if (f.purchaseDateFrom != null) {
    parts.add('From ${df.format(f.purchaseDateFrom!)}');
  }
  if (f.purchaseDateTo != null) {
    parts.add('To ${df.format(f.purchaseDateTo!)}');
  }
  return 'Purchase date: ${parts.join(' • ')}';
}

// Future<void> _openSheetLinkDialog(BuildContext context, WidgetRef ref) async { ... Firestore googleSheetLink … }

Future<void> _openPurchaseDateFilterSheet(BuildContext context, WidgetRef ref) async {
  final current = ref.read(farmerFilterProvider);
  var from = current.purchaseDateFrom;
  var to = current.purchaseDateTo;
  final df = DateFormat.yMMMd();

  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: 16 + MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: GlassContainer(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
          child: StatefulBuilder(
            builder: (ctx, setModal) {
              final rangeLast = DateTime.now().add(const Duration(days: 365 * 20));
              final rangeFirst = DateTime(1990);

              Future<void> pickFrom() async {
                final last = to != null ? _purchaseCalendarDay(to!) : rangeLast;
                var initial = from ?? to ?? DateTime.now();
                initial = _purchaseCalendarDay(initial);
                if (initial.isBefore(rangeFirst)) initial = rangeFirst;
                if (initial.isAfter(last)) initial = last;
                final picked = await showDatePicker(
                  context: ctx,
                  initialDate: initial,
                  firstDate: rangeFirst,
                  lastDate: last,
                );
                if (picked != null) setModal(() => from = picked);
              }

              Future<void> pickTo() async {
                final first = from != null ? _purchaseCalendarDay(from!) : rangeFirst;
                var initial = to ?? from ?? DateTime.now();
                initial = _purchaseCalendarDay(initial);
                if (initial.isBefore(first)) initial = first;
                if (initial.isAfter(rangeLast)) initial = rangeLast;
                final picked = await showDatePicker(
                  context: ctx,
                  initialDate: initial,
                  firstDate: first,
                  lastDate: rangeLast,
                );
                if (picked != null) setModal(() => to = picked);
              }

              Widget dateRow({
                required String label,
                required DateTime? value,
                required VoidCallback onChoose,
                required VoidCallback onClear,
              }) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onChoose,
                        icon: const PhosphorIcon(PhosphorIconsBold.calendarBlank, size: 20),
                        label: Text(
                          value == null ? '$label — Any' : '$label: ${df.format(value)}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          alignment: Alignment.centerLeft,
                        ),
                      ),
                    ),
                    if (value != null) ...[
                      const SizedBox(width: 8),
                      IconButton.filledTonal(
                        tooltip: 'Clear $label',
                        onPressed: () => setModal(onClear),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ],
                );
              }

              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      PhosphorIcon(PhosphorIconsBold.calendarBlank, size: 24, color: Theme.of(ctx).colorScheme.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Date of purchase',
                          style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Show farmers whose purchase date falls in this range (inclusive). '
                    'From must be on or before To. Leave a side as Any for an open bound.',
                    style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                          color: Colors.black.withValues(alpha: 0.58),
                        ),
                  ),
                  const SizedBox(height: 16),
                  dateRow(
                    label: 'From',
                    value: from,
                    onChoose: pickFrom,
                    onClear: () {
                      from = null;
                    },
                  ),
                  const SizedBox(height: 10),
                  dateRow(
                    label: 'To',
                    value: to,
                    onChoose: pickTo,
                    onClear: () {
                      to = null;
                    },
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: () {
                            ref.read(farmerFilterProvider.notifier).clear();
                            Navigator.of(ctx).pop();
                          },
                          child: const Text('Clear all'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          onPressed: () {
                            if (from != null &&
                                to != null &&
                                _purchaseCalendarDay(from!).isAfter(_purchaseCalendarDay(to!))) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                const SnackBar(
                                  content: Text('From date must be on or before To date.'),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                              return;
                            }
                            ref.read(farmerFilterProvider.notifier).set(FarmerFilter(
                              purchaseDateFrom: from,
                              purchaseDateTo: to,
                            ));
                            Navigator.of(ctx).pop();
                          },
                          child: const Text('Apply'),
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),
      );
    },
  );
}

class _FarmerCard extends ConsumerWidget {
  const _FarmerCard({required this.farmer});
  final Farmer farmer;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GlassContainer(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => context.pushNamed(FarmerDetailsPage.routeName, pathParameters: {'id': farmer.id}),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    farmer.farmerName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.25)),
                  ),
                  child: Text(
                    'SL ${farmer.slNo}',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: [
                _pill(context, PhosphorIconsBold.mapPin, farmer.villageOrMouza),
                _pill(context, PhosphorIconsBold.mountains, '${farmer.area} acre'),
                _pill(context, PhosphorIconsBold.shoppingBag, '₹${farmer.totalPrice.toStringAsFixed(0)}'),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: InfoLine(
                    label: 'Aadhaar',
                    value: farmer.aadharNo,
                    icon: PhosphorIconsBold.identificationCard,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InfoLine(
                    label: 'Mobile',
                    value: farmer.mobileNo,
                    icon: PhosphorIconsBold.phone,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            InfoLine(label: 'Khata No', value: farmer.khataNo, icon: PhosphorIconsBold.gridFour),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FilledButton.tonalIcon(
                    onPressed: () => context.pushNamed(
                      FarmerDetailsPage.routeName,
                      pathParameters: {'id': farmer.id},
                    ),
                    icon: const PhosphorIcon(PhosphorIconsBold.eye),
                    label: const Text('Details'),
                  ),
                ),
                // Edit/delete disabled — users may only register new farmers.
                // const SizedBox(width: 10),
                // IconButton.filledTonal(
                //   tooltip: 'Edit',
                //   onPressed: () => context.pushNamed(
                //     EditFarmerPage.routeName,
                //     pathParameters: {'id': farmer.id},
                //   ),
                //   icon: const Icon(Icons.edit_rounded),
                // ),
                // const SizedBox(width: 10),
                // IconButton.filledTonal(
                //   tooltip: 'Delete',
                //   onPressed: () async {
                //     final ok = await showDialog<bool>(
                //       context: context,
                //       builder: (ctx) => AlertDialog(
                //         title: const Text('Delete farmer?'),
                //         content: Text('This will remove "${farmer.farmerName}" permanently.'),
                //         actions: [
                //           TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
                //           FilledButton(
                //             onPressed: () => Navigator.of(ctx).pop(true),
                //             style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
                //             child: const Text('Delete'),
                //           ),
                //         ],
                //       ),
                //     );
                //     if (ok != true) return;
                //     await ref.read(farmersRepositoryProvider).deleteFarmer(farmer.id);
                //   },
                //   icon: const Icon(Icons.delete_rounded),
                // ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _pill(BuildContext context, IconData icon, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.black.withValues(alpha: 0.07)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          PhosphorIcon(icon, size: 16, color: Colors.black.withValues(alpha: 0.58)),
          const SizedBox(width: 6),
          Text(
            value.isEmpty ? '—' : value,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

