import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/documents/presentation/document_upload_screen.dart';
import '../../features/home/presentation/rider_shell_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/rides/presentation/active_trip_screen.dart';
import '../../features/rides/presentation/navigation_screen.dart';
import '../../features/rides/presentation/ride_request_screen.dart';
import '../../features/session/application/session_controller.dart';
import '../../features/splash/presentation/splash_screen.dart';

final navigatorKeyProvider = Provider<GlobalKey<NavigatorState>>((ref) {
  return GlobalKey<NavigatorState>();
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final navigatorKey = ref.watch(navigatorKeyProvider);
  final session = ref.watch(sessionControllerProvider);

  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/documents',
        builder: (context, state) => const DocumentUploadScreen(),
      ),
      GoRoute(
        path: '/request',
        builder: (context, state) => const RideRequestScreen(),
      ),
      GoRoute(
        path: '/navigation',
        builder: (context, state) => const NavigationScreen(),
      ),
      GoRoute(
        path: '/active-trip',
        builder: (context, state) => const ActiveTripScreen(),
      ),
      GoRoute(
        path: '/app',
        builder: (context, state) => const RiderShellScreen(),
      ),
    ],
    redirect: (_, state) {
      final authenticated = session != null;
      final location = state.matchedLocation;
      const publicRoutes = {'/splash', '/onboarding', '/login', '/signup'};

      if (location == '/splash') {
        return null;
      }

      if (!authenticated && !publicRoutes.contains(location)) {
        return '/onboarding';
      }

      if (authenticated &&
          publicRoutes.contains(location) &&
          location != '/splash') {
        return '/app';
      }

      return null;
    },
  );
});
