import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../models/crop_catalog_entry.dart';
import '../../../models/fertilizer_type.dart';
import '../../../models/farmer.dart';

class FarmerFormData {
  FarmerFormData({
    required this.slNo,
    required this.dateOfPurchase,
    required this.landOwnerName,
    required this.villageOrMouza,
    required this.khataNo,
    required this.area,
    required this.farmerName,
    required this.aadharNo,
    required this.mobileNo,
    required this.cropsName,
    required this.fertilizers,
    required this.remarks,
  });

  final int slNo;
  final DateTime dateOfPurchase;
  final String landOwnerName;
  final String villageOrMouza;
  final String khataNo;
  final double area;
  final String farmerName;
  final String aadharNo;
  final String mobileNo;
  final String cropsName;
  final List<FertilizerType> fertilizers;
  final String remarks;
}

class FarmerForm extends StatefulWidget {
  const FarmerForm({
    super.key,
    required this.mode,
    required this.fertilizerDefinitions,
    this.cropDefinitions = const [],
    required this.onSubmit,
    this.initial,
    this.isSubmitting = false,
    this.submitLabel,
    this.nextSlNumber,
  });

  final FarmerFormMode mode;
  /// Rows from Firestore catalog (merged with legacy farmer rows when editing).
  final List<FertilizerType> fertilizerDefinitions;
  /// `settings/catalog` → `crops`. Used as a dropdown in [FarmerFormMode.create] only.
  final List<CropCatalogEntry> cropDefinitions;
  final Farmer? initial;
  final bool isSubmitting;
  final String? submitLabel;
  final int? nextSlNumber;
  final Future<void> Function(FarmerFormData data) onSubmit;

  @override
  State<FarmerForm> createState() => _FarmerFormState();
}

enum FarmerFormMode { create, edit }

/// One fertilizer line on the create form (catalog id + quantity).
class _CreateFertilizerLine {
  _CreateFertilizerLine({required this.catalogId, required this.amount});

  final String catalogId;
  double amount;
}

class _FarmerFormState extends State<FarmerForm> {
  final _formKey = GlobalKey<FormState>();

  /// Crop catalog selection (create flow only); [FarmerFormData.cropsName] mirrors the picked name.
  String? _selectedCropId;

  bool get _useCropDropdown =>
      widget.mode == FarmerFormMode.create && widget.cropDefinitions.isNotEmpty;

  late final TextEditingController _slNo;
  late final TextEditingController _dateOfPurchase;
  late final TextEditingController _landOwnerName;
  late final TextEditingController _villageOrMouza;
  late final TextEditingController _khataNo;
  late final TextEditingController _area;
  late final TextEditingController _farmerName;
  late final TextEditingController _aadharNo;
  late final TextEditingController _mobileNo;
  late final TextEditingController _cropsName;
  // Fertilizer controllers stored in maps for easier management
  late Map<String, TextEditingController> _fertilizerAmountControllers;
  late Map<String, TextEditingController> _fertilizerPriceControllers;
  late List<FertilizerType> _availableFertilizers;
  late final TextEditingController _totalPrice;
  late final TextEditingController _remarks;

  /// Create mode: picked fertilizers with amounts (edit mode uses controller maps).
  final List<_CreateFertilizerLine> _createFertilizerLines = [];
  String? _selectedAddFertilizerId;
  TextEditingController? _addFertilizerAmount;

