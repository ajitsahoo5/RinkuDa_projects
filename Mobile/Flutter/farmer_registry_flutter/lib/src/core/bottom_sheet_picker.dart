import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// One selectable row in a [BottomSheetPickerFormField] sheet.
class BottomSheetPickerOption<T> {
  const BottomSheetPickerOption({
    required this.value,
    required this.title,
    this.subtitle,
    this.enabled = true,
  });

  final T value;
  final String title;
  final String? subtitle;
  final bool enabled;
}

/// Shows a draggable, resizable picker sheet and returns the chosen value.
Future<T?> showResizableBottomSheetPicker<T>({
  required BuildContext context,
  required String title,
  required List<BottomSheetPickerOption<T>> options,
  T? selectedValue,
  bool searchable = false,
  String searchHint = 'Search…',
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.42),
    builder: (context) => _ResizablePickerSheet<T>(
      title: title,
      options: options,
      selectedValue: selectedValue,
      searchable: searchable && options.length > 5,
      searchHint: searchHint,
    ),
  );
}

class BottomSheetPickerFormField<T> extends FormField<T> {
  BottomSheetPickerFormField({
    super.key,
    required this.options,
    required this.sheetTitle,
    required this.labelText,
    this.hintText,
    this.prefixIcon,
    this.onChanged,
    super.validator,
    T? value,
    this.enabled = true,
    this.searchable = false,
    this.searchHint = 'Search…',
  }) : super(
          initialValue: value,
          builder: (field) {
            final theme = Theme.of(field.context);
            final effectiveValue = value ?? field.value;

            if (value != null && value != field.value) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (field.context.mounted) field.didChange(value);
              });
            }

            String? selectedTitle;
            for (final opt in options) {
              if (opt.value == effectiveValue) {
                selectedTitle = opt.title;
                break;
              }
            }

            Future<void> openSheet() async {
              if (!enabled) return;
              FocusManager.instance.primaryFocus?.unfocus();
              final picked = await showResizableBottomSheetPicker<T>(
                context: field.context,
                title: sheetTitle,
                options: options,
                selectedValue: effectiveValue,
                searchable: searchable,
                searchHint: searchHint,
              );
              if (picked == null) return;
              field.didChange(picked);
              onChanged?.call(picked);
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: enabled ? openSheet : null,
                    borderRadius: BorderRadius.circular(12),
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: labelText,
                        hintText: hintText,
                        prefixIcon: prefixIcon,
                        suffixIcon: PhosphorIcon(
                          PhosphorIconsBold.caretDown,
                          size: 18,
                          color: enabled
                              ? theme.colorScheme.onSurface.withValues(alpha: 0.55)
                              : theme.disabledColor,
                        ),
                        border: const OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
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
                        errorBorder: const OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                          borderSide: BorderSide(color: Colors.red),
                        ),
                        focusedErrorBorder: const OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                          borderSide: BorderSide(color: Colors.red, width: 2),
                        ),
                        filled: true,
                        fillColor: enabled
                            ? theme.colorScheme.surface
                            : theme.colorScheme.surface.withValues(alpha: 0.72),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        errorText: field.errorText,
                      ),
                      isEmpty: selectedTitle == null || selectedTitle.isEmpty,
                      child: Text(
                        selectedTitle ?? hintText ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: selectedTitle == null
                              ? theme.colorScheme.onSurface.withValues(alpha: 0.45)
                              : theme.colorScheme.onSurface,
                          fontWeight: selectedTitle == null ? FontWeight.w400 : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        );

  final List<BottomSheetPickerOption<T>> options;
  final String sheetTitle;
  final String labelText;
  final String? hintText;
  final Widget? prefixIcon;
  final ValueChanged<T?>? onChanged;
  final bool enabled;
  final bool searchable;
  final String searchHint;
}

