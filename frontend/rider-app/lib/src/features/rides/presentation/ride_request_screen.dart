import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';
import '../application/current_ride_controller.dart';
import '../data/ride_repository.dart';
import '../domain/ride_record.dart';
import 'widgets/rider_live_location_sync.dart';

class RideRequestScreen extends ConsumerStatefulWidget {
  const RideRequestScreen({super.key});

  @override
  ConsumerState<RideRequestScreen> createState() => _RideRequestScreenState();
}

class _RideRequestScreenState extends ConsumerState<RideRequestScreen> {
  bool _loading = false;
  String? _error;

  Future<void> _updateRide(RideRecord ride, String nextStatus) async {
    final user = ref.read(sessionControllerProvider)?.user;
    if (user == null) return;

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
      if (nextStatus == 'arriving') {
        context.go('/navigation');
        return;
      }
      if (nextStatus == 'cancelled') {
        ref.read(currentRideProvider.notifier).clear();
      }
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
            child: const Text('No active ride request. Return to dashboard'),
          ),
        ),
      );
    }

    final passengerName = ride.passengerName ?? 'Passenger';
    final tripMinutes = ride.estimatedDurationMinutes ?? 14;
    final distance = ride.estimatedDistanceKm?.toStringAsFixed(1) ?? '--';
    final fare = (ride.estimatedFare ?? 0).toStringAsFixed(2);

    return Scaffold(
      backgroundColor: const Color(0xCC0D1A10),
      body: SafeArea(
        child: Center(
          child: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.all(24),
                child: Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 360),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(
                        blurRadius: 28,
                        offset: Offset(0, 18),
                        color: Color(0x22000000),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                  const SizedBox(height: 24),
                  Text(
                    'New Ride Request',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppTheme.forest,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _TimerRing(seconds: 11, progress: 0.73),
                  const SizedBox(height: 18),
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
                    child: Column(
                      children: [
                        Row(
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
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    passengerName,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.call_outlined,
                                        size: 16,
                                        color: Color(0xFF64748B),
                                      ),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          ride.passengerPhone ??
                                              'Passenger contact shared in app',
                                          overflow: TextOverflow.ellipsis,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: const Color(0xFF64748B),
                                                fontWeight: FontWeight.w600,
                                              ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Column(
                            children: [
                              _RouteStop(
                                dotColor: AppTheme.forest,
                                connectorColor: const Color(0xFFCBD5E1),
                                label: 'PICKUP',
                                value: ride.pickupAddress,
                              ),
                              const SizedBox(height: 18),
                              _RouteStop(
                                dotColor: Colors.red,
                                label: 'DROP-OFF',
                                value: ride.destinationAddress,
                              ),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                    color: const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.place_outlined,
                                      size: 16,
                                      color: Color(0xFF94A3B8),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '$distance km | ~$tripMinutes min',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: const Color(0xFF334155),
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7D6),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFFFE6A8)),
                          ),
                          child: Column(
                            children: [
                              Text(
                                'Estimated Fare',
                                style: Theme.of(context).textTheme.labelLarge
                                    ?.copyWith(
                                      color: const Color(0xFFB45309),
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${ride.currency} $fare',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(
                                      color: const Color(0xFFB45309),
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 14),
                          _InlineError(message: _error!),
                        ],
                        const SizedBox(height: 18),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _loading
                                ? null
                                : () => _updateRide(ride, 'arriving'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.forest,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: Text(
                              _loading ? 'Updating...' : 'Accept Ride',
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _loading
                                ? null
                                : () => _updateRide(ride, 'cancelled'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red.shade600,
                              side: const BorderSide(
                                color: Color(0xFFFECACA),
                                width: 1.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: const Text('Decline'),
                          ),
                        ),
                      ],
                    ),
                  ),
                    ],
                  ),
                ),
              ),
              RiderLiveLocationSync(
                riderProfileId: riderProfileId,
                online: true,
                ride: ride,
              ),
            ],
          ),
        ),
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

class _TimerRing extends StatelessWidget {
  const _TimerRing({required this.seconds, required this.progress});

  final int seconds;
  final double progress;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 92,
      height: 92,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size.square(92),
            painter: _TimerRingPainter(progress: progress),
          ),
          Text(
            '$seconds',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: const Color(0xFF0F172A),
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _TimerRingPainter extends CustomPainter {
  const _TimerRingPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = (size.width / 2) - 6;

    final trackPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final progressPaint = Paint()
      ..color = AppTheme.amber
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _TimerRingPainter oldDelegate) {
    return progress != oldDelegate.progress;
  }
}

class _RouteStop extends StatelessWidget {
  const _RouteStop({
    required this.dotColor,
    required this.label,
    required this.value,
    this.connectorColor,
  });

  final Color dotColor;
  final String label;
  final String value;
  final Color? connectorColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 16,
          child: Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
              if (connectorColor != null)
                Container(
                  width: 2,
                  height: 40,
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: connectorColor,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});

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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.red, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.red.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