  @override
  void initState() {
    super.initState();
    final f = widget.initial;

    _availableFertilizers = List<FertilizerType>.from(widget.fertilizerDefinitions);
    
    // Initialize basic controllers
    _slNo = TextEditingController(text: f?.slNo.toString() ?? widget.nextSlNumber?.toString() ?? '1');
    _dateOfPurchase = TextEditingController(text: f?.dateOfPurchase.toString().split(' ')[0] ?? DateTime.now().toString().split(' ')[0]);
    _landOwnerName = TextEditingController(text: f?.landOwnerName ?? '');
    _villageOrMouza = TextEditingController(text: f?.villageOrMouza ?? '');
    _khataNo = TextEditingController(text: f?.khataNo ?? '');
    _area = TextEditingController(text: f == null ? '' : (f.area == 0 ? '' : f.area.toString()));
    _farmerName = TextEditingController(text: f?.farmerName ?? '');
    _aadharNo = TextEditingController(text: f?.aadharNo ?? '');
    _mobileNo = TextEditingController(text: f?.mobileNo ?? '');
    _cropsName = TextEditingController(text: _useCropDropdown ? '' : (f?.cropsName ?? ''));
    _selectedCropId = null;
    _totalPrice = TextEditingController(text: '');
    _remarks = TextEditingController(text: f?.remarks ?? '');

    if (widget.mode == FarmerFormMode.create) {
      _addFertilizerAmount = TextEditingController();
    }

    // Initialize fertilizer controllers
    _initializeFertilizerControllers(f);

    // Add listeners for automatic calculation
    _addCalculationListeners();
    if (widget.mode == FarmerFormMode.create) {
      _calculateTotals();
    }
  }

  void _initializeFertilizerControllers(Farmer? farmer) {
    _fertilizerAmountControllers = {};
    _fertilizerPriceControllers = {};

    if (widget.mode == FarmerFormMode.create) {
      return;
    }

    for (final fertilizer in _availableFertilizers) {
      final existingFertilizer = farmer?.getFertilizerById(fertilizer.id);

      _fertilizerAmountControllers[fertilizer.id] = TextEditingController(
        text: existingFertilizer == null
            ? ''
            : (existingFertilizer.amount == 0 ? '' : existingFertilizer.amount.toString()),
      );

      _fertilizerPriceControllers[fertilizer.id] = TextEditingController(
        text: _initialPriceText(farmer, existingFertilizer, fertilizer),
      );
    }
  }

  String _initialPriceText(Farmer? farmer, FertilizerType? existingFertilizer, FertilizerType definitionRow) {
    if (existingFertilizer != null) {
      return existingFertilizer.price == 0 ? '' : existingFertilizer.price.toString();
    }
    if (farmer == null && definitionRow.price > 0) {
      return definitionRow.price == definitionRow.price.roundToDouble()
          ? definitionRow.price.round().toString()
          : definitionRow.price.toString();
    }
    return '';
  }

  void _disposeFertilizerControllersOnly() {
    for (final c in _fertilizerAmountControllers.values) {
      c.dispose();
    }
    for (final c in _fertilizerPriceControllers.values) {
      c.dispose();
    }
    _fertilizerAmountControllers.clear();
    _fertilizerPriceControllers.clear();
  }

