import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/farmers/pages/create_farmer_page.dart';
import '../features/farmers/pages/dashboard_page.dart';
// import '../features/farmers/pages/edit_farmer_page.dart';
import '../features/farmers/pages/farmer_details_page.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: DashboardPage.routePath,
    routes: <RouteBase>[
      GoRoute(
        path: DashboardPage.routePath,
        name: DashboardPage.routeName,
        builder: (BuildContext context, GoRouterState state) {
          return const DashboardPage();
        },
      ),
      GoRoute(
        path: CreateFarmerPage.routePath,
        name: CreateFarmerPage.routeName,
        builder: (BuildContext context, GoRouterState state) {
          return const CreateFarmerPage();
        },
      ),
      GoRoute(
        path: FarmerDetailsPage.routePath,
        name: FarmerDetailsPage.routeName,
        builder: (BuildContext context, GoRouterState state) {
          final id = state.pathParameters['id']!;
          return FarmerDetailsPage(farmerId: id);
        },
      ),
      // Edit route disabled — users may only add farmers via CreateFarmerPage.
      // GoRoute(
      //   path: EditFarmerPage.routePath,
      //   name: EditFarmerPage.routeName,
      //   builder: (BuildContext context, GoRouterState state) {
      //     final id = state.pathParameters['id']!;
      //     return EditFarmerPage(farmerId: id);
      //   },
      // ),
    ],
  );
});

