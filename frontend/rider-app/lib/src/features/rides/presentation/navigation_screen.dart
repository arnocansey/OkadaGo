import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';
import '../application/current_ride_controller.dart';
import '../data/ride_repository.dart';
import '../domain/ride_record.dart';
import 'widgets/rider_live_location_sync.dart';

class NavigationScreen extends ConsumerStatefulWidget {
  const NavigationScreen({super.key});

  @override
  ConsumerState<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends ConsumerState<NavigationScreen> {
  bool _loading = false;
  String? _error;

  Future<void> _advance(RideRecord ride) async {
    final user = ref.read(sessionControllerProvider)?.user;
    if (user == null) return;

    final nextStatus = ride.status == 'arrived' ? 'started' : 'arrived';

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final updated = await ref
          .read(riderRideRepositoryProvider)
          .updateRideStatus(
            rideId: ride.id,
            nextStatus: nextStatus,
            actorUserId: user.id,
          );
      ref.read(currentRideProvider.notifier).setRide(updated);
      if (!mounted) return;
      context.go(nextStatus == 'started' ? '/active-trip' : '/navigation');
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ride = ref.watch(currentRideProvider);
    final riderProfileId = ref.watch(sessionControllerProvider)?.user.riderProfileId;

    if (ride == null) {
      return Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => context.go('/app'),
            child: const Text('No navigation task. Return to dashboard'),
          ),
        ),
      );
    }

    final passengerName = ride.passengerName ?? 'Passenger';
    final etaMinutes = ride.status == 'arrived'
        ? 'Ready'
        : '${(ride.estimatedDurationMinutes ?? 4).clamp(1, 99)} min';
    final distance = ride.estimatedDistanceKm?.toStringAsFixed(1) ?? '2.1';
    final callToAction = ride.status == 'arrived'
        ? 'Start Trip'
        : 'Arrived at pickup';
    final instruction = ride.status == 'arrived'
        ? 'Passenger found. Start the trip when ready.'
        : 'Turn right onto Liberation Rd';

    return Scaffold(
      backgroundColor: const Color(0xFF1A231E),
      body: Stack(
        children: [
          RiderLiveLocationSync(
            riderProfileId: riderProfileId,
            online: true,
            ride: ride,
          ),
          Positioned.fill(child: CustomPaint(painter: _NavigationMapPainter())),
          Positioned(
            top: MediaQuery.of(context).padding.top + 118,
            left: MediaQuery.of(context).size.width * 0.38,
            child: const _DestinationMarker(),
          ),
          Positioned(
            top: MediaQuery.of(context).size.height * 0.64,
            left: MediaQuery.of(context).size.width * 0.5 - 22,
            child: const _RiderMarker(),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: const [
                        BoxShadow(
                          blurRadius: 20,
                          offset: Offset(0, 10),
                          color: Color(0x26000000),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                ride.status == 'arrived'
                                    ? 'At pickup point'
                                    : 'Head to pickup',
                                style: Theme.of(context).textTheme.titleLarge
                                    ?.copyWith(
                                      color: const Color(0xFF0F172A),
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                etaMinutes,
                                style: Theme.of(context).textTheme.headlineSmall
                                    ?.copyWith(
                                      color: AppTheme.forest,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '$distance km | $passengerName | ${ride.pickupAddress}',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      color: const Color(0xFF64748B),
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        IconButton(
                          onPressed: () => context.go('/app'),
                          style: IconButton.styleFrom(
                            backgroundColor: const Color(0xFFF3F4F6),
                            foregroundColor: const Color(0xFF374151),
                          ),
                          icon: const Icon(Icons.menu_rounded),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.amber,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: const [
                        BoxShadow(
                          blurRadius: 12,
                          offset: Offset(0, 6),
                          color: Color(0x1FB45309),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.navigation_rounded,
                          color: Color(0xFF78350F),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            instruction,
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(
                                  color: const Color(0xFF78350F),
                                  fontWeight: FontWeight.w900,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: 16,
            bottom: 180,
            child: Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    blurRadius: 16,
                    offset: Offset(0, 8),
                    color: Color(0x22000000),
                  ),
                ],
              ),
              child: const Icon(Icons.place_outlined, color: Color(0xFF374151)),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [
                  BoxShadow(
                    blurRadius: 30,
                    offset: Offset(0, -8),
                    color: Color(0x26000000),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 48,
                    height: 6,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE5E7EB),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Stack(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              _initials(passengerName),
                              style: const TextStyle(
                                color: Color(0xFFB45309),
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                              ),
                            ),
                          ),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                color: const Color(0xFF22C55E),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              passengerName,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(
                                    color: const Color(0xFF0F172A),
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              ride.status == 'arrived'
                                  ? 'Passenger is at pickup point'
                                  : 'Pickup point',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: const Color(0xFF64748B),
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const _CircleActionButton(
                        icon: Icons.chat_bubble_outline_rounded,
                        backgroundColor: Color(0xFFF3F4F6),
                        foregroundColor: Color(0xFF374151),
                      ),
                      const SizedBox(width: 8),
                      const _CircleActionButton(
                        icon: Icons.phone_outlined,
                        backgroundColor: Color(0xFFDCFCE7),
                        foregroundColor: AppTheme.forest,
                      ),
                    ],
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    _NavigationError(message: _error!),
                  ],
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : () => _advance(ride),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.forest,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: Text(_loading ? 'Updating...' : callToAction),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static String _initials(String name) {
    final parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'P';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }
}

class _CircleActionButton extends StatelessWidget {
  const _CircleActionButton({
    required this.icon,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final IconData icon;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(color: backgroundColor, shape: BoxShape.circle),
      child: Icon(icon, size: 20, color: foregroundColor),
    );
  }
}

class _NavigationError extends StatelessWidget {
  const _NavigationError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Text(
        message,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Colors.red.shade700,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _RiderMarker extends StatelessWidget {
  const _RiderMarker();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: AppTheme.forest, width: 2),
        boxShadow: const [
          BoxShadow(
            blurRadius: 14,
            offset: Offset(0, 8),
            color: Color(0x22000000),
          ),
        ],
      ),
      child: const Icon(
        Icons.navigation_rounded,
        color: AppTheme.forest,
        size: 24,
      ),
    );
  }
}

class _DestinationMarker extends StatelessWidget {
  const _DestinationMarker();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: Colors.black,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 4),
        boxShadow: const [
          BoxShadow(
            blurRadius: 12,
            offset: Offset(0, 6),
            color: Color(0x22000000),
          ),
        ],
      ),
      child: const Center(
        child: SizedBox(
          width: 6,
          height: 6,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
  }
}

class _NavigationMapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final road = Paint()
      ..color = const Color(0xFF3A4D43)
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final wideRoad = Paint()
      ..color = const Color(0xFF3A4D43)
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final route = Paint()
      ..color = AppTheme.forest
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final routeAccent = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    canvas.drawLine(
      Offset(-50, size.height * 0.24),
      Offset(size.width + 40, size.height * 0.42),
      road,
    );
    canvas.drawLine(
      Offset(size.width * 0.26, -20),
      Offset(size.width * 0.38, size.height + 30),
      road,
    );
    canvas.drawLine(
      Offset(size.width * 0.77, -20),
      Offset(size.width * 0.64, size.height + 30),
      road,
    );
    canvas.drawLine(
      Offset(-30, size.height * 0.5),
      Offset(size.width + 30, size.height * 0.56),
      wideRoad,
    );

    final routePath = Path()
      ..moveTo(size.width * 0.5, size.height * 0.72)
      ..lineTo(size.width * 0.5, size.height * 0.6)
      ..lineTo(size.width * 0.64, size.height * 0.54)
      ..lineTo(size.width * 0.64, size.height * 0.42)
      ..lineTo(size.width * 0.38, size.height * 0.3);

    canvas.drawPath(routePath, route);
    canvas.drawPath(routePath, routeAccent);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
