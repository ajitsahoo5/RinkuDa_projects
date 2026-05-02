import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/glass.dart';
import '../../../models/farmer.dart';
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
    
    return AppBackground(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Register New Farmer'),
          centerTitle: true,
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios),
            onPressed: _saving ? null : () => Navigator.of(context).maybePop(),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: GlassContainer(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: FarmerForm(
                  mode: FarmerFormMode.create,
                  isSubmitting: _saving,
                  nextSlNumber: nextSlNo,
                  onSubmit: (data) => _handleSubmit(data),
                ),
              ),
            ),
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
        remarks: data.remarks,
      );
      
      await ref.read(farmersRepositoryProvider).upsertFarmer(farmer);
      
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

