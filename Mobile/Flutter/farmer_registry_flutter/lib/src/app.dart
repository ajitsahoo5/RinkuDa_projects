import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/router.dart';
import 'core/sheet_sync.dart';
import 'features/farmers/state/farmers_providers.dart';
import 'theme/app_theme.dart';

class FarmerRegistryApp extends ConsumerStatefulWidget {
  const FarmerRegistryApp({super.key});

  @override
  ConsumerState<FarmerRegistryApp> createState() => _FarmerRegistryAppState();
}

class _FarmerRegistryAppState extends ConsumerState<FarmerRegistryApp> {
  Timer? _sheetSyncTimer;

  @override
  void initState() {
    super.initState();
    _sheetSyncTimer = Timer.periodic(const Duration(minutes: 2), (_) => _runSheetSync());
    WidgetsBinding.instance.addPostFrameCallback((_) => _runSheetSync());
  }

  void _runSheetSync() {
    final link = ref.read(googleSheetLinkStreamProvider).value;
    final farmers = ref.read(farmersStreamProvider).value;
    unawaited(syncFarmersToGoogleSheet(sheetLink: link, farmers: farmers));
  }

  @override
  void dispose() {
    _sheetSyncTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final GoRouter router = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: 'Bhela pacs business',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      routerConfig: router,
    );
  }
}
