import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      final session = ref.read(sessionControllerProvider);
      context.go(session != null ? '/app' : '/onboarding');
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppTheme.forest,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 48,
              backgroundColor: Colors.white,
              child: Text(
                'O',
                style: TextStyle(
                  color: AppTheme.forest,
                  fontSize: 42,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            SizedBox(height: 22),
            Text(
              'OkadaGo Rider',
              style: TextStyle(
                color: Colors.white,
                fontSize: 30,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Ride and earn with confidence',
              style: TextStyle(color: Color(0xFFD1FAE5), fontSize: 15),
            ),
          ],
        ),
      ),
    );
  }
}
