import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../rides/application/current_ride_controller.dart';
import '../../../rides/data/ride_repository.dart';
import '../../../rides/data/service_zone_repository.dart';
import '../../../rides/domain/ride_record.dart';
import '../../../rides/domain/service_zone.dart';
import '../../../session/application/session_controller.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final session = ref.watch(sessionControllerProvider);
    final user = session?.user;

    if (user == null) {
      return Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign in to continue'),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: FutureBuilder<List<dynamic>>(
        future: Future.wait<dynamic>([
          ref.read(passengerRideRepositoryProvider).listRides(),
          ref.read(passengerServiceZoneRepositoryProvider).listZones(),
        ]),
        builder: (context, snapshot) {
          final payload = snapshot.data ?? const <dynamic>[];
          final rideRows = payload.isNotEmpty ? payload[0] as List<RideRecord> : const <RideRecord>[];
          final zoneRows =
              payload.length > 1 ? payload[1] as List<ServiceZone> : const <ServiceZone>[];
          final rides = rideRows
              .where((ride) => ride.passengerProfileId == user.passengerProfileId)
              .toList(growable: false);
          final zones = zoneRows;

          final sortedRides = [...rides]
            ..sort((a, b) {
              final aTime = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
              final bTime = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
              return bTime.compareTo(aTime);
            });
          final activeRide = sortedRides.cast<RideRecord?>().firstWhere(
                (ride) => ride != null && !ride.isCompleted && !ride.isCancelled,
                orElse: () => null,
              );
          final completedRides = rides.where((ride) => ride.isCompleted).length;
          final liveZone = zones.firstWhere(
            (zone) => zone.currency == user.preferredCurrency,
            orElse: () => zones.isNotEmpty
                ? zones.first
                : const ServiceZone(
                    id: '',
                    name: '',
                    city: '',
                    countryCode: '',
                    currency: '',
                    baseFare: 0,
                    perKmFee: 0,
                    perMinuteFee: 0,
                    minimumFare: 0,
                    cancellationFee: 0,
                    waitingFeePerMin: 0,
                  ),
          );
          final recentRide = sortedRides.isNotEmpty ? sortedRides.first : null;

          if (activeRide != null) {
            ref.read(currentRideProvider.notifier).setRide(activeRide);
          }

          return Stack(
            children: [
              Positioned.fill(
                top: 88,
                child: DecoratedBox(
                  decoration: const BoxDecoration(color: Color(0xFFE5E7EB)),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: CustomPaint(
                          painter: _MapGridPainter(
                            color: const Color(0xFF0D6B4A).withValues(alpha: 0.18),
                            spacing: 40,
                          ),
                        ),
                      ),
                      Positioned(
                        top: 250,
                        left: MediaQuery.of(context).size.width / 2 - 24,
                        child: Column(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB).withValues(alpha: 0.20),
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: Color(0xFF2563EB),
                                      shape: BoxShape.circle,
                                      border: Border.fromBorderSide(
                                        BorderSide(color: Colors.white, width: 2),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                activeRide != null
                                    ? 'Active trip ready'
                                    : '${zones.length} live zones',
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w700,
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
              Container(
                height: 132,
                color: const Color(0xFF0D6B4A),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.20),
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'OG',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Good morning, ${user.firstName}',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.place_rounded,
                                      size: 12,
                                      color: Color(0xFFD1FAE5),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      liveZone.city.isEmpty
                                          ? '${zones.length} live zones'
                                          : '${liveZone.city} service zone',
                                      style: theme.textTheme.labelSmall?.copyWith(
                                        color: const Color(0xFFD1FAE5),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => context.go(
                            activeRide != null ? '/tracking' : '/book',
                          ),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.08),
                            foregroundColor: Colors.white,
                          ),
                          icon: Icon(
                            activeRide != null
                                ? Icons.navigation_rounded
                                : Icons.search_rounded,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 16,
                bottom: 280,
                child: FloatingActionButton(
                  onPressed: () => context.go(
                    activeRide != null ? '/tracking' : '/book',
                  ),
                  backgroundColor: const Color(0xFF0D6B4A),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(
                    activeRide != null
                        ? Icons.navigation_rounded
                        : Icons.add_rounded,
                  ),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  height: 280,
                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 30),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    boxShadow: [
                      BoxShadow(
                        blurRadius: 20,
                        offset: Offset(0, -4),
                        color: Color(0x1A000000),
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
                      InkWell(
                        onTap: () => context.go(
                          activeRide != null ? '/tracking' : '/book',
                        ),
                        borderRadius: BorderRadius.circular(18),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                activeRide != null
                                    ? Icons.navigation_rounded
                                    : Icons.search_rounded,
                                color: const Color(0xFF0D6B4A),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                activeRide != null
                                    ? 'Track current ride'
                                    : 'Where to?',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: const Color(0xFF6B7280),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _PillShortcut(
                              icon: Icons.history_rounded,
                              label: '$completedRides completed',
                              highlighted: completedRides > 0,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _PillShortcut(
                              icon: activeRide != null
                                  ? Icons.directions_bike_rounded
                                  : Icons.location_city_rounded,
                              label: activeRide != null
                                  ? '1 active ride'
                                  : '${zones.length} service zones',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          recentRide == null ? 'Getting started' : 'Most recent ride',
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF111827),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      InkWell(
                        onTap: () => context.go(
                          recentRide == null ? '/book' : '/history',
                        ),
                        borderRadius: BorderRadius.circular(16),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 4,
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF3F4F6),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  recentRide == null
                                      ? Icons.search_rounded
                                      : Icons.history_rounded,
                                  size: 18,
                                  color: const Color(0xFF6B7280),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  decoration: const BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(color: Color(0xFFF3F4F6)),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        recentRide?.destinationAddress ??
                                            'Choose destination',
                                        style: theme.textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        recentRide == null
                                            ? 'Tap to request your first live ride'
                                            : recentRide.isCompleted
                                            ? 'Completed ride'
                                            : 'Ride currently in progress',
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          color: const Color(0xFF6B7280),
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
                      if (snapshot.hasError) ...[
                        const SizedBox(height: 12),
                        Text(
                          snapshot.error.toString().replaceFirst('Exception: ', ''),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.red.shade700,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PillShortcut extends StatelessWidget {
  const _PillShortcut({
    required this.icon,
    required this.label,
    this.highlighted = false,
  });

  final IconData icon;
  final String label;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: highlighted ? const Color(0xFFECFDF5) : const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: highlighted
              ? const Color(0xFFD1FAE5)
              : const Color(0xFFE5E7EB),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 16,
            color: highlighted
                ? const Color(0xFF0D6B4A)
                : const Color(0xFF6B7280),
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
                color: highlighted
                    ? const Color(0xFF0D6B4A)
                    : const Color(0xFF374151),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  const _MapGridPainter({required this.color, required this.spacing});

  final Color color;
  final double spacing;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _MapGridPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.spacing != spacing;
  }
}
