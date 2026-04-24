import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../session/application/session_controller.dart';
import '../data/ride_repository.dart';
import '../domain/ride_record.dart';

class RideHistoryScreen extends ConsumerWidget {
  const RideHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    final passengerProfileId = session?.user.passengerProfileId;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: FutureBuilder<List<RideRecord>>(
          future: ref.read(passengerRideRepositoryProvider).listRides(),
          builder: (context, snapshot) {
            final rides = (snapshot.data ?? const <RideRecord>[])
                .where((ride) => ride.passengerProfileId == passengerProfileId)
                .toList(growable: false);

            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
              children: [
                Text(
                  'Ride History',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Completed, cancelled, and upcoming rides',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 18),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (snapshot.hasError)
                  _EmptyState(
                    title: 'Unable to load rides',
                    body: snapshot.error.toString().replaceFirst(
                      'Exception: ',
                      '',
                    ),
                  )
                else if (rides.isEmpty)
                  const _EmptyState(
                    title: 'No rides yet',
                    body:
                        'Your booked trips will appear here once you request your first ride.',
                  )
                else
                  ...rides.map(
                    (ride) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _RideCard(ride: ride),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _RideCard extends StatelessWidget {
  const _RideCard({required this.ride});

  final RideRecord ride;

  @override
  Widget build(BuildContext context) {
    final currency = ride.currency;
    final amount = ride.finalFare ?? ride.estimatedFare ?? 0;
    final formatter = DateFormat('MMM d, HH:mm');
    final statusColor = switch (ride.status) {
      'completed' => const Color(0xFF0D6B4A),
      'cancelled' => Colors.red,
      _ => const Color(0xFFB45309),
    };

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.two_wheeler_rounded,
                  color: Color(0xFF0D6B4A),
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
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      ride.createdAt != null
                          ? formatter.format(ride.createdAt!)
                          : 'Recent ride',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '$currency ${amount.toStringAsFixed(2)}',
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.circle, size: 12, color: Color(0xFF0D6B4A)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  ride.pickupAddress,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.circle, size: 12, color: Colors.red),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  ride.destinationAddress,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${ride.estimatedDurationMinutes ?? '--'} min - ${ride.estimatedDistanceKm?.toStringAsFixed(1) ?? '--'} km',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: const Color(0xFF64748B)),
              ),
              Text(
                ride.status.toUpperCase(),
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: statusColor,
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

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          const Icon(Icons.history_rounded, size: 48, color: Color(0xFF0D6B4A)),
          const SizedBox(height: 14),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}
