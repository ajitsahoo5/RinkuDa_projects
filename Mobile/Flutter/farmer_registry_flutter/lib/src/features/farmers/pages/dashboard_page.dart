import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/glass.dart';
import '../../../core/sheet_sync.dart';
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
    final sheetLink = ref.watch(googleSheetLinkStreamProvider).value;

    return AppBackground(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Farmer Registry'),
          actions: [
            IconButton(
              tooltip: 'Create',
              onPressed: () => context.pushNamed(CreateFarmerPage.routeName),
              icon: const Icon(Icons.add_rounded),
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
                              prefixIcon: Icon(Icons.search_rounded),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        FilledButton.tonalIcon(
                          onPressed: () => _openFilterSheet(context, ref),
                          icon: const Icon(Icons.tune_rounded),
                          label: const Text('Filter'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(
                          avatar: const Icon(Icons.people_alt_rounded, size: 18),
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
              GlassContainer(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Google Sheet link',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            sheetLink == null || sheetLink.trim().isEmpty
                                ? 'Create or paste your sheet link here.'
                                : sheetLink,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.black.withValues(alpha: 0.65),
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Farmers sync to tab "$kFarmerSheetTabName" every 2 minutes after you sign in to Google below.',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.black.withValues(alpha: 0.55),
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    // FilledButton(
                    //   onPressed: () => _openSheetLinkDialog(context, ref),
                    //   child: Text(sheetLink == null ? 'Create link' : 'Edit link'),
                    // ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      tooltip: 'Copy / Share',
                      onPressed: sheetLink == null || sheetLink.trim().isEmpty
                          ? null
                          : () async {
                              await Clipboard.setData(ClipboardData(text: sheetLink));
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Copied Google Sheet link')),
                              );
                              await SharePlus.instance.share(ShareParams(text: sheetLink));
                            },
                      icon: const Icon(Icons.ios_share_rounded),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      tooltip: 'Open',
                      onPressed: sheetLink == null || sheetLink.trim().isEmpty
                          ? null
                          : () async {
                              final uri = Uri.tryParse(sheetLink.trim());
                              if (uri == null) return;
                              await launchUrl(uri, mode: LaunchMode.externalApplication);
                            },
                      icon: const Icon(Icons.open_in_new_rounded),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      tooltip: 'Sign in for sheet sync',
                      onPressed: () => ensureGoogleSheetsAuthorization(context),
                      icon: const Icon(Icons.cloud_upload_rounded),
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
                        Icon(Icons.cloud_off_rounded, size: 34, color: Colors.black.withValues(alpha: 0.5)),
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
                        Icon(Icons.inbox_rounded, size: 36, color: Colors.black.withValues(alpha: 0.45)),
                        const SizedBox(height: 8),
                        Text(
                          'No farmers found',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Try clearing search or filters, or create a new record.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Colors.black.withValues(alpha: 0.6)),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        FilledButton.icon(
                          onPressed: () => context.pushNamed(CreateFarmerPage.routeName),
                          icon: const Icon(Icons.add_rounded),
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
          icon: const Icon(Icons.add_rounded),
          label: const Text('Create'),
        ),
      ),
    );
  }
}

String _filterLabel(FarmerFilter f) {
  final parts = <String>[];
  if (f.mouja != null && f.mouja!.trim().isNotEmpty) parts.add('Mouja: ${f.mouja!.trim()}');
  if (f.minAcre != null) parts.add('Min: ${f.minAcre}');
  if (f.maxAcre != null) parts.add('Max: ${f.maxAcre}');
  return parts.join(' • ');
}

Future<void> _openSheetLinkDialog(BuildContext context, WidgetRef ref) async {
  final current = ref.read(googleSheetLinkStreamProvider).value;
  final controller = TextEditingController(text: current ?? '');
  final saved = await showDialog<String?>(
    context: context,
    builder: (ctx) {
      return AlertDialog(
        title: const Text('Google Sheet link'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'Paste link or Sheet ID',
            prefixIcon: Icon(Icons.link_rounded),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(null), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      );
    },
  );

  if (saved == null) return;
  final link = saved.startsWith('http')
      ? saved
      : 'https://docs.google.com/spreadsheets/d/${saved.replaceAll(' ', '')}/edit';
  await ref.read(settingsRepositoryProvider).setGoogleSheetLink(link);
}

Future<void> _openFilterSheet(BuildContext context, WidgetRef ref) async {
  final current = ref.read(farmerFilterProvider);
  final moujaController = TextEditingController(text: current.mouja ?? '');
  final minController = TextEditingController(text: current.minAcre?.toString() ?? '');
  final maxController = TextEditingController(text: current.maxAcre?.toString() ?? '');

  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (ctx) {
      return Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 8,
          bottom: 16 + MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Filter', style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            TextField(
              controller: moujaController,
              decoration: const InputDecoration(labelText: 'Mouja (exact match)'),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: minController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Min land (acre)'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: maxController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Max land (acre)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      ref.read(farmerFilterProvider.notifier).clear();
                      Navigator.of(ctx).pop();
                    },
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      final min = double.tryParse(minController.text.trim());
                      final max = double.tryParse(maxController.text.trim());
                      ref.read(farmerFilterProvider.notifier).set(FarmerFilter(
                        mouja: moujaController.text.trim().isEmpty ? null : moujaController.text.trim(),
                        minAcre: min,
                        maxAcre: max,
                      ));
                      Navigator.of(ctx).pop();
                    },
                    child: const Text('Apply'),
                  ),
                ),
              ],
            ),
          ],
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
                _pill(context, Icons.place_rounded, farmer.villageOrMouza),
                _pill(context, Icons.landscape_rounded, '${farmer.area} acre'),
                _pill(context, Icons.shopping_bag_rounded, '₹${farmer.totalPrice.toStringAsFixed(0)}'),
              ],
            ),
            const SizedBox(height: 12),
            InfoLine(label: 'Aadhaar', value: farmer.aadharNo, icon: Icons.badge_rounded),
            const SizedBox(height: 6),
            InfoLine(label: 'Khata No', value: farmer.khataNo, icon: Icons.grid_on_rounded),
            const SizedBox(height: 6),
            InfoLine(label: 'Mobile', value: farmer.mobileNo, icon: Icons.call_rounded),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FilledButton.tonalIcon(
                    onPressed: () => context.pushNamed(
                      FarmerDetailsPage.routeName,
                      pathParameters: {'id': farmer.id},
                    ),
                    icon: const Icon(Icons.visibility_rounded),
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
          Icon(icon, size: 16, color: Colors.black.withValues(alpha: 0.6)),
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

