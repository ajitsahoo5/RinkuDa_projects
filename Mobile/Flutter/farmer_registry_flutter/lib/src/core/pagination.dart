const kDefaultPageSize = 10;

class PaginatedSlice<T> {
  PaginatedSlice({
    required this.items,
    required this.page,
    required this.totalPages,
    required this.totalItems,
    this.pageSize = kDefaultPageSize,
  });

  final List<T> items;
  final int page;
  final int totalPages;
  final int totalItems;
  final int pageSize;

  int get startIndex => totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
  int get endIndex => totalItems == 0 ? 0 : (page * pageSize).clamp(0, totalItems);
}

PaginatedSlice<T> paginateList<T>(List<T> all, int page, {int pageSize = kDefaultPageSize}) {
  if (all.isEmpty) {
    return PaginatedSlice<T>(
      items: const [],
      page: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: pageSize,
    );
  }
  final totalPages = (all.length / pageSize).ceil();
  final safePage = page.clamp(1, totalPages);
  final start = (safePage - 1) * pageSize;
  final end = (start + pageSize).clamp(0, all.length);
  return PaginatedSlice<T>(
    items: all.sublist(start, end),
    page: safePage,
    totalPages: totalPages,
    totalItems: all.length,
    pageSize: pageSize,
  );
}
