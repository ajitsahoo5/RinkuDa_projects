import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/glass.dart';
import '../../../models/farmer.dart';
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
                              Icon(Icons.cloud_off_rounded,
                                  size: 34, color: Colors.black.withValues(alpha: 0.5)),
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
                          Icon(Icons.warning_amber_rounded, size: 34, color: Colors.black.withValues(alpha: 0.5)),
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
                            InfoLine(label: 'Date of Purchase', value: farmer.dateOfPurchase.toString().split(' ')[0], icon: Icons.calendar_today),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Land Owner', value: farmer.landOwnerName, icon: Icons.person_outline),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Village/Mouza', value: farmer.villageOrMouza, icon: Icons.location_city),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Khata No', value: farmer.khataNo, icon: Icons.map),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Area', value: '${farmer.area}', icon: Icons.crop_landscape),
                            const SizedBox(height: 14),
                            _sectionTitle(context, 'Farmer Details'),
                            const SizedBox(height: 10),
                            InfoLine(label: 'Aadhaar No', value: farmer.aadharNo, icon: Icons.credit_card),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Mobile No', value: farmer.mobileNo, icon: Icons.phone),
                            const SizedBox(height: 8),
                            InfoLine(label: 'Crops', value: farmer.cropsName, icon: Icons.grass),
                            const SizedBox(height: 14),
                            _sectionTitle(context, 'Fertilizer Supply'),
                            const SizedBox(height: 10),
                            // Show all fertilizers
                            ...farmer.fertilizers.where((f) => f.amount > 0 || f.price > 0).map((fertilizer) => 
                              Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: _fertilizerDetailRow(fertilizer.name, fertilizer.amount, fertilizer.price),
                              )
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Theme.of(context).primaryColor,
                                    Theme.of(context).primaryColor.withOpacity(0.8),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: InfoLine(
                                label: 'Total Price',
                                value: '₹${farmer.totalPrice.toStringAsFixed(2)}',
                                icon: Icons.currency_rupee,
                                isHighlighted: true,
                              ),
                            ),
                            if (farmer.remarks.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              _sectionTitle(context, 'Remarks'),
                              const SizedBox(height: 10),
                              InfoLine(label: 'Notes', value: farmer.remarks, icon: Icons.note),
                            ],
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

  Widget _fertilizerDetailRow(String name, double amount, double price) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.05),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              name,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text('${amount} Kg'),
          ),
          Expanded(
            flex: 2,
            child: Text('₹${price}/Kg'),
          ),
          Expanded(
            flex: 3,
            child: Text(
              '₹${(amount * price).toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.w600),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

