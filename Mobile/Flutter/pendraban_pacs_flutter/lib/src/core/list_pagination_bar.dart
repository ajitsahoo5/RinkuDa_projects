import 'package:flutter/material.dart';

import 'pagination.dart';

class ListPaginationBar extends StatelessWidget {
  const ListPaginationBar({
    super.key,
    required this.page,
    required this.totalPages,
    required this.totalItems,
    required this.pageSize,
    required this.onPageChanged,
  });

  final int page;
  final int totalPages;
  final int totalItems;
  final int pageSize;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    if (totalItems == 0) return const SizedBox.shrink();

    final slice = paginateList(List.generate(totalItems, (i) => i), page, pageSize: pageSize);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final narrow = constraints.maxWidth < 420;
          final rangeText = Text(
            'Showing ${slice.startIndex}–${slice.endIndex} of $totalItems',
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
            ),
          );
          final controls = Row(
            mainAxisSize: narrow ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: narrow ? MainAxisAlignment.center : MainAxisAlignment.end,
            children: [
              OutlinedButton(
                onPressed: page > 1 ? () => onPageChanged(page - 1) : null,
                child: const Text('Previous'),
              ),
              const SizedBox(width: 8),
              Text(
                '$page / $totalPages',
                style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: page < totalPages ? () => onPageChanged(page + 1) : null,
                child: const Text('Next'),
              ),
            ],
          );

          if (narrow) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                rangeText,
                const SizedBox(height: 10),
                controls,
              ],
            );
          }

          return Row(
            children: [
              Expanded(child: rangeText),
              controls,
            ],
          );
        },
      ),
    );
  }
}

class PaginatedOptionsList extends StatefulWidget {
  const PaginatedOptionsList({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.pageSize = kDefaultPageSize,
    this.scrollController,
    this.separatorBuilder,
    this.padding,
  });

  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final int pageSize;
  final ScrollController? scrollController;
  final Widget Function(BuildContext context, int index)? separatorBuilder;
  final EdgeInsetsGeometry? padding;

  @override
  State<PaginatedOptionsList> createState() => _PaginatedOptionsListState();
}

class _PaginatedOptionsListState extends State<PaginatedOptionsList> {
  int _page = 1;

  @override
  void didUpdateWidget(covariant PaginatedOptionsList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.itemCount != widget.itemCount) {
      _page = 1;
    } else {
      final totalPages = widget.itemCount == 0
          ? 1
          : (widget.itemCount / widget.pageSize).ceil();
      if (_page > totalPages) _page = totalPages;
    }
  }

  @override
  Widget build(BuildContext context) {
    final indices = List.generate(widget.itemCount, (i) => i);
    final slice = paginateList(indices, _page, pageSize: widget.pageSize);
    final theme = Theme.of(context);

    return Column(
      children: [
        Expanded(
          child: slice.items.isEmpty
              ? Center(
                  child: Text(
                    'No items',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.62),
                    ),
                  ),
                )
              : ListView.separated(
                  controller: widget.scrollController,
                  padding: widget.padding,
                  itemCount: slice.items.length,
                  separatorBuilder: widget.separatorBuilder ?? (_, __) => const SizedBox(height: 6),
                  itemBuilder: (context, localIndex) {
                    return widget.itemBuilder(context, slice.items[localIndex]);
                  },
                ),
        ),
        if (widget.itemCount > widget.pageSize)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: ListPaginationBar(
              page: slice.page,
              totalPages: slice.totalPages,
              totalItems: slice.totalItems,
              pageSize: widget.pageSize,
              onPageChanged: (next) => setState(() => _page = next),
            ),
          ),
      ],
    );
  }
}
