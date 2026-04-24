import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _page = 0;

  void _next() {
    if (_page < 2) {
      setState(() => _page += 1);
      return;
    }
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_page == 0) {
      return Scaffold(
        backgroundColor: AppTheme.forest,
        body: SafeArea(
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '9:41',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        _StatusGlyph(),
                        SizedBox(width: 6),
                        _StatusGlyph(circle: true),
                        SizedBox(width: 6),
                        _BatteryGlyph(),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'O',
                          style: TextStyle(
                            color: AppTheme.forest,
                            fontSize: 44,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),
                      const Text(
                        'OkadaGo',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Your city, your speed',
                        style: TextStyle(
                          color: Color(0xFFD1FAE5),
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _next,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppTheme.forest,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    child: const Text('Get Started'),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final content = _page == 1
        ? const _OnboardingDetail(
            icon: Icons.flash_on_rounded,
            iconTint: AppTheme.forest,
            iconBg: Color(0xFFF0FDF4),
            title: 'Book in seconds',
            description:
                'Get a ride whenever you need it. Our drivers are always nearby.',
          )
        : const _OnboardingDetail(
            icon: Icons.shield_outlined,
            iconTint: Color(0xFFFFB800),
            iconBg: Color(0xFFFFFBEB),
            title: 'Ride with confidence',
            description:
                'Verified drivers and real-time tracking for your peace of mind.',
          );

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
          child: Column(
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('9:41', style: TextStyle(fontWeight: FontWeight.w600)),
                  Row(
                    children: [
                      _StatusGlyph(dark: true),
                      SizedBox(width: 6),
                      _StatusGlyph(circle: true, dark: true),
                      SizedBox(width: 6),
                      _BatteryGlyph(dark: true),
                    ],
                  ),
                ],
              ),
              Expanded(child: content),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _Dot(active: _page == 1),
                  const SizedBox(width: 8),
                  _Dot(active: _page == 2),
                ],
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _next,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.forest,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  child: Text(_page == 2 ? 'Continue' : 'Next'),
                ),
              ),
              const SizedBox(height: 12),
              if (_page == 2)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => context.go('/signup'),
                    child: const Text('Create account'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingDetail extends StatelessWidget {
  const _OnboardingDetail({
    required this.icon,
    required this.iconTint,
    required this.iconBg,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final Color iconTint;
  final Color iconBg;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 256,
          height: 256,
          decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
          alignment: Alignment.center,
          child: Icon(icon, size: 90, color: iconTint),
        ),
        const SizedBox(height: 36),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: AppTheme.forest,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 14),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            description,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: const Color(0xFF64748B),
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: active ? AppTheme.forest : const Color(0xFFE5E7EB),
        shape: BoxShape.circle,
      ),
    );
  }
}

class _StatusGlyph extends StatelessWidget {
  const _StatusGlyph({this.circle = false, this.dark = false});

  final bool circle;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: circle ? 12 : 16,
      height: 12,
      decoration: BoxDecoration(
        color: dark ? Colors.black : Colors.white,
        shape: circle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: circle ? null : BorderRadius.circular(3),
      ),
    );
  }
}

class _BatteryGlyph extends StatelessWidget {
  const _BatteryGlyph({this.dark = false});

  final bool dark;

  @override
  Widget build(BuildContext context) {
    final color = dark ? Colors.black : Colors.white;
    return Container(
      width: 22,
      height: 12,
      decoration: BoxDecoration(
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          width: 14,
          margin: const EdgeInsets.all(1),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ),
    );
  }
}