  @override
  void didUpdateWidget(covariant FarmerForm oldWidget) {
    super.didUpdateWidget(oldWidget);

    final cropsChanged =
        !cropCatalogMatches(oldWidget.cropDefinitions, widget.cropDefinitions);

    final defsChanged =
        !fertilizerDefinitionsMatch(oldWidget.fertilizerDefinitions, widget.fertilizerDefinitions);

    if (cropsChanged) {
      final ids = {for (final c in widget.cropDefinitions) c.id};
      if (_selectedCropId != null && !ids.contains(_selectedCropId)) {
        _selectedCropId = null;
        if (_useCropDropdown) _cropsName.clear();
      }
    }

    if (defsChanged) {
      _disposeFertilizerControllersOnly();
      _availableFertilizers = List<FertilizerType>.from(widget.fertilizerDefinitions);
      if (widget.mode == FarmerFormMode.create) {
        _createFertilizerLines.removeWhere(
          (line) => !_availableFertilizers.any((d) => d.id == line.catalogId),
        );
        if (_selectedAddFertilizerId != null &&
            !_availableFertilizers.any((d) => d.id == _selectedAddFertilizerId)) {
          _selectedAddFertilizerId = null;
        }
        _calculateTotals();
      } else {
        _initializeFertilizerControllers(widget.initial);
        _addCalculationListeners();
        _calculateTotals();
      }
    }

    final farmerChanged = oldWidget.initial?.id != widget.initial?.id;
    if (!farmerChanged) return;

    final f = widget.initial;
    _slNo.text = f?.slNo.toString() ?? widget.nextSlNumber?.toString() ?? '1';
    _dateOfPurchase.text = f?.dateOfPurchase.toString().split(' ')[0] ?? DateTime.now().toString().split(' ')[0];
    _landOwnerName.text = f?.landOwnerName ?? '';
    _villageOrMouza.text = f?.villageOrMouza ?? '';
    _khataNo.text = f?.khataNo ?? '';
    _area.text = f == null ? '' : (f.area == 0 ? '' : f.area.toString());
    _farmerName.text = f?.farmerName ?? '';
    _aadharNo.text = f?.aadharNo ?? '';
    _mobileNo.text = f?.mobileNo ?? '';
    if (_useCropDropdown) {
      _selectedCropId = null;
      _cropsName.text = '';
    } else {
      _cropsName.text = f?.cropsName ?? '';
    }
    _totalPrice.text = '';
    _remarks.text = f?.remarks ?? '';

    if (defsChanged) return;

    for (final fertilizer in _availableFertilizers) {
      final existingFertilizer = f?.getFertilizerById(fertilizer.id);
      _fertilizerAmountControllers[fertilizer.id]?.text = existingFertilizer == null
          ? ''
          : (existingFertilizer.amount == 0 ? '' : existingFertilizer.amount.toString());
      _fertilizerPriceControllers[fertilizer.id]?.text =
          _initialPriceText(f, existingFertilizer, fertilizer);
    }
    _calculateTotals();
  }

