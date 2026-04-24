import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/currency_formatter.dart';
import '../../../core/theme/app_theme.dart';
import '../../rides/domain/ride_record.dart';
import '../../rides/data/ride_repository.dart';
import '../../session/application/session_controller.dart';

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final riderProfileId = ref
        .watch(sessionControllerProvider)
        ?.user
        .riderProfileId;
    final currency =
        ref.watch(sessionControllerProvider)?.user.preferredCurrency ?? 'GHS';

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: FutureBuilder<List<RideRecord>>(
          future: ref.read(riderRideRepositoryProvider).listRides(),
          builder: (context, snapshot) {
            final rides = (snapshot.data ?? const <RideRecord>[])
                .where(
                  (ride) =>
                      ride.riderProfileId == riderProfileId && ride.isCompleted,
                )
                .toList(growable: false);
            final gross = rides.fold<double>(
              0,
              (sum, ride) => sum + (ride.finalFare ?? ride.estimatedFare ?? 0),
            );
            final availableBalance = gross * 0.45;

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
              children: [
                Text(
                  'Earnings',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: const [
                    _PeriodChip(label: 'Today'),
                    SizedBox(width: 8),
                    _PeriodChip(label: 'This Week', selected: true),
                    SizedBox(width: 8),
                    _PeriodChip(label: 'This Month'),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppTheme.forest, Color(0xFF0A5238)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Net earnings this week',
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        formatCurrencyAmount(currency, gross),
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          _SummaryBlock(
                            label: 'Gross',
                            value: formatCurrencyAmount(currency, gross),
                          ),
                          _Divider(color: Colors.white.withValues(alpha: 0.20)),
                          _SummaryBlock(
                            label: 'Platform Fee',
                            value: formatCurrencyAmount(currency, gross * 0.1),
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
                      child: _SmallCard(
                        title: 'Trips',
                        value: '${rides.length}',
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: _SmallCard(title: 'Online', value: '38h'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SmallCard(
                        title: 'Avg/Trip',
                        value: formatCurrencyAmount(
                          currency,
                          rides.isEmpty ? 0 : (gross / rides.length),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Daily Breakdown',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 160,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: List.generate(7, (index) {
                            final height = <double>[
                              40,
                              60,
                              30,
                              80,
                              100,
                              70,
                              20,
                            ][index];
                            final active = index == 4;
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    Container(
                                      height: height,
                                      decoration: BoxDecoration(
                                        color: active
                                            ? AppTheme.forest
                                            : AppTheme.forest.withValues(
                                                alpha: 0.20,
                                              ),
                                        borderRadius:
                                            const BorderRadius.vertical(
                                              top: Radius.circular(8),
                                            ),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      [
                                        'M',
                                        'T',
                                        'W',
                                        'T',
                                        'F',
                                        'S',
                                        'S',
                                      ][index],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Available Balance',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: const Color(0xFF64748B),
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  formatCurrencyAmount(currency, availableBalance),
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(fontWeight: FontWeight.w900),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'MTN MoMo',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF92400E),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.amber,
                            foregroundColor: const Color(0xFF78350F),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text('Cash Out Now'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  'Recent Payouts',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(28),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (rides.isEmpty)
                  _PayoutTile(
                    title: 'No payouts yet',
                    subtitle:
                        'Completed rides will start generating payout-ready balances.',
                    amount: '$currency 0.00',
                    success: false,
                  )
                else
                  ...rides
                      .take(3)
                      .map(
                        (ride) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _PayoutTile(
                            title: ride.createdAt != null
                                ? '${ride.createdAt!.day}/${ride.createdAt!.month}/${ride.createdAt!.year}'
                                : 'Recent ride',
                            subtitle: 'MTN Mobile Money',
                            amount:
                                formatCurrencyAmount(
                                  currency,
                                  ride.finalFare ?? ride.estimatedFare ?? 0,
                                ),
                            success: true,
                          ),
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

class _PeriodChip extends StatelessWidget {
  const _PeriodChip({required this.label, this.selected = false});

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: selected ? AppTheme.forest : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: selected ? Colors.white : const Color(0xFF4B5563),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _SummaryBlock extends StatelessWidget {
  const _SummaryBlock({
    required this.label,
    required this.value,
    this.alignEnd = false,
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
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 30,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: color,
    );
  }
}

class _SmallCard extends StatelessWidget {
  const _SmallCard({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _PayoutTile extends StatelessWidget {
  const _PayoutTile({
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.success,
  });

  final String title;
  final String subtitle;
  final String amount;
  final bool success;

  @override
  Widget build(BuildContext context) {
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
            child: Icon(
              success ? Icons.check_circle_rounded : Icons.sync_rounded,
              color: success ? AppTheme.forest : AppTheme.amber,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
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
                amount,
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                success ? 'COMPLETED' : 'PROCESSING',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: success ? AppTheme.forest : const Color(0xFFB45309),
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
