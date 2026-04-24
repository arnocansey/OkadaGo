import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../profile/presentation/profile_screen.dart';
import '../../rides/presentation/ride_history_screen.dart';
import 'screens/home_screen.dart';

class PassengerShellScreen extends ConsumerStatefulWidget {
  const PassengerShellScreen({super.key});

  @override
  ConsumerState<PassengerShellScreen> createState() =>
      _PassengerShellScreenState();
}

class _PassengerShellScreenState extends ConsumerState<PassengerShellScreen> {
  int _currentIndex = 0;

  static const _screens = [HomeScreen(), RideHistoryScreen(), ProfileScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      extendBody: true,
      bottomNavigationBar: Container(
        height: 84,
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 22),
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
              icon: Icons.map_rounded,
              selected: _currentIndex == 1,
              onTap: () => setState(() => _currentIndex = 1),
            ),
            _NavItem(
              label: 'Profile',
              icon: Icons.person_rounded,
              selected: _currentIndex == 2,
              onTap: () => setState(() => _currentIndex = 2),
              dot: true,
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
    this.dot = false,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  final bool dot;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppTheme.forest : const Color(0xFF94A3B8);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: SizedBox(
        width: 82,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(icon, color: color, size: 24),
                if (dot)
                  const Positioned(
                    top: -2,
                    right: -4,
                    child: SizedBox(
                      width: 10,
                      height: 10,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                          border: Border.fromBorderSide(
                            BorderSide(color: Colors.white, width: 2),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
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
