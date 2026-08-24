import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/farmer_duplicates.dart';
import '../../../core/glass.dart';
import '../../../models/crop_catalog_entry.dart';
import '../../../models/village_mouza_catalog_entry.dart';
import '../../../models/farmer.dart';
import '../../../models/fertilizer_type.dart';
import '../state/farmers_providers.dart';
import '../state/farmers_repository.dart';
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
    final nextSlAsync = ref.watch(nextSlNumberProvider);
    final fertilizerAsync = ref.watch(fertilizerCatalogProvider);
    final cropAsync = ref.watch(cropCatalogProvider);
    final villageAsync = ref.watch(villageMouzaCatalogProvider);
    final cscProductsAsync = ref.watch(cscProductsCatalogProvider);
    final seedsAsync = ref.watch(seedsCatalogProvider);
    final pesticidesAsync = ref.watch(pesticidesCatalogProvider);
    final remarkAsync = ref.watch(remarkOptionsCatalogProvider);
    final farmersAsync = ref.watch(farmersListProvider);

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
            nextSlAsync,
            fertilizerAsync,
            cropAsync,
            villageAsync,
            cscProductsAsync,
            seedsAsync,
            pesticidesAsync,
            remarkAsync,
            farmersAsync,
          ),
        ),
      ),
    );
  }

  Widget _buildCatalogBody(
    AsyncValue<int> nextSlAsync,
    AsyncValue<List<FertilizerType>> fertilizerAsync,
    AsyncValue<List<CropCatalogEntry>> cropAsync,
    AsyncValue<List<VillageMouzaCatalogEntry>> villageAsync,
    AsyncValue<List<FertilizerType>> cscProductsAsync,
    AsyncValue<List<FertilizerType>> seedsAsync,
    AsyncValue<List<FertilizerType>> pesticidesAsync,
    AsyncValue<List<String>> remarkAsync,
    AsyncValue<List<Farmer>> farmersAsync,
  ) {
    if (nextSlAsync.isLoading ||
        fertilizerAsync.isLoading ||
        cropAsync.isLoading ||
        villageAsync.isLoading ||
        cscProductsAsync.isLoading ||
        seedsAsync.isLoading ||
        pesticidesAsync.isLoading ||
        remarkAsync.isLoading ||
        farmersAsync.isLoading) {
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
    final villages = villageAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <VillageMouzaCatalogEntry>[],
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
    final remarkOpts = remarkAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <String>[],
    );
    final existingFarmers = farmersAsync.maybeWhen(
      data: (v) => v,
      orElse: () => const <Farmer>[],
    );
    final nextSlNo = nextSlAsync.value ?? 1;
    return _farmerCreateForm(
      nextSlNo,
      fertilizers,
      crops,
      villages,
      cscProductsCatalog,
      seeds,
      pesticides,
      remarkOpts,
      existingFarmers,
    );
  }

  Widget _farmerCreateForm(
    int nextSlNo,
    List<FertilizerType> fertilizerCatalog,
    List<CropCatalogEntry> cropCatalog,
    List<VillageMouzaCatalogEntry> villageCatalog,
    List<FertilizerType> cscProductsCatalog,
    List<FertilizerType> seedsCatalog,
    List<FertilizerType> pesticidesCatalog,
    List<String> remarkOptions,
    List<Farmer> existingFarmers,
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
            villageMouzaDefinitions: villageCatalog,
            remarkOptions: remarkOptions,
            isSubmitting: _saving,
            nextSlNumber: nextSlNo,
            existingFarmers: existingFarmers,
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

      final existing = ref.read(farmersListProvider).value;
      if (existing == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Farmer list is still loading. Please wait and try again.'),
          ),
        );
        return;
      }

      final conflict = findConflictingFarmerInList(existing, farmer);
      if (conflict != null) {
        if (!mounted) return;
        await showFarmerSaveConflictAlert(
          context,
          draft: farmer,
          conflict: conflict,
        );
        return;
      }

      await ref.read(farmersRepositoryProvider).registerFarmerWithStockDeduction(farmer);
      await refreshFarmersAndCatalog(ref);

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
    } on InsufficientCatalogStockException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.inventory_2_outlined, color: Colors.white),
              const SizedBox(width: 8),
              Expanded(child: Text(e.message)),
            ],
          ),
          backgroundColor: Colors.deepOrange.shade800,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          duration: const Duration(seconds: 5),
        ),
      );
    } catch (error) {
      if (!mounted) return;

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

