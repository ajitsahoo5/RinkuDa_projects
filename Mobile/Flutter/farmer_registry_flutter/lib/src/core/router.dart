import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/pages/login_page.dart';
import '../features/auth/pages/signup_page.dart';
import '../features/farmers/pages/create_farmer_page.dart';
import '../features/farmers/pages/dashboard_page.dart';
// import '../features/farmers/pages/edit_farmer_page.dart';
import '../features/farmers/pages/farmer_details_page.dart';
import 'go_router_refresh_stream.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authRefresh = GoRouterRefreshStream(FirebaseAuth.instance.authStateChanges());
  ref.onDispose(authRefresh.dispose);

  return GoRouter(
    initialLocation: DashboardPage.routePath,
    refreshListenable: authRefresh,
    redirect: (BuildContext context, GoRouterState state) {
      final user = FirebaseAuth.instance.currentUser;
      final loc = state.matchedLocation;
      final isAuthRoute =
          loc == LoginPage.routePath || loc == SignupPage.routePath;
      if (user == null && !isAuthRoute) return LoginPage.routePath;
      if (user != null && isAuthRoute) return DashboardPage.routePath;
      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: LoginPage.routePath,
        name: LoginPage.routeName,
        builder: (BuildContext context, GoRouterState state) {
          return const LoginPage();
        },
      ),
      GoRoute(
        path: SignupPage.routePath,
        name: SignupPage.routeName,
        builder: (BuildContext context, GoRouterState state) {
          return const SignupPage();
        },
      ),
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