class _ResizablePickerSheet<T> extends StatefulWidget {
  const _ResizablePickerSheet({
    required this.title,
    required this.options,
    required this.selectedValue,
    required this.searchable,
    required this.searchHint,
  });

  final String title;
  final List<BottomSheetPickerOption<T>> options;
  final T? selectedValue;
  final bool searchable;
  final String searchHint;

  @override
  State<_ResizablePickerSheet<T>> createState() => _ResizablePickerSheetState<T>();
}

class _ResizablePickerSheetState<T> extends State<_ResizablePickerSheet<T>> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<BottomSheetPickerOption<T>> get _filteredOptions {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return widget.options;
    return widget.options.where((opt) {
      if (opt.title.toLowerCase().contains(q)) return true;
      final sub = opt.subtitle;
      return sub != null && sub.toLowerCase().contains(q);
    }).toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filtered = _filteredOptions;
    final initialSize = (0.28 + (widget.options.length.clamp(1, 12) * 0.045)).clamp(0.42, 0.72);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: initialSize,
      minChildSize: 0.32,
      maxChildSize: 0.92,
      snap: true,
      snapSizes: const [0.32, 0.55, 0.92],
      builder: (context, scrollController) {
        return DecoratedBox(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.16),
                blurRadius: 28,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 12, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.title,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Close',
                      onPressed: () => Navigator.of(context).pop(),
                      icon: PhosphorIcon(
                        PhosphorIconsBold.x,
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.searchable) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _query = v),
                    textInputAction: TextInputAction.search,
                    decoration: InputDecoration(
                      hintText: widget.searchHint,
                      prefixIcon: const PhosphorIcon(PhosphorIconsBold.magnifyingGlass, size: 20),
                      suffixIcon: _query.isEmpty
                          ? null
                          : IconButton(
                              tooltip: 'Clear',
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _query = '');
                              },
                              icon: PhosphorIcon(
                                PhosphorIconsBold.xCircle,
                                size: 18,
                                color: theme.colorScheme.onSurface.withValues(alpha: 0.45),
                              ),
                            ),
                      isDense: true,
                      filled: true,
                      fillColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.55),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ),
              ],
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            _query.isEmpty ? 'No options available' : 'No matches for "$_query"',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.62),
                            ),
                          ),
                        ),
                      )
                    : ListView.separated(
                        controller: scrollController,
                        padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 6),
                        itemBuilder: (context, index) {
                          final opt = filtered[index];
                          final selected = opt.value == widget.selectedValue;
                          final primary = theme.colorScheme.primary;

                          return Material(
                            color: selected
                                ? primary.withValues(alpha: 0.1)
                                : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(14),
                            child: InkWell(
                              onTap: opt.enabled
                                  ? () => Navigator.of(context).pop(opt.value)
                                  : null,
                              borderRadius: BorderRadius.circular(14),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            opt.title,
                                            maxLines: 3,
                                            overflow: TextOverflow.ellipsis,
                                            style: theme.textTheme.bodyLarge?.copyWith(
                                              fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                                              color: opt.enabled
                                                  ? theme.colorScheme.onSurface
                                                  : theme.disabledColor,
                                            ),
                                          ),
                                          if (opt.subtitle != null && opt.subtitle!.isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              opt.subtitle!,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: theme.textTheme.bodySmall?.copyWith(
                                                color: theme.colorScheme.onSurface.withValues(alpha: 0.62),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    AnimatedContainer(
                                      duration: const Duration(milliseconds: 180),
                                      width: 26,
                                      height: 26,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: selected ? primary : Colors.transparent,
                                        border: Border.all(
                                          color: selected
                                              ? primary
                                              : theme.colorScheme.outline.withValues(alpha: 0.45),
                                          width: 1.5,
                                        ),
                                      ),
                                      child: selected
                                          ? const PhosphorIcon(
                                              PhosphorIconsBold.check,
                                              size: 14,
                                              color: Colors.white,
                                            )
                                          : null,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