  @override
  void dispose() {
    _slNo.dispose();
    _dateOfPurchase.dispose();
    _landOwnerName.dispose();
    _villageOrMouza.dispose();
    _khataNo.dispose();
    _area.dispose();
    _farmerName.dispose();
    _aadharNo.dispose();
    _mobileNo.dispose();
    _cropsName.dispose();
    _totalPrice.dispose();
    _remarks.dispose();

    _addFertilizerAmount?.dispose();
    
    _disposeFertilizerControllersOnly();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final submitText = widget.submitLabel ??
        (widget.mode == FarmerFormMode.create ? 'Register Farmer' : 'Update Farmer');

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Theme.of(context).primaryColor.withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                PhosphorIcon(
                  widget.mode == FarmerFormMode.create ? PhosphorIconsBold.userPlus : PhosphorIconsBold.user,
                  color: Theme.of(context).primaryColor,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Text(
                  widget.mode == FarmerFormMode.create ? 'New Farmer Registration' : 'Update Farmer Information',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Basic Information Section
          _sectionHeader('Basic Information', PhosphorIconsBold.info),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                flex: 1,
                child: _field(
                  controller: _slNo,
                  label: 'SL No (Auto)',
                  keyboardType: TextInputType.number,
                  prefixIcon: PhosphorIconsBold.hash,
                  readOnly: true,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 2,
                child: _dateField(
                  controller: _dateOfPurchase,
                  label: 'Date of Purchase *',
                  prefixIcon: PhosphorIconsBold.calendarBlank,
                  validator: _validateRequired,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Land Owner & Location Section
          _sectionHeader('Land Owner & Location', PhosphorIconsBold.mapPin),
          const SizedBox(height: 16),
          _field(
            controller: _landOwnerName,
            label: 'Land Owner Name *',
            prefixIcon: PhosphorIconsBold.user,
            validator: _validateRequired,
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _field(
                  controller: _villageOrMouza,
                  label: 'Village/Mouza *',
                  prefixIcon: PhosphorIconsBold.city,
                  validator: _validateRequired,
                  textCapitalization: TextCapitalization.words,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _field(
                  controller: _khataNo,
                  label: 'Khata No',
                  prefixIcon: PhosphorIconsBold.mapTrifold,
                  textCapitalization: TextCapitalization.characters,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _field(
            controller: _area,
            label: 'Area (in decimals/acres) *',
            hintText: 'Enter area (e.g., 2.5)',
            prefixIcon: PhosphorIconsBold.mountains,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: _validateDecimal,
          ),
          const SizedBox(height: 24),

          // Farmer Information Section
          _sectionHeader('Farmer Information', PhosphorIconsBold.userRectangle),
          const SizedBox(height: 16),
          _field(
            controller: _farmerName,
            label: 'Farmer Name *',
            prefixIcon: PhosphorIconsBold.userCircle,
            validator: _validateRequired,
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _field(
                  controller: _aadharNo,
                  label: 'Aadhaar Number',
                  hintText: '1234 5678 9012',
                  prefixIcon: PhosphorIconsBold.identificationCard,
                  keyboardType: TextInputType.number,
                  validator: _validateAadhaar,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _field(
                  controller: _mobileNo,
                  label: 'Mobile No',
                  hintText: '98XXXXXXXX',
                  prefixIcon: PhosphorIconsBold.phone,
                  keyboardType: TextInputType.phone,
                  validator: _validatePhone,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._cropFieldWidgets(context),
          const SizedBox(height: 24),

          // Fertilizer Supply Information
          _sectionHeader('Fertilizers', PhosphorIconsBold.plant),
          const SizedBox(height: 16),
          if (_availableFertilizers.isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                'No fertilizer types in the catalog. Add them in Firestore on document '
                'settings/catalog, field fertilizers (each entry: id, name, price; optional unit such as bag or kg).',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.72),
                    ),
              ),
            )
          else ...[
            if (widget.mode == FarmerFormMode.create)
              _buildCreateFertilizerSection()
            else ...[
              ..._buildFertilizerRows(),
            ],
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).primaryColor.withOpacity(0.1),
                    Theme.of(context).primaryColor.withOpacity(0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Theme.of(context).primaryColor.withOpacity(0.3),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      PhosphorIcon(PhosphorIconsBold.currencyInr, color: Theme.of(context).primaryColor),
                      const SizedBox(width: 8),
                      Text(
                        'Total Price Summary',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _field(
                    controller: _totalPrice,
                    label: 'Total Price (₹)',
                    hintText: 'Auto-calculated',
                    prefixIcon: PhosphorIconsBold.currencyInr,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: _validateAmount,
                    readOnly: true,
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),

          // Additional Information
          _sectionHeader('Additional Information', PhosphorIconsBold.notebook),
          const SizedBox(height: 16),
          _field(
            controller: _remarks,
            label: 'Remarks',
            hintText: 'Any additional notes...',
            prefixIcon: PhosphorIconsBold.notePencil,
            maxLines: 3,
          ),
          const SizedBox(height: 32),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: widget.isSubmitting ? null : () => Navigator.of(context).maybePop(),
                  icon: const PhosphorIcon(PhosphorIconsBold.xCircle),
                  label: const Text('Cancel'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 2,
                child: FilledButton.icon(
                  onPressed: widget.isSubmitting ? null : _submit,
                  icon: widget.isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : PhosphorIcon(
                          widget.mode == FarmerFormMode.create ? PhosphorIconsBold.userPlus : PhosphorIconsBold.floppyDisk,
                          color: Colors.white,
                        ),
                  label: Text(widget.isSubmitting ? 'Saving...' : submitText),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String? _resolvedCropDropdownValue() {
    final id = _selectedCropId;
    if (id == null) return null;
    if (!widget.cropDefinitions.any((c) => c.id == id)) return null;
    return id;
  }

  List<Widget> _cropFieldWidgets(BuildContext context) {
    if (_useCropDropdown) {
      return [_cropDropdownField(context)];
    }
    return [
      _field(
        controller: _cropsName,
        label: 'Crops Name',
        hintText: 'e.g., Rice, Wheat, Vegetables',
        prefixIcon: PhosphorIconsBold.plant,
        textCapitalization: TextCapitalization.words,
      ),
    ];
  }

  Widget _cropDropdownField(BuildContext context) {
    return DropdownButtonFormField<String>(
      // ignore: deprecated_member_use — selection must stay tied to `_selectedCropId` / `_cropsName` for validation.
      value: _resolvedCropDropdownValue(),
      isExpanded: true,
      decoration: InputDecoration(
        labelText: 'Crop *',
        hint: const Text('Select crop'),
        prefixIcon: const PhosphorIcon(PhosphorIconsBold.plant),
        border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        enabledBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(
            color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: Theme.of(context).primaryColor, width: 2),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: Colors.red),
        ),
        focusedErrorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: Colors.red, width: 2),
        ),
        filled: true,
        fillColor: Theme.of(context).colorScheme.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      items: [
        for (final c in widget.cropDefinitions)
          DropdownMenuItem<String>(value: c.id, child: Text(c.name)),
      ],
      onChanged: widget.isSubmitting
          ? null
          : (String? id) {
              setState(() {
                _selectedCropId = id;
                CropCatalogEntry? picked;
                for (final c in widget.cropDefinitions) {
                  if (c.id == id) {
                    picked = c;
                    break;
                  }
                }
                _cropsName.text = picked?.name ?? '';
              });
            },
      validator: (String? id) =>
          id == null || id.isEmpty ? 'Select a crop' : null,
    );
  }

  Widget _sectionHeader(String title, IconData icon) {
    return Row(
      children: [
        PhosphorIcon(icon, size: 20, color: Theme.of(context).primaryColor),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: Theme.of(context).primaryColor,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Divider(
            color: Theme.of(context).primaryColor.withOpacity(0.3),
          ),
        ),
      ],
    );
  }

  Widget _dateField({
    required TextEditingController controller,
    required String label,
    String? Function(String?)? validator,
    IconData? prefixIcon,
  }) {
    return GestureDetector(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (date != null) {
          controller.text = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
        }
      },
      child: AbsorbPointer(
        child: _field(
          controller: controller,
          label: label,
          prefixIcon: prefixIcon,
          validator: validator,
        ),
      ),
    );
  }

  Widget _fertilizerRow(
    FertilizerType fertilizer,
    TextEditingController amountController,
    TextEditingController priceController,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PhosphorIcon(icon, size: 20, color: Theme.of(context).primaryColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  fertilizer.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              ListenableBuilder(
                listenable: priceController,
                builder: (context, _) {
                  final raw = priceController.text.trim();
                  return Text(
                    raw.isEmpty ? '—' : '₹$raw',
                    textAlign: TextAlign.right,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          _field(
            controller: amountController,
            label: fertilizer.amountFieldLabel,
            hintText: 'Enter amount',
            prefixIcon: PhosphorIconsBold.scales,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: _validateAmount,
          ),
        ],
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    String? hintText,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    IconData? prefixIcon,
    TextCapitalization textCapitalization = TextCapitalization.none,
    int maxLines = 1,
    bool readOnly = false,
    bool enableInteractiveSelection = true,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      textInputAction: maxLines > 1 ? TextInputAction.newline : TextInputAction.next,
      textCapitalization: textCapitalization,
      maxLines: maxLines,
      readOnly: readOnly,
      enableInteractiveSelection: enableInteractiveSelection,
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        prefixIcon: prefixIcon != null ? PhosphorIcon(prefixIcon, size: 22) : null,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(
            color: Theme.of(context).primaryColor,
            width: 2,
          ),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: Colors.red),
        ),
        focusedErrorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: Colors.red, width: 2),
        ),
        filled: true,
        fillColor: Theme.of(context).colorScheme.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  // Validation methods
  String? _validateRequired(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'This field is required';
    }
    return null;
  }

  String? _validateNumber(String? value) {
    if (value != null && value.isNotEmpty) {
      if (int.tryParse(value.trim()) == null) {
        return 'Please enter a valid number';
      }
    }
    return null;
  }

  String? _validateDecimal(String? value) {
    if (value != null && value.isNotEmpty) {
      final doubleValue = double.tryParse(value.trim());
      if (doubleValue == null) {
        return 'Please enter a valid decimal number';
      }
      if (doubleValue <= 0) {
        return 'Land area must be greater than 0';
      }
    }
    return null;
  }

  String? _validateAadhaar(String? value) {
    if (value != null && value.isNotEmpty) {
      final cleaned = value.replaceAll(' ', '').replaceAll('-', '');
      if (cleaned.length != 12 || !RegExp(r'^\d+$').hasMatch(cleaned)) {
        return 'Please enter a valid 12-digit Aadhaar number';
      }
    }
    return null;
  }

  String? _validatePhone(String? value) {
    if (value != null && value.isNotEmpty) {
      final cleaned = value.replaceAll(' ', '').replaceAll('-', '').replaceAll('(', '').replaceAll(')', '');
      if (!RegExp(r'^[6-9]\d{9}$').hasMatch(cleaned)) {
        return 'Please enter a valid 10-digit mobile number';
      }
    }
    return null;
  }

  String? _validateAmount(String? value) {
    if (value != null && value.isNotEmpty) {
      final doubleValue = double.tryParse(value.trim());
      if (doubleValue == null) {
        return 'Please enter a valid amount';
      }
      if (doubleValue < 0) {
        return 'Amount cannot be negative';
      }
    }
    return null;
  }

  void _addCalculationListeners() {
    if (widget.mode == FarmerFormMode.create) return;
    for (final controller in _fertilizerAmountControllers.values) {
      controller.addListener(_calculateTotals);
    }
    for (final controller in _fertilizerPriceControllers.values) {
      controller.addListener(_calculateTotals);
    }
  }

  FertilizerType? _definitionForId(String id) {
    for (final d in _availableFertilizers) {
      if (d.id == id) return d;
    }
    return null;
  }

  String? _resolvedAddFertilizerDropdownValue() {
    final id = _selectedAddFertilizerId;
    if (id == null) return null;
    if (!_availableFertilizers.any((d) => d.id == id)) return null;
    if (_createFertilizerLines.any((l) => l.catalogId == id)) return null;
    return id;
  }

  void _calculateTotals() {
    if (widget.mode == FarmerFormMode.create) {
      double totalPrice = 0.0;
      for (final line in _createFertilizerLines) {
        final def = _definitionForId(line.catalogId);
        if (def == null) continue;
        totalPrice += line.amount * def.price;
      }
      _totalPrice.text = totalPrice > 0 ? totalPrice.toStringAsFixed(2) : '';
      return;
    }

    double totalPrice = 0.0;

    for (final fertilizer in _availableFertilizers) {
      final amountText = _fertilizerAmountControllers[fertilizer.id]?.text ?? '';
      final priceText = _fertilizerPriceControllers[fertilizer.id]?.text ?? '';
      
      final amount = amountText.isEmpty ? 0.0 : (double.tryParse(amountText) ?? 0.0);
      final price = priceText.isEmpty ? 0.0 : (double.tryParse(priceText) ?? 0.0);
      
      totalPrice += (amount * price);
    }

    if (totalPrice > 0) {
      _totalPrice.text = totalPrice.toStringAsFixed(2);
    } else {
      _totalPrice.text = '';
    }
  }

  void _addSelectedFertilizerLine() {
    final id = _selectedAddFertilizerId;
    final amountCtrl = _addFertilizerAmount;
    if (id == null || amountCtrl == null) return;

    final text = amountCtrl.text.trim();
    final amount = double.tryParse(text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Enter a valid amount greater than zero.'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Colors.orange.shade800,
        ),
      );
      return;
    }

    setState(() {
      _createFertilizerLines.add(_CreateFertilizerLine(catalogId: id, amount: amount));
      _selectedAddFertilizerId = null;
      amountCtrl.clear();
      _calculateTotals();
    });
  }

  Future<void> _editCreateFertilizerLine(int index) async {
    if (index < 0 || index >= _createFertilizerLines.length) return;
    final line = _createFertilizerLines[index];
    final def = _definitionForId(line.catalogId);
    if (def == null) return;

    final controller = TextEditingController(
      text: line.amount == 0 ? '' : _formatAmountForField(line.amount),
    );
    double? saved;
    try {
      saved = await showDialog<double>(
        context: context,
        builder: (ctx) {
          return AlertDialog(
            title: Text('Edit amount — ${def.name}'),
            content: TextField(
              controller: controller,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: def.amountFieldLabel,
                border: const OutlineInputBorder(),
              ),
              autofocus: true,
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () {
                  final v = double.tryParse(controller.text.trim());
                  if (v == null || v < 0) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: const Text('Enter a valid amount.'),
                        backgroundColor: Colors.orange.shade800,
                      ),
                    );
                    return;
                  }
                  Navigator.of(ctx).pop(v);
                },
                child: const Text('Save'),
              ),
            ],
          );
        },
      );
    } finally {
      // Dispose after the dialog route and IME have finished detaching; disposing
      // synchronously after `await showDialog` races the TextField and causes
      // "TextEditingController was used after being disposed."
      WidgetsBinding.instance.addPostFrameCallback((_) {
        controller.dispose();
      });
    }

