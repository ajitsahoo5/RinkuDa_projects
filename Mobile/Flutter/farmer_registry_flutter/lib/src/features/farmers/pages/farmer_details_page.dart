import 'package:flutter/material.dart';

import '../../../core/farmer_file_export.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/glass.dart';
import '../../../models/farmer.dart';
import '../../../models/fertilizer_type.dart';
import '../state/farmers_providers.dart';
import '../widgets/info_line.dart';

class FarmerDetailsPage extends ConsumerWidget {
  const FarmerDetailsPage({super.key, required this.farmerId});

  static const routeName = 'farmer_details';
  static const routePath = '/farmer/:id';

  final String farmerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final farmersAsync = ref.watch(farmersStreamProvider);
    Farmer? farmer;
    final list = farmersAsync.value;
    if (list != null) {
      for (final f in list) {
        if (f.id == farmerId) {
          farmer = f;
          break;
        }
      }
    }

    return AppBackground(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Details'),
          // Edit/delete disabled — users may only register new farmers.
          // actions: [
          //   IconButton(
          //     tooltip: 'Edit',
          //     onPressed: farmer == null
          //         ? null
          //         : () => context.pushNamed(
          //               EditFarmerPage.routeName,
          //               pathParameters: {'id': farmer!.id},
          //             ),
          //     icon: const Icon(Icons.edit_rounded),
          //   ),
          // ],
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            child: farmersAsync.isLoading
                ? GlassContainer(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 22),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 12),
                          Text('Loading…'),
                        ],
                      ),
                    ),
                  )
                : farmersAsync.hasError
                    ? GlassContainer(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          child: Column(
                            children: [
                              PhosphorIcon(PhosphorIconsBold.cloudSlash,
                                  size: 36, color: Colors.black.withValues(alpha: 0.45)),
                              const SizedBox(height: 10),
                              Text(
                                'Couldn’t load from Firebase',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w900),
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
                    : farmer == null
                ? GlassContainer(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Column(
                        children: [
                          PhosphorIcon(PhosphorIconsBold.warning, size: 36, color: Colors.black.withValues(alpha: 0.45)),
                          const SizedBox(height: 10),
                          Text(
                            'Farmer not found',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 8),
                          FilledButton(
                            onPressed: () => context.pop(),
                            child: const Text('Back'),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    children: [
                      GlassContainer(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              farmer.farmerName,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'SL No: ${farmer.slNo} • Village: ${farmer.villageOrMouza}',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.black.withValues(alpha: 0.65),
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            const SizedBox(height: 14),
                            _sectionTitle(context, 'Basic Information'),
                            const SizedBox(height: 10),
                            InfoLine(label: 'Date of Purchase', value: farmer.dateOfPurchase.toString().split(' ')[0], icon: PhosphorIconsBold.calendarBlank),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Land Owner', value: farmer.landOwnerName, icon: PhosphorIconsBold.user),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Village/Mouza', value: farmer.villageOrMouza, icon: PhosphorIconsBold.city),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Khata No', value: farmer.khataNo, icon: PhosphorIconsBold.mapTrifold),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Area', value: '${farmer.area}', icon: PhosphorIconsBold.mountains),
                            const SizedBox(height: 14),
                            _sectionTitle(context, 'Farmer Details'),
                            const SizedBox(height: 10),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: InfoLine(
                                    label: 'Aadhaar No',
                                    value: farmer.aadharNo,
                                    icon: PhosphorIconsBold.identificationCard,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: InfoLine(
                                    label: 'Mobile No',
                                    value: farmer.mobileNo,
                                    icon: PhosphorIconsBold.phone,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Crops', value: farmer.cropsName, icon: PhosphorIconsBold.plant),
                            const SizedBox(height: 14),
                            _sectionTitle(context, 'Fertilizer Supply'),
                            const SizedBox(height: 10),
                            // Show all fertilizers
                            ...farmer.fertilizers.where((f) => f.amount > 0 || f.price > 0).map((fertilizer) => 
                              Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: _supplyDetailRow(fertilizer),
                              )
                            ),
                            if (farmer.cscProducts.any((x) => x.amount > 0 || x.price > 0)) ...[
                              const SizedBox(height: 14),
                              _sectionTitle(context, 'CSC Products'),
                              const SizedBox(height: 10),
                              ...farmer.cscProducts.where((x) => x.amount > 0 || x.price > 0).map((item) =>
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: _supplyDetailRow(item),
                                ),
                              ),
                            ],
                            if (farmer.seeds.any((x) => x.amount > 0 || x.price > 0)) ...[
                              const SizedBox(height: 14),
                              _sectionTitle(context, 'Seeds'),
                              const SizedBox(height: 10),
                              ...farmer.seeds.where((x) => x.amount > 0 || x.price > 0).map((item) =>
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: _supplyDetailRow(item),
                                ),
                              ),
                            ],
                            if (farmer.pesticides.any((x) => x.amount > 0 || x.price > 0)) ...[
                              const SizedBox(height: 14),
                              _sectionTitle(context, 'Pesticides'),
                              const SizedBox(height: 10),
                              ...farmer.pesticides.where((x) => x.amount > 0 || x.price > 0).map((item) =>
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: _supplyDetailRow(item),
                                ),
                              ),
                            ],
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Theme.of(context).primaryColor,
                                    Theme.of(context).primaryColor.withValues(alpha: 0.8),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: InfoLine(
                                label: 'Total Price',
                                value: '₹${farmer.totalPrice.toStringAsFixed(2)}',
                                icon: PhosphorIconsBold.currencyInr,
                                isHighlighted: true,
                              ),
                            ),
                            if (farmer.remarks.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              _sectionTitle(context, 'Remarks'),
                              const SizedBox(height: 10),
                              InfoLine(label: 'Notes', value: farmer.remarks, icon: PhosphorIconsBold.notePencil),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      GlassContainer(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Download invoice',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Share or save as PDF or Microsoft Word (.docx).',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.black.withValues(alpha: 0.55),
                                  ),
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: FilledButton.tonalIcon(
                                    onPressed: () async {
                                      FocusManager.instance.primaryFocus?.unfocus();
                                      try {
                                        await shareFarmerInvoicePdf(farmer!);
                                      } catch (e, st) {
                                        assert(() {
                                          debugPrint('$e\n$st');
                                          return true;
                                        }());
                                        if (!context.mounted) return;
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text('Could not create PDF: $e')),
                                        );
                                      }
                                    },
                                    icon: const PhosphorIcon(PhosphorIconsBold.filePdf),
                                    label: const Text('PDF'),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: FilledButton.tonalIcon(
                                    onPressed: () async {
                                      FocusManager.instance.primaryFocus?.unfocus();
                                      try {
                                        await shareFarmerInvoiceDocx(farmer!);
                                      } catch (e, st) {
                                        assert(() {
                                          debugPrint('$e\n$st');
                                          return true;
                                        }());
                                        if (!context.mounted) return;
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text('Could not create Word file: $e')),
                                        );
                                      }
                                    },
                                    icon: const PhosphorIcon(PhosphorIconsBold.microsoftWordLogo),
                                    label: const Text('Word (.docx)'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Edit/delete disabled — users may only register new farmers.
                      // const SizedBox(height: 14),
                      // GlassContainer(
                      //   child: Row(
                      //     children: [
                      //       Expanded(
                      //         child: FilledButton.icon(
                      //           onPressed: () => context.pushNamed(
                      //             EditFarmerPage.routeName,
                      //             pathParameters: {'id': farmer!.id},
                      //           ),
                      //           icon: const Icon(Icons.edit_rounded),
                      //           label: const Text('Edit'),
                      //         ),
                      //       ),
                      //       const SizedBox(width: 10),
                      //       Expanded(
                      //         child: FilledButton.icon(
                      //           onPressed: () async {
                      //             final ok = await showDialog<bool>(
                      //               context: context,
                      //               builder: (ctx) => AlertDialog(
                      //                 title: const Text('Delete farmer?'),
                      //                 content: Text('This will remove "${farmer!.farmerName}" permanently.'),
                      //                 actions: [
                      //                   TextButton(
                      //                     onPressed: () => Navigator.of(ctx).pop(false),
                      //                     child: const Text('Cancel'),
                      //                   ),
                      //                   FilledButton(
                      //                     onPressed: () => Navigator.of(ctx).pop(true),
                      //                     style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
                      //                     child: const Text('Delete'),
                      //                   ),
                      //                 ],
                      //               ),
                      //             );
                      //             if (ok != true) return;
                      //             await ref.read(farmersRepositoryProvider).deleteFarmer(farmer!.id);
                      //             if (!context.mounted) return;
                      //             context.pop();
                      //           },
                      //           icon: const Icon(Icons.delete_rounded),
                      //           label: const Text('Delete'),
                      //           style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
                      //         ),
                      //       ),
                      //     ],
                      //   ),
                      // ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(BuildContext context, String t) {
    return Text(
      t,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w900,
            color: Colors.black.withValues(alpha: 0.7),
          ),
    );
  }

  Widget _supplyDetailRow(FertilizerType row) {
    final unitLower = row.unit.trim().isEmpty ? 'kg' : row.unit.trim().toLowerCase();
    final amt = row.amount;
    final amtStr = amt == amt.roundToDouble() ? amt.round().toString() : amt.toStringAsFixed(2);

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              row.name,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text('$amtStr $unitLower'),
          ),
          Expanded(
            flex: 2,
            child: Text('₹${row.price}/$unitLower'),
          ),
          Expanded(
            flex: 3,
            child: Text(
              '₹${row.totalCost.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.w600),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

