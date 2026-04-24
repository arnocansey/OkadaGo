import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../profile/data/rider_profile_repository.dart';
import '../../../rides/application/current_ride_controller.dart';
import '../../../rides/data/ride_repository.dart';
import '../../../rides/domain/ride_record.dart';
import '../../../rides/presentation/widgets/rider_live_location_sync.dart';
import '../../../session/application/session_controller.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _online = false;
  bool _updatingStatus = false;
  bool _hasOnlineOverride = false;
  String? _error;

  Future<void> _toggleOnline(bool nextValue) async {
    final user = ref.read(sessionControllerProvider)?.user;
    final riderProfileId = user?.riderProfileId;
    if (riderProfileId == null) {
      setState(
        () => _error = 'Rider profile is not available for this session.',
      );
      return;
    }

    setState(() {
      _updatingStatus = true;
      _hasOnlineOverride = true;
      _online = nextValue;
      _error = null;
    });

    try {
      await ref
          .read(riderRideRepositoryProvider)
          .updateAvailability(
            riderProfileId: riderProfileId,
            onlineStatus: nextValue,
          );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _updatingStatus = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(sessionControllerProvider)?.user;
    final riderProfileId = user?.riderProfileId;

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
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: FutureBuilder<List<dynamic>>(
          future: riderProfileId == null
              ? Future.value([const <RideRecord>[], null])
              : Future.wait<dynamic>([
                  ref.read(riderRideRepositoryProvider).listRides(),
                  ref.read(riderProfileRepositoryProvider).getProfile(riderProfileId),
                ]),
          builder: (context, snapshot) {
            final payload = snapshot.data ?? const <dynamic>[];
            final rideRows = payload.isNotEmpty ? payload[0] as List<RideRecord> : const <RideRecord>[];
            final rides = rideRows
                .where((ride) => ride.riderProfileId == riderProfileId)
                .toList(growable: false);
            final profile =
                payload.length > 1 ? payload[1] as RiderProfileSnapshot? : null;

            if (!_hasOnlineOverride && profile != null) {
              _online = profile.onlineStatus;
            }

            RideRecord? activeRequest;
            RideRecord? activeTrip;
            for (final ride in rides) {
              if (activeRequest == null && ride.status == 'assigned') {
                activeRequest = ride;
              }
              if (activeTrip == null &&
                  (ride.status == 'started' ||
                      ride.status == 'arriving' ||
                      ride.status == 'arrived')) {
                activeTrip = ride;
              }
            }

            final completed = rides
                .where((ride) => ride.isCompleted)
                .toList(growable: false);
            final now = DateTime.now();
            final todayEarnings = completed
                .where((ride) => _isSameDay(ride.createdAt, now))
                .fold<double>(
                  0,
                  (sum, ride) => sum + (ride.finalFare ?? ride.estimatedFare ?? 0),
                );
            final weekEarnings = completed
                .where((ride) {
                  if (ride.createdAt == null) return false;
                  return !ride.createdAt!.isBefore(
                    now.subtract(const Duration(days: 7)),
                  );
                })
                .fold<double>(
                  0,
                  (sum, ride) => sum + (ride.finalFare ?? ride.estimatedFare ?? 0),
                );
            final openTrips = rides
                .where((ride) => !ride.isCompleted && !ride.isCancelled)
                .length;

            final currentRide = activeRequest ?? activeTrip;
            if (currentRide != null) {
              ref.read(currentRideProvider.notifier).setRide(currentRide);
            }

            final isOnline = _online;

            return Stack(
              children: [
                ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
                  children: [
                Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppTheme.forest,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        'O',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'OkadaGo',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        if (profile?.city != null && profile!.city!.isNotEmpty)
                          Text(
                            profile.city!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF64748B),
                            ),
                          ),
                      ],
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () {},
                      style: IconButton.styleFrom(backgroundColor: Colors.white),
                      icon: const Icon(
                        Icons.notifications_none_rounded,
                        color: Color(0xFF374151),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Stack(
                    children: [
                      AnimatedAlign(
                        duration: const Duration(milliseconds: 250),
                        alignment: isOnline
                            ? Alignment.centerLeft
                            : Alignment.centerRight,
                        child: FractionallySizedBox(
                          widthFactor: 0.5,
                          child: Container(
                            height: 48,
                            decoration: BoxDecoration(
                              color: isOnline
                                  ? AppTheme.forest
                                  : const Color(0xFF9CA3AF),
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: TextButton(
                              onPressed: _updatingStatus
                                  ? null
                                  : () => _toggleOnline(true),
                              child: Text(
                                'ONLINE',
                                style: TextStyle(
                                  color: isOnline
                                      ? Colors.white
                                      : const Color(0xFF6B7280),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: TextButton(
                              onPressed: _updatingStatus
                                  ? null
                                  : () => _toggleOnline(false),
                              child: Text(
                                'OFFLINE',
                                style: TextStyle(
                                  color: !isOnline
                                      ? Colors.white
                                      : const Color(0xFF6B7280),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppTheme.forest, Color(0xFF0A5238)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [
                      BoxShadow(
                        blurRadius: 20,
                        offset: Offset(0, 10),
                        color: Color(0x22000000),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Today's Earnings",
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.78),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${user.preferredCurrency} ${todayEarnings.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          _InlineStat(
                            label: 'Trips',
                            value: '${rides.length}',
                            alignEnd: false,
                          ),
                          _VerticalDivider(
                            color: Colors.white.withValues(alpha: 0.22),
                          ),
                          _InlineStat(
                            label: 'Online',
                            value: isOnline ? 'Live' : 'Paused',
                            alignEnd: true,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(
                        title: 'This Week',
                        value:
                            '${user.preferredCurrency} ${weekEarnings.toStringAsFixed(0)}',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MetricCard(
                        title: 'Open Trips',
                        value: '$openTrips live',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MetricCard(
                        title: 'Completion',
                        value: rides.isEmpty
                            ? '0%'
                            : '${((completed.length / rides.length) * 100).round()}%',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (activeRequest != null)
                  _RequestBanner(
                    ride: activeRequest,
                    onTap: () => context.go('/request'),
                  )
                else if (activeTrip != null)
                  _ActiveTripBanner(
                    ride: activeTrip,
                    onTap: () {
                      final route = activeTrip!.status == 'started'
                          ? '/active-trip'
                          : '/navigation';
                      context.go(route);
                    },
                  )
                else
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F3EF),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: AppTheme.forest.withValues(alpha: 0.20),
                      ),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: AppTheme.forest.withValues(alpha: 0.10),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.place_rounded,
                            color: AppTheme.forest,
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'All clear',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isOnline
                              ? 'Waiting for a live ride request in your service zone.'
                              : 'Go online to start receiving ride requests.',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.red.shade700,
                    ),
                  ),
                ],
                const SizedBox(height: 22),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Trips',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      profile?.serviceZoneName ?? 'Live data',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppTheme.forest,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (completed.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Text(
                      'Completed trips will appear here once your rides start finishing.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  )
                else
                  ...completed.take(3).map(
                        (ride) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _TripTile(ride: ride),
                        ),
                      ),
                  ],
                ),
                RiderLiveLocationSync(
                  riderProfileId: riderProfileId,
                  online: isOnline,
                  ride: currentRide,
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  bool _isSameDay(DateTime? left, DateTime right) {
    if (left == null) return false;
    return left.year == right.year &&
        left.month == right.month &&
        left.day == right.day;
  }
}

class _InlineStat extends StatelessWidget {
  const _InlineStat({
    required this.label,
    required this.value,
    required this.alignEnd,
  });

  final String label;
  final String value;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: alignEnd
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  const _VerticalDivider({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 34,
      color: color,
      margin: const EdgeInsets.symmetric(horizontal: 14),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _RequestBanner extends StatelessWidget {
  const _RequestBanner({required this.ride, required this.onTap});

  final RideRecord ride;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          children: [
            Text(
              'New Ride Request',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppTheme.forest,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              ride.passengerName ?? 'Passenger',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              '${ride.estimatedDistanceKm?.toStringAsFixed(1) ?? '--'} km - ~${ride.estimatedDurationMinutes ?? '--'} min',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 14),
            Text(
              '${ride.currency} ${(ride.estimatedFare ?? 0).toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: const Color(0xFFB45309),
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActiveTripBanner extends StatelessWidget {
  const _ActiveTripBanner({required this.ride, required this.onTap});

  final RideRecord ride;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF1A231E),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF86EFAC),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Trip in progress',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              ride.destinationAddress,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${ride.estimatedDistanceKm?.toStringAsFixed(1) ?? '--'} km remaining',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}

class _TripTile extends StatelessWidget {
  const _TripTile({required this.ride});

  final RideRecord ride;

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Icon(
              Icons.navigation_rounded,
              color: Color(0xFF9CA3AF),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ride.destinationAddress,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  ride.createdAt != null
                      ? formatter.format(ride.createdAt!)
                      : 'Recent trip',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${ride.currency} ${(ride.finalFare ?? ride.estimatedFare ?? 0).toStringAsFixed(2)}',
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                'Completed',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppTheme.forest,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
