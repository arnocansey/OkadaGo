import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../earnings/presentation/earnings_screen.dart';
import '../../profile/presentation/profile_screen.dart';
import '../../rides/presentation/ride_history_screen.dart';
import 'screens/home_screen.dart';

class RiderShellScreen extends ConsumerStatefulWidget {
  const RiderShellScreen({super.key});

  @override
  ConsumerState<RiderShellScreen> createState() => _RiderShellScreenState();
}

class _RiderShellScreenState extends ConsumerState<RiderShellScreen> {
  int _currentIndex = 0;

  static const _screens = [
    HomeScreen(),
    RideHistoryScreen(),
    EarningsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      extendBody: true,
      bottomNavigationBar: Container(
        height: 84,
        padding: const EdgeInsets.fromLTRB(10, 10, 10, 22),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _NavItem(
              label: 'Home',
              icon: Icons.home_rounded,
              selected: _currentIndex == 0,
              onTap: () => setState(() => _currentIndex = 0),
            ),
            _NavItem(
              label: 'Trips',
              icon: Icons.navigation_rounded,
              selected: _currentIndex == 1,
              onTap: () => setState(() => _currentIndex = 1),
            ),
            _NavItem(
              label: 'Earnings',
              icon: Icons.pie_chart_rounded,
              selected: _currentIndex == 2,
              onTap: () => setState(() => _currentIndex = 2),
            ),
            _NavItem(
              label: 'Profile',
              icon: Icons.person_rounded,
              selected: _currentIndex == 3,
              onTap: () => setState(() => _currentIndex = 3),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppTheme.forest : const Color(0xFF9CA3AF);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: SizedBox(
        width: 72,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 24, color: color),
            const SizedBox(height: 5),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: color,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
