import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';
import '../application/current_ride_controller.dart';
import '../data/ride_repository.dart';
import '../domain/ride_record.dart';
import 'widgets/rider_live_location_sync.dart';

class ActiveTripScreen extends ConsumerStatefulWidget {
  const ActiveTripScreen({super.key});

  @override
  ConsumerState<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends ConsumerState<ActiveTripScreen> {
  bool _loading = false;
  String? _error;

  Future<void> _completeRide(RideRecord ride) async {
    final user = ref.read(sessionControllerProvider)?.user;
    if (user == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref
          .read(riderRideRepositoryProvider)
          .updateRideStatus(
            rideId: ride.id,
            nextStatus: 'completed',
            actorUserId: user.id,
          );
      ref.read(currentRideProvider.notifier).clear();
      if (!mounted) return;
      context.go('/app');
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
            child: const Text('No active trip. Return to dashboard'),
          ),
        ),
      );
    }

    final passengerName = ride.passengerName ?? 'Passenger';
    final remainingMinutes = ((ride.estimatedDurationMinutes ?? 12) / 2)
        .ceil()
        .clamp(1, 99);
    final remainingDistance = ((ride.estimatedDistanceKm ?? 6.4) / 2)
        .toStringAsFixed(1);
    final fare = (ride.finalFare ?? ride.estimatedFare ?? 0).toStringAsFixed(2);

    return Scaffold(
      backgroundColor: const Color(0xFF1A231E),
      body: Stack(
        children: [
          RiderLiveLocationSync(
            riderProfileId: riderProfileId,
            online: true,
            ride: ride,
          ),
          Positioned.fill(child: CustomPaint(painter: _ActiveTripMapPainter())),
          Positioned(
            top: MediaQuery.of(context).padding.top + 124,
            left: MediaQuery.of(context).size.width * 0.72,
            child: const _TripDestinationMarker(),
          ),
          Positioned(
            top: MediaQuery.of(context).size.height * 0.7,
            left: MediaQuery.of(context).size.width * 0.38,
            child: const _TripRiderMarker(),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.forest,
                      borderRadius: BorderRadius.circular(999),
                      boxShadow: const [
                        BoxShadow(
                          blurRadius: 18,
                          offset: Offset(0, 8),
                          color: Color(0x22000000),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF86EFAC),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Trip in progress',
                            style: Theme.of(context).textTheme.labelLarge
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                        ),
                        Text(
                          '08:42',
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(
                                color: const Color(0xFFD1FAE5),
                                fontWeight: FontWeight.w800,
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
            top: MediaQuery.of(context).padding.top + 74,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                boxShadow: const [
                  BoxShadow(
                    blurRadius: 18,
                    offset: Offset(0, 8),
                    color: Color(0x26000000),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Heading to',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    ride.destinationAddress,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: const Color(0xFF0F172A),
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '$remainingMinutes min',
                          style: Theme.of(context).textTheme.labelMedium
                              ?.copyWith(
                                color: const Color(0xFF92400E),
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '$remainingDistance km remaining',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
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
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
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
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                passengerName,
                                style: Theme.of(context).textTheme.titleSmall
                                    ?.copyWith(
                                      color: const Color(0xFF0F172A),
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                ride.passengerPhone ??
                                    'Passenger contact available from support',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: const Color(0xFF64748B),
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'FIXED FARE',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: const Color(0xFF64748B),
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${ride.currency} $fare',
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    color: const Color(0xFF0F172A),
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: const [
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.share_outlined,
                          label: 'Share',
                          backgroundColor: Color(0xFFF3F4F6),
                          foregroundColor: Color(0xFF374151),
                        ),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.chat_bubble_outline_rounded,
                          label: 'Chat',
                          backgroundColor: Color(0xFFF3F4F6),
                          foregroundColor: Color(0xFF374151),
                        ),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.shield_outlined,
                          label: 'SOS',
                          backgroundColor: Color(0xFFFEF2F2),
                          foregroundColor: Colors.red,
                        ),
                      ),
                    ],
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    _TripError(message: _error!),
                  ],
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : () => _completeRide(ride),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.forest,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: Text(_loading ? 'Ending trip...' : 'End Trip'),
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

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: foregroundColor),
          const SizedBox(height: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: foregroundColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _TripError extends StatelessWidget {
  const _TripError({required this.message});

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

class _TripRiderMarker extends StatelessWidget {
  const _TripRiderMarker();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppTheme.amber.withValues(alpha: 0.24),
            shape: BoxShape.circle,
          ),
        ),
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: AppTheme.amber,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: const [
              BoxShadow(
                blurRadius: 14,
                offset: Offset(0, 6),
                color: Color(0x22000000),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TripDestinationMarker extends StatelessWidget {
  const _TripDestinationMarker();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: Colors.red,
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
    );
  }
}

class _ActiveTripMapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final road = Paint()
      ..color = const Color(0xFF3A4D43)
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final route = Paint()
      ..color = AppTheme.amber
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final routeAccent = Paint()
      ..color = const Color(0xFFFBBF24)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final wideRoad = Paint()
      ..color = const Color(0xFF3A4D43)
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final backgroundPath = Path()
      ..moveTo(-50, size.height * 0.34)
      ..lineTo(size.width * 0.52, size.height * 0.52)
      ..lineTo(size.width * 0.78, size.height * 0.12)
      ..lineTo(size.width + 60, size.height * 0.18);
    canvas.drawPath(backgroundPath, road);

    canvas.drawLine(
      Offset(size.width * 0.26, size.height + 20),
      Offset(size.width * 0.5, size.height * 0.53),
      wideRoad,
    );

    final routePath = Path()
      ..moveTo(size.width * 0.38, size.height * 0.72)
      ..lineTo(size.width * 0.52, size.height * 0.52)
      ..lineTo(size.width * 0.78, size.height * 0.12);

    canvas.drawPath(routePath, route);
    canvas.drawPath(routePath, routeAccent);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
