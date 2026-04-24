import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';
import '../application/current_ride_controller.dart';
import '../data/ride_repository.dart';
import '../domain/ride_record.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  Timer? _refreshTimer;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _refreshRideSilently(),
    );
  }

  Future<void> _refreshRideSilently() async {
    final ride = ref.read(currentRideProvider);
    if (ride == null || ride.isCompleted || ride.isCancelled) return;

    try {
      final latest = await ref.read(passengerRideRepositoryProvider).getRide(ride.id);
      ref.read(currentRideProvider.notifier).setRide(latest);
      if (latest.isCompleted && mounted) {
        context.go('/trip-complete');
      }
    } catch (_) {
      // Silent polling should fail softly while tracking stays visible.
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _cancelRide(RideRecord ride) async {
    final session = ref.read(sessionControllerProvider);
    final user = session?.user;
    if (user == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final updatedRide = await ref
          .read(passengerRideRepositoryProvider)
          .updateRideStatus(
            rideId: ride.id,
            nextStatus: 'cancelled',
            actorRole: 'passenger',
            actorUserId: user.id,
            cancellationReason: 'Cancelled from passenger app',
          );
      ref.read(currentRideProvider.notifier).setRide(updatedRide);
      if (!mounted) return;
      context.go('/trip-complete');
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

  Future<void> _refreshRide(RideRecord ride) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final latest = await ref
          .read(passengerRideRepositoryProvider)
          .getRide(ride.id);
      ref.read(currentRideProvider.notifier).setRide(latest);
      if (latest.isCompleted && mounted) {
        context.go('/trip-complete');
      }
    } catch (error) {
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
    final theme = Theme.of(context);

    if (ride == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Tracking')),
        body: Center(
          child: TextButton(
            onPressed: () => context.go('/app'),
            child: const Text('No active ride. Return home'),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: const BoxDecoration(color: Color(0xFF1E293B)),
              child: CustomPaint(painter: _DarkMapPainter(ride: ride)),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  IconButton.filled(
                    onPressed: () => context.go('/app'),
                    style: IconButton.styleFrom(backgroundColor: Colors.white),
                    icon: const Icon(
                      Icons.menu_rounded,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
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
                              color: AppTheme.forest,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              ride.isCompleted
                                  ? 'Trip completed'
                                  : ride.isCancelled
                                  ? 'Ride cancelled'
                                  : '${ride.riderName ?? 'Rider'} ${_statusLabel(ride.status)}',
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
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
              height: 350,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(
                    blurRadius: 30,
                    offset: Offset(0, -10),
                    color: Color(0x26000000),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 48,
                      height: 6,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD1D5DB),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFBBF7D0),
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _initials(ride.riderName ?? 'Rider'),
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppTheme.forest,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ride.riderName ?? 'Assigned rider',
                              style: theme.textTheme.titleLarge,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _vehicleLabel(ride),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          ride.isCompleted
                              ? 'Trip completed'
                              : 'Ride status: ${ride.status}',
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF92400E),
                          ),
                        ),
                        Text(
                          'OkadaGo',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: const Color(0xFF92400E),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (ride.latestLocation != null) ...[
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Live rider location',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: const Color(0xFF047857),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Updated ${_relativeTime(ride.latestLocation!.recordedAt)} at '
                            '${ride.latestLocation!.latitude.toStringAsFixed(5)}, '
                            '${ride.latestLocation!.longitude.toStringAsFixed(5)}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF065F46),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _ActionButton(
                          icon: Icons.call_outlined,
                          label: 'Call',
                          tint: const Color(0xFFF3F4F6),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ActionButton(
                          icon: Icons.chat_bubble_outline_rounded,
                          label: 'Chat',
                          tint: const Color(0xFFECFDF5),
                          accent: AppTheme.forest,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const _RoundActionButton(icon: Icons.share_outlined),
                    ],
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.red.shade700,
                      ),
                    ),
                  ],
                  const Spacer(),
                  Center(
                    child: TextButton(
                      onPressed: _loading ? null : () => _refreshRide(ride),
                      child: Text(
                        _loading ? 'Refreshing...' : 'Refresh trip status',
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _loading || ride.isCompleted || ride.isCancelled
                        ? null
                        : () => _cancelRide(ride),
                    child: const Text('Cancel ride'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'assigned':
        return 'arriving in 4 min';
      case 'arriving':
        return 'is on the way';
      case 'arrived':
        return 'has arrived';
      case 'started':
        return 'trip is in progress';
      default:
        return 'is active';
    }
  }

  String _initials(String value) {
    final parts = value
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'RD';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first.substring(0, 1)}${parts.last.substring(0, 1)}'
        .toUpperCase();
  }

  String _vehicleLabel(RideRecord ride) {
    if (ride.riderPhone != null && ride.riderPhone!.isNotEmpty) {
      return ride.riderPhone!;
    }
    return 'Vehicle details will sync once the rider is fully assigned.';
  }

  String _relativeTime(DateTime? recordedAt) {
    if (recordedAt == null) return 'just now';
    final seconds = DateTime.now().difference(recordedAt).inSeconds;
    if (seconds <= 5) return 'just now';
    if (seconds < 60) return '$seconds sec ago';
    final minutes = (seconds / 60).floor();
    return '$minutes min ago';
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.tint,
    this.accent = const Color(0xFF111827),
  });

  final IconData icon;
  final String label;
  final Color tint;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: tint,
        borderRadius: BorderRadius.circular(999),
      ),
      alignment: Alignment.center,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18, color: accent),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: accent,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundActionButton extends StatelessWidget {
  const _RoundActionButton({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: const BoxDecoration(
        color: Color(0xFFF3F4F6),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: const Color(0xFF111827)),
    );
  }
}

class _DarkMapPainter extends CustomPainter {
  const _DarkMapPainter({required this.ride});

  final RideRecord ride;

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()
      ..color = const Color(0xFF475569).withValues(alpha: 0.18)
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }

    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }

    final riderLatitude = ride.latestLocation?.latitude ?? ride.pickupLatitude;
    final riderLongitude = ride.latestLocation?.longitude ?? ride.pickupLongitude;
    final riderPoint = _project(
      latitude: riderLatitude,
      longitude: riderLongitude,
      size: size,
    );
    final pickupPoint = _project(
      latitude: ride.pickupLatitude,
      longitude: ride.pickupLongitude,
      size: size,
    );
    final destinationPoint = _project(
      latitude: ride.destinationLatitude,
      longitude: ride.destinationLongitude,
      size: size,
    );

    final path = Path()
      ..moveTo(riderPoint.dx, riderPoint.dy)
      ..quadraticBezierTo(
        (pickupPoint.dx + destinationPoint.dx) / 2,
        math.min(pickupPoint.dy, destinationPoint.dy) - 36,
        destinationPoint.dx,
        destinationPoint.dy,
      );

    final route = Paint()
      ..color = AppTheme.forest
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke;

    canvas.drawPath(path, route);

    final riderPaint = Paint()..color = const Color(0xFF22C55E);
    final destinationPaint = Paint()..color = const Color(0xFFF97316);
    final pickupPaint = Paint()..color = Colors.white;

    canvas.drawCircle(destinationPoint, 11, destinationPaint);
    canvas.drawCircle(destinationPoint, 4, pickupPaint);
    canvas.drawCircle(pickupPoint, 10, pickupPaint);
    canvas.drawCircle(pickupPoint, 4, Paint()..color = AppTheme.forest);
    canvas.drawCircle(riderPoint, 13, riderPaint);
    canvas.drawCircle(
      riderPoint,
      24,
      Paint()..color = riderPaint.color.withValues(alpha: 0.20),
    );
  }

  Offset _project({
    required double latitude,
    required double longitude,
    required Size size,
  }) {
    final coordinates = [
      (lat: ride.pickupLatitude, lng: ride.pickupLongitude),
      (lat: ride.destinationLatitude, lng: ride.destinationLongitude),
      (
        lat: ride.latestLocation?.latitude ?? ride.pickupLatitude,
        lng: ride.latestLocation?.longitude ?? ride.pickupLongitude,
      ),
    ];

    final latitudes = coordinates.map((item) => item.lat).toList(growable: false);
    final longitudes = coordinates.map((item) => item.lng).toList(growable: false);
    final minLatitude = latitudes.reduce(math.min);
    final maxLatitude = latitudes.reduce(math.max);
    final minLongitude = longitudes.reduce(math.min);
    final maxLongitude = longitudes.reduce(math.max);
    const padding = 48.0;

    final horizontalRange = (maxLongitude - minLongitude).abs() < 0.0001
        ? 0.0001
        : (maxLongitude - minLongitude);
    final verticalRange = (maxLatitude - minLatitude).abs() < 0.0001
        ? 0.0001
        : (maxLatitude - minLatitude);

    final x =
        padding + ((longitude - minLongitude) / horizontalRange) * (size.width - padding * 2);
    final y = padding +
        ((maxLatitude - latitude) / verticalRange) * (size.height - padding * 2);

    return Offset(x, y);
  }

  @override
  bool shouldRepaint(covariant _DarkMapPainter oldDelegate) =>
      oldDelegate.ride.id != ride.id ||
      oldDelegate.ride.status != ride.status ||
      oldDelegate.ride.latestLocation?.latitude != ride.latestLocation?.latitude ||
      oldDelegate.ride.latestLocation?.longitude != ride.latestLocation?.longitude ||
      oldDelegate.ride.destinationLatitude != ride.destinationLatitude ||
      oldDelegate.ride.destinationLongitude != ride.destinationLongitude;
}
