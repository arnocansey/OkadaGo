import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../rides/data/ride_repository.dart';
import '../../rides/domain/ride_record.dart';
import '../../session/application/session_controller.dart';
import '../../wallet/data/wallet_repository.dart';

class EarningsScreen extends ConsumerStatefulWidget {
  const EarningsScreen({super.key});

  @override
  ConsumerState<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends ConsumerState<EarningsScreen>
    with WidgetsBindingObserver {
  int _reloadTick = 0;
  bool _submittingPayout = false;
  bool _initializingTopUp = false;
  bool _awaitingExternalCheckoutReturn = false;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted) return;
    if (_awaitingExternalCheckoutReturn && state == AppLifecycleState.resumed) {
      setState(() {
        _awaitingExternalCheckoutReturn = false;
        _reloadTick++;
      });
    }
  }

  Future<_EarningsPayload> _loadPayload(String riderProfileId, String userId) async {
    final ridesFuture = ref.read(riderRideRepositoryProvider).listRides();
    final walletsFuture = ref.read(riderWalletRepositoryProvider).listUserWallets(userId);
    final payoutsFuture = ref.read(riderWalletRepositoryProvider).listCurrentRiderPayoutRequests();

    final results = await Future.wait<dynamic>([ridesFuture, walletsFuture, payoutsFuture]);
    final rides = (results[0] as List<RideRecord>)
        .where((ride) => ride.riderProfileId == riderProfileId && ride.isCompleted)
        .toList(growable: false);
    final wallets = results[1] as List<WalletRecord>;
    final payouts = results[2] as List<RiderPayoutRequest>;

    final settlementWallet = wallets.cast<WalletRecord?>().firstWhere(
      (wallet) => _isSettlementWallet(wallet),
      orElse: () => null,
    );

    return _EarningsPayload(
      completedRides: rides,
      wallets: wallets,
      payoutRequests: payouts,
      settlementWallet: settlementWallet,
    );
  }

  Future<void> _openPayoutDialog({
    required BuildContext context,
    required String currency,
    required double availableBalance,
  }) async {
    final amountController = TextEditingController();
    final destinationController = TextEditingController();

    try {
      final submitted = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              18,
              20,
              20 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: StatefulBuilder(
              builder: (context, setModalState) {
                String? modalError;

                Future<void> submit() async {
                  final amount = double.tryParse(amountController.text.trim());
                  final destination = destinationController.text.trim();

                  if (amount == null || amount <= 0) {
                    setModalState(() => modalError = 'Enter a valid payout amount.');
                    return;
                  }
                  if (destination.length < 3) {
                    setModalState(() => modalError = 'Enter a destination label.');
                    return;
                  }

                  setState(() {
                    _submittingPayout = true;
                    _actionError = null;
                  });
                  try {
                    await ref.read(riderWalletRepositoryProvider).createCurrentRiderPayoutRequest(
                          amount: amount,
                          destinationLabel: destination,
                        );
                    if (!context.mounted) return;
                    Navigator.of(context).pop(true);
                  } catch (error) {
                    if (!mounted) return;
                    setModalState(() {
                      modalError = error.toString().replaceFirst('Exception: ', '');
                    });
                    setState(() {
                      _actionError = modalError;
                    });
                  } finally {
                    if (mounted) {
                      setState(() => _submittingPayout = false);
                    }
                  }
                }

                return Column(
                  mainAxisSize: MainAxisSize.min,
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
                    const SizedBox(height: 16),
                    Text(
                      'Request Payout',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Available: ${formatCurrencyAmount(currency, availableBalance)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: amountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Amount ($currency)',
                        hintText: '20.00 minimum',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: destinationController,
                      decoration: const InputDecoration(
                        labelText: 'Destination',
                        hintText: 'MTN MoMo - 024xxxxxxx',
                      ),
                    ),
                    if (modalError != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        modalError!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.red.shade700,
                            ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submittingPayout ? null : submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.amber,
                          foregroundColor: const Color(0xFF78350F),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(_submittingPayout ? 'Submitting...' : 'Submit payout request'),
                      ),
                    ),
                  ],
                );
              },
            ),
          );
        },
      );

      if (submitted == true && mounted) {
        setState(() {
          _reloadTick++;
          _actionError = null;
        });
      }
    } finally {
      amountController.dispose();
      destinationController.dispose();
    }
  }

  Future<void> _openTopUpDialog({
    required BuildContext context,
    required String currency,
  }) async {
    final amountController = TextEditingController();

    try {
      final submitted = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) {
          String? modalError;
          return Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              18,
              20,
              20 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: StatefulBuilder(
              builder: (context, setModalState) {
                Future<void> submit() async {
                  final amount = double.tryParse(amountController.text.trim());
                  if (amount == null || amount <= 0) {
                    setModalState(() => modalError = 'Enter a valid top-up amount.');
                    return;
                  }

                  setState(() {
                    _initializingTopUp = true;
                    _actionError = null;
                  });
                  try {
                    final result = await ref
                        .read(riderWalletRepositoryProvider)
                        .initializePaystackTopUp(
                          amount: amount,
                          currency: currency,
                          walletType: 'rider_settlement',
                          description: 'Rider settlement wallet top-up',
                        );

                    final uri = Uri.tryParse(result.authorizationUrl);
                    if (uri == null) {
                      throw Exception('Invalid Paystack authorization URL returned by backend.');
                    }

                    final launched = await launchUrl(
                      uri,
                      mode: LaunchMode.externalApplication,
                    );
                    if (!launched) {
                      throw Exception('Could not open Paystack checkout page.');
                    }
                    if (mounted) {
                      setState(() {
                        _awaitingExternalCheckoutReturn = true;
                      });
                    }
                    if (!context.mounted) return;
                    Navigator.of(context).pop(true);
                  } catch (error) {
                    final message = error.toString().replaceFirst('Exception: ', '');
                    setModalState(() => modalError = message);
                    setState(() => _actionError = message);
                  } finally {
                    if (mounted) {
                      setState(() => _initializingTopUp = false);
                    }
                  }
                }

                return Column(
                  mainAxisSize: MainAxisSize.min,
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
                    const SizedBox(height: 16),
                    Text(
                      'Top Up Settlement Wallet',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'You will be redirected to Paystack to complete payment.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: amountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Amount ($currency)',
                        hintText: 'Enter top-up amount',
                      ),
                    ),
                    if (modalError != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        modalError!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.red.shade700,
                            ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _initializingTopUp ? null : submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.forest,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(_initializingTopUp ? 'Starting checkout...' : 'Continue to Paystack'),
                      ),
                    ),
                  ],
                );
              },
            ),
          );
        },
      );

      if (submitted == true && mounted) {
        setState(() {
          _reloadTick++;
          _actionError = null;
        });
      }
    } finally {
      amountController.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider);
    final riderProfileId = session?.user.riderProfileId;
    final userId = session?.user.id;
    final currency = session?.user.preferredCurrency ?? 'GHS';

    if (riderProfileId == null || userId == null) {
      return const Scaffold(
        body: Center(child: Text('Sign in to view rider earnings.')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: FutureBuilder<_EarningsPayload>(
          key: ValueKey(_reloadTick),
          future: _loadPayload(riderProfileId, userId),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    snapshot.error.toString().replaceFirst('Exception: ', ''),
                    textAlign: TextAlign.center,
                  ),
                ),
              );
            }

            final payload = snapshot.data!;
            final rides = payload.completedRides;
            final payouts = payload.payoutRequests;
            final settlementWallet = payload.settlementWallet;
            final availableBalance = settlementWallet?.availableBalance ?? 0;
            final lockedBalance = settlementWallet?.lockedBalance ?? 0;
            final gross = rides.fold<double>(
              0,
              (sum, ride) => sum + (ride.finalFare ?? ride.estimatedFare ?? 0),
            );
            final dailyTotals = _buildDailyTotals(rides);
            final maxDaily = dailyTotals.fold<double>(0, (max, amount) => amount > max ? amount : max);

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
                        'Total completed ride earnings',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        formatCurrencyAmount(currency, gross),
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          _SummaryBlock(
                            label: 'Available',
                            value: formatCurrencyAmount(currency, availableBalance),
                          ),
                          _Divider(color: Colors.white.withValues(alpha: 0.2)),
                          _SummaryBlock(
                            label: 'Locked',
                            value: formatCurrencyAmount(currency, lockedBalance),
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
                    Expanded(child: _SmallCard(title: 'Trips', value: '${rides.length}')),
                    const SizedBox(width: 12),
                    Expanded(child: _SmallCard(title: 'Payouts', value: '${payouts.length}')),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SmallCard(
                        title: 'Avg/Trip',
                        value: formatCurrencyAmount(currency, rides.isEmpty ? 0 : gross / rides.length),
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
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 160,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: List.generate(7, (index) {
                            final total = dailyTotals[index];
                            final height = maxDaily == 0 ? 10.0 : (total / maxDaily) * 110 + 10;
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    Container(
                                      height: height,
                                      decoration: BoxDecoration(
                                        color: AppTheme.forest.withValues(alpha: index == 6 ? 1 : 0.28),
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(const ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]),
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
                                  'Rider Settlement Wallet',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: const Color(0xFF64748B),
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  formatCurrencyAmount(currency, availableBalance),
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                        fontWeight: FontWeight.w900,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
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
                      const SizedBox(height: 8),
                      Text(
                        'Minimum payout request is GHS 20 and only one payout can be in progress.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF64748B),
                            ),
                      ),
                      if (_actionError != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          _actionError!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.red.shade700,
                              ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _submittingPayout || availableBalance <= 0
                                  ? null
                                  : () => _openPayoutDialog(
                                        context: context,
                                        currency: currency,
                                        availableBalance: availableBalance,
                                      ),
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
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _initializingTopUp
                                  ? null
                                  : () => _openTopUpDialog(
                                        context: context,
                                        currency: currency,
                                      ),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: AppTheme.forest),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                foregroundColor: AppTheme.forest,
                              ),
                              child: Text(
                                _initializingTopUp ? 'Loading...' : 'Top Up via Paystack',
                              ),
                            ),
                          ),
                        ],
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
                if (payouts.isEmpty)
                  _PayoutTile(
                    title: 'No payouts yet',
                    subtitle: 'Your submitted payout requests will appear here.',
                    amount: formatCurrencyAmount(currency, 0),
                    status: 'REQUESTED',
                  )
                else
                  ...payouts.take(6).map(
                        (payout) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _PayoutTile(
                            title:
                                '${payout.requestedAt.day}/${payout.requestedAt.month}/${payout.requestedAt.year}',
                            subtitle: payout.destinationLabel,
                            amount: formatCurrencyAmount(payout.currency, payout.amount),
                            status: payout.status,
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

class _EarningsPayload {
  const _EarningsPayload({
    required this.completedRides,
    required this.wallets,
    required this.payoutRequests,
    required this.settlementWallet,
  });

  final List<RideRecord> completedRides;
  final List<WalletRecord> wallets;
  final List<RiderPayoutRequest> payoutRequests;
  final WalletRecord? settlementWallet;
}

List<double> _buildDailyTotals(List<RideRecord> rides) {
  final totals = List<double>.filled(7, 0);
  for (final ride in rides) {
    final amount = ride.finalFare ?? ride.estimatedFare ?? 0;
    final createdAt = ride.createdAt;
    if (createdAt == null) continue;
    final weekdayIndex = (createdAt.weekday + 6) % 7;
    totals[weekdayIndex] += amount;
  }
  return totals;
}

bool _isSettlementWallet(WalletRecord? wallet) {
  if (wallet == null) return false;
  final type = wallet.type.toLowerCase();
  return type.contains('rider') && type.contains('settlement');
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
        crossAxisAlignment: alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
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
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
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
    required this.status,
  });

  final String title;
  final String subtitle;
  final String amount;
  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toUpperCase();
    final success = normalized == 'PAID';
    final failed = normalized == 'REJECTED' || normalized == 'CANCELLED';
    final color = success
        ? AppTheme.forest
        : failed
            ? Colors.red.shade700
            : const Color(0xFFB45309);

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
              success
                  ? Icons.check_circle_rounded
                  : failed
                      ? Icons.cancel_rounded
                      : Icons.sync_rounded,
              color: color,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                normalized,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: color,
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
