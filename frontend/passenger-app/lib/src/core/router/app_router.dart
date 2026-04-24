import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/home/presentation/passenger_shell_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/rides/presentation/book_ride_screen.dart';
import '../../features/rides/presentation/tracking_screen.dart';
import '../../features/rides/presentation/trip_complete_screen.dart';
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
        path: '/book',
        builder: (context, state) => const BookRideScreen(),
      ),
      GoRoute(
        path: '/tracking',
        builder: (context, state) => const TrackingScreen(),
      ),
      GoRoute(
        path: '/trip-complete',
        builder: (context, state) => const TripCompleteScreen(),
      ),
      GoRoute(
        path: '/app',
        builder: (context, state) => const PassengerShellScreen(),
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