    if (!mounted || saved == null) return;
    setState(() {
      _createFertilizerLines[index].amount = saved!;
      _calculateTotals();
    });
  }

  void _removeCreateFertilizerLine(int index) {
    setState(() {
      _createFertilizerLines.removeAt(index);
      _calculateTotals();
    });
  }

  String _formatAmountForField(double value) {
    if (value == value.roundToDouble()) {
      return value.round().toString();
    }
    return value.toString();
  }

  Widget _buildCreateFertilizerSection() {
    final theme = Theme.of(context);
    final remainingIds = <String>{
      for (final d in _availableFertilizers) d.id,
    }.difference({for (final l in _createFertilizerLines) l.catalogId});

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (remainingIds.isEmpty && _availableFertilizers.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              'All fertilizer types from the catalog have been added. '
              'Remove one to add a different line, or edit amounts below.',
              style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.72),
                  ),
            ),
          )
        else if (_availableFertilizers.isNotEmpty) ...[
          DropdownButtonFormField<String>(
            // ignore: deprecated_member_use — value tied to [_selectedAddFertilizerId] / availability.
            value: _resolvedAddFertilizerDropdownValue(),
            isExpanded: true,
            decoration: InputDecoration(
              labelText: 'Add fertilizer',
              hint: const Text('Select type'),
              prefixIcon: const PhosphorIcon(PhosphorIconsBold.flask),
              border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
              enabledBorder: OutlineInputBorder(
                borderRadius: const BorderRadius.all(Radius.circular(12)),
                borderSide: BorderSide(
                  color: theme.colorScheme.outline.withValues(alpha: 0.5),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: const BorderRadius.all(Radius.circular(12)),
                borderSide: BorderSide(color: theme.primaryColor, width: 2),
              ),
              filled: true,
              fillColor: theme.colorScheme.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            items: [
              for (final d in _availableFertilizers)
                if (remainingIds.contains(d.id))
                  DropdownMenuItem<String>(value: d.id, child: Text(d.name)),
            ],
            onChanged: widget.isSubmitting
                ? null
                : (String? id) {
                    setState(() {
                      _selectedAddFertilizerId = id;
                      _addFertilizerAmount?.clear();
                    });
                  },
          ),
          if (_selectedAddFertilizerId != null && _addFertilizerAmount != null) ...[
            const SizedBox(height: 12),
            _field(
              controller: _addFertilizerAmount!,
              label: _definitionForId(_selectedAddFertilizerId!)?.amountFieldLabel ?? 'Amount',
              hintText: 'Enter amount',
              prefixIcon: PhosphorIconsBold.scales,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: widget.isSubmitting ? null : _addSelectedFertilizerLine,
              icon: const PhosphorIcon(PhosphorIconsBold.plusCircle),
              label: const Text('Add to list'),
            ),
          ],
        ],
        if (_createFertilizerLines.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            'Selected fertilizers',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: theme.primaryColor,
            ),
          ),
          const SizedBox(height: 8),
          ...List.generate(_createFertilizerLines.length, (index) {
            final line = _createFertilizerLines[index];
            final def = _definitionForId(line.catalogId);
            if (def == null) return const SizedBox.shrink();
            final lineTotal = line.amount * def.price;
            return Padding(
              padding: EdgeInsets.only(bottom: index < _createFertilizerLines.length - 1 ? 8 : 0),
              child: Material(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: widget.isSubmitting ? null : () => _editCreateFertilizerLine(index),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: theme.colorScheme.outline.withValues(alpha: 0.25),
                      ),
                    ),
                    child: Row(
                      children: [
                        PhosphorIcon(PhosphorIconsBold.flask, color: theme.primaryColor, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                def.name,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${def.amountFieldLabel}: ${_formatAmountForField(line.amount)}'
                                '${def.price > 0 ? ' × ₹${_formatAmountForField(def.price)} = ₹${_formatAmountForField(lineTotal)}' : ''}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurface.withValues(alpha: 0.75),
                                    ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Edit amount',
                          onPressed: widget.isSubmitting ? null : () => _editCreateFertilizerLine(index),
                          icon: PhosphorIcon(
                            PhosphorIconsBold.pencilSimple,
                            color: theme.primaryColor,
                          ),
                        ),
                        IconButton(
                          tooltip: 'Remove',
                          onPressed: widget.isSubmitting
                              ? null
                              : () => _removeCreateFertilizerLine(index),
                          icon: Icon(
                            Icons.delete_outline,
                            color: theme.colorScheme.error,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ],
    );
  }

  List<Widget> _buildFertilizerRows() {
    final List<Widget> rows = [];
    
    for (int i = 0; i < _availableFertilizers.length; i++) {
      final fertilizer = _availableFertilizers[i];
      rows.add(_fertilizerRow(
        fertilizer,
        _fertilizerAmountControllers[fertilizer.id]!,
        _fertilizerPriceControllers[fertilizer.id]!,
        PhosphorIconsBold.flask,
      ));
      
      // Add spacing between rows except for the last one
      if (i < _availableFertilizers.length - 1) {
        rows.add(const SizedBox(height: 12));
      }
    }
    
    return rows;
  }

  Future<void> _submit() async {
    final ok = _formKey.currentState?.validate() ?? false;
    if (!ok) return;
    
    final List<FertilizerType> fertilizers = [];
    if (widget.mode == FarmerFormMode.create) {
      for (final def in _availableFertilizers) {
        var amount = 0.0;
        for (final line in _createFertilizerLines) {
          if (line.catalogId == def.id) {
            amount = line.amount;
            break;
          }
        }
        fertilizers.add(FertilizerType(
          id: def.id,
          name: def.name,
          amount: amount,
          price: def.price,
          unit: def.unit,
        ));
      }
    } else {
      for (final fertilizer in _availableFertilizers) {
        final amount = _fertilizerAmountControllers[fertilizer.id]?.text.trim().isEmpty ?? true
            ? 0.0 
            : double.parse(_fertilizerAmountControllers[fertilizer.id]!.text.trim());
        
        final price = _fertilizerPriceControllers[fertilizer.id]?.text.trim().isEmpty ?? true
            ? 0.0 
            : double.parse(_fertilizerPriceControllers[fertilizer.id]!.text.trim());
        
        fertilizers.add(FertilizerType(
          id: fertilizer.id,
          name: fertilizer.name,
          amount: amount,
          price: price,
          unit: fertilizer.unit,
        ));
      }
    }
    
    final data = FarmerFormData(
      slNo: int.parse(_slNo.text.trim()),
      dateOfPurchase: DateTime.parse(_dateOfPurchase.text.trim()),
      landOwnerName: _landOwnerName.text.trim(),
      villageOrMouza: _villageOrMouza.text.trim(),
      khataNo: _khataNo.text.trim(),
      area: _area.text.trim().isEmpty ? 0.0 : double.parse(_area.text.trim()),
      farmerName: _farmerName.text.trim(),
      aadharNo: _aadharNo.text.trim(),
      mobileNo: _mobileNo.text.trim(),
      cropsName: _cropsName.text.trim(),
      fertilizers: fertilizers,
      remarks: _remarks.text.trim(),
    );
    await widget.onSubmit(data);
  }
}

