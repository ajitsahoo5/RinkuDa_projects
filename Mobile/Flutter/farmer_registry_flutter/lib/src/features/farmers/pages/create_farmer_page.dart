import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/glass.dart';
import '../../../models/crop_catalog_entry.dart';
import '../../../models/farmer.dart';
import '../../../models/fertilizer_type.dart';
import '../state/farmers_providers.dart';
import '../widgets/farmer_form.dart';

class CreateFarmerPage extends ConsumerStatefulWidget {
  const CreateFarmerPage({super.key});

  static const routeName = 'farmer_create';
  static const routePath = '/farmer/new';

  @override
  ConsumerState<CreateFarmerPage> createState() => _CreateFarmerPageState();
}

class _CreateFarmerPageState extends ConsumerState<CreateFarmerPage> {
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    final nextSlNo = ref.watch(nextSlNumberProvider);
    final fertilizerAsync = ref.watch(fertilizerCatalogProvider);
    final cropAsync = ref.watch(cropCatalogProvider);
    final cscProductsAsync = ref.watch(cscProductsCatalogProvider);
    final seedsAsync = ref.watch(seedsCatalogProvider);
    final pesticidesAsync = ref.watch(pesticidesCatalogProvider);

    return AppBackground(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Register New Farmer'),
          centerTitle: true,
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            tooltip: 'Back',
            icon: const PhosphorIcon(PhosphorIconsBold.arrowLeft),
            onPressed: _saving ? null : () => Navigator.of(context).maybePop(),
          ),
        ),
        body: SafeArea(
          child: _buildCatalogBody(
            nextSlNo,
            fertilizerAsync,
            cropAsync,
            cscProductsAsync,
            seedsAsync,
            pesticidesAsync,
          ),
        ),
      ),
    );
  }

  Widget _buildCatalogBody(
    int nextSlNo,
    AsyncValue<List<FertilizerType>> fertilizerAsync,
    AsyncValue<List<CropCatalogEntry>> cropAsync,
    AsyncValue<List<FertilizerType>> cscProductsAsync,
    AsyncValue<List<FertilizerType>> seedsAsync,
    AsyncValue<List<FertilizerType>> pesticidesAsync,
  ) {
    if (fertilizerAsync.isLoading ||
        cropAsync.isLoading ||
        cscProductsAsync.isLoading ||
        seedsAsync.isLoading ||
        pesticidesAsync.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    final fertilizers = fertilizerAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <FertilizerType>[],
    );
    final crops = cropAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <CropCatalogEntry>[],
    );
    final cscProductsCatalog = cscProductsAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <FertilizerType>[],
    );
    final seeds = seedsAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <FertilizerType>[],
    );
    final pesticides = pesticidesAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <FertilizerType>[],
    );
    return _farmerCreateForm(nextSlNo, fertilizers, crops, cscProductsCatalog, seeds, pesticides);
  }

  Widget _farmerCreateForm(
    int nextSlNo,
    List<FertilizerType> fertilizerCatalog,
    List<CropCatalogEntry> cropCatalog,
    List<FertilizerType> cscProductsCatalog,
    List<FertilizerType> seedsCatalog,
    List<FertilizerType> pesticidesCatalog,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: GlassContainer(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: FarmerForm(
            mode: FarmerFormMode.create,
            fertilizerDefinitions: fertilizerCatalog,
            cscProductsDefinitions: cscProductsCatalog,
            seedDefinitions: seedsCatalog,
            pesticideDefinitions: pesticidesCatalog,
            cropDefinitions: cropCatalog,
            isSubmitting: _saving,
            nextSlNumber: nextSlNo,
            onSubmit: (data) => _handleSubmit(data),
          ),
        ),
      ),
    );
  }

  Future<void> _handleSubmit(FarmerFormData data) async {
    if (_saving) return;
    
    setState(() => _saving = true);
    
    try {
      final farmer = Farmer.create(
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
      final conflict = await repo.findConflictingFarmer(farmer);
      if (conflict != null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'This Aadhaar or mobile number is already registered '
              '(SL No. ${conflict.slNo}: ${conflict.farmerName}).',
            ),
            backgroundColor: Colors.orange.shade800,
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }

      await repo.upsertFarmer(farmer);
      
      if (!mounted) return;
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 8),
              Text('Farmer "${data.farmerName}" registered successfully!'),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          duration: const Duration(seconds: 3),
        ),
      );
      
      // Navigate back
      Navigator.of(context).maybePop();
    } catch (error) {
      if (!mounted) return;
      
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error, color: Colors.white),
              const SizedBox(width: 8),
              Expanded(child: Text('Failed to register farmer: $error')),
            ],
          ),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          duration: const Duration(seconds: 4),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

