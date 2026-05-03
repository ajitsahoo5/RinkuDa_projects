import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/glass.dart';
import '../../../models/farmer.dart';
import '../../../models/fertilizer_type.dart';
import '../state/farmers_providers.dart';
import '../widgets/farmer_form.dart';

class EditFarmerPage extends ConsumerStatefulWidget {
  const EditFarmerPage({super.key, required this.farmerId});

  static const routeName = 'farmer_edit';
  static const routePath = '/farmer/:id/edit';

  final String farmerId;

  @override
  ConsumerState<EditFarmerPage> createState() => _EditFarmerPageState();
}

class _EditFarmerPageState extends ConsumerState<EditFarmerPage> {
  bool _saving = false;

  Future<void> _submitEdit(FarmerFormData data, Farmer farmer) async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      final updated = farmer.copyWith(
        slNo: data.slNo,
        dateOfPurchase: data.dateOfPurchase,
        landOwnerName: data.landOwnerName,
        villageOrMouza: data.villageOrMouza,
        khataNo: data.khataNo,
        area: data.area,
        farmerName: data.farmerName,
        aadharNo: data.aadharNo,
        mobileNo: data.mobileNo,
        cropsName: data.cropsName,
        fertilizers: data.fertilizers,
        cscProducts: data.cscProducts,
        seeds: data.seeds,
        pesticides: data.pesticides,
        remarks: data.remarks,
      );
      final repo = ref.read(farmersRepositoryProvider);
      final conflict =
          await repo.findConflictingFarmer(updated, excludeFarmerId: farmer.id);
      if (conflict != null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'This Aadhaar or mobile number is already used by '
              'SL No. ${conflict.slNo} (${conflict.farmerName}).',
            ),
            backgroundColor: Colors.orange.shade800,
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }
      await repo.upsertFarmer(updated);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved')));
      Navigator.of(context).maybePop();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final farmersAsync = ref.watch(farmersStreamProvider);
    Farmer? farmer;
    final list = farmersAsync.value;
    if (list != null) {
      for (final f in list) {
        if (f.id == widget.farmerId) {
          farmer = f;
          break;
        }
      }
    }

    return AppBackground(
      child: Scaffold(
        appBar: AppBar(title: const Text('Edit farmer')),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              if (farmersAsync.isLoading)
                GlassContainer(
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
              else if (farmer == null)
                GlassContainer(
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
                          onPressed: () => Navigator.of(context).maybePop(),
                          child: const Text('Back'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Builder(
                  builder: (context) {
                    final Farmer current = farmer!;
                    final fertilizerAsync = ref.watch(fertilizerCatalogProvider);
                    final cscProductsAsync = ref.watch(cscProductsCatalogProvider);
                    final seedsAsync = ref.watch(seedsCatalogProvider);
                    final pesticidesAsync = ref.watch(pesticidesCatalogProvider);
                    if (fertilizerAsync.isLoading ||
                        cscProductsAsync.isLoading ||
                        seedsAsync.isLoading ||
                        pesticidesAsync.isLoading) {
                      return GlassContainer(
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
                              Text('Loading catalog…'),
                            ],
                          ),
                        ),
                      );
                    }
                    final fertilizerList = fertilizerAsync.maybeWhen(
                      data: (v) => v,
                      orElse: () => const <FertilizerType>[],
                    );
                    final cscProductsList = cscProductsAsync.maybeWhen(
                      data: (v) => v,
                      orElse: () => const <FertilizerType>[],
                    );
                    final seedsList = seedsAsync.maybeWhen(
                      data: (v) => v,
                      orElse: () => const <FertilizerType>[],
                    );
                    final pesticidesList = pesticidesAsync.maybeWhen(
                      data: (v) => v,
                      orElse: () => const <FertilizerType>[],
                    );
                    return GlassContainer(
                      child: FarmerForm(
                        mode: FarmerFormMode.edit,
                        fertilizerDefinitions: mergeCatalogWithFarmerRows(
                          fertilizerList,
                          current,
                        ),
                        cscProductsDefinitions: mergeCscProductsCatalogWithFarmerRows(
                          cscProductsList,
                          current,
                        ),
                        seedDefinitions: mergeSeedsCatalogWithFarmerRows(
                          seedsList,
                          current,
                        ),
                        pesticideDefinitions: mergePesticidesCatalogWithFarmerRows(
                          pesticidesList,
                          current,
                        ),
                        initial: current,
                        isSubmitting: _saving,
                        onSubmit: (data) => _submitEdit(data, current),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

