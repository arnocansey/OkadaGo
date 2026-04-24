import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/utils/currency_formatter.dart';
import '../../../core/theme/app_theme.dart';
import '../../rides/data/ride_repository.dart';
import '../../rides/domain/ride_record.dart';
import '../../session/application/session_controller.dart';
import '../../wallet/data/wallet_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionControllerProvider)?.user;
    if (user == null) {
      return Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign in to view your profile'),
          ),
        ),
      );
    }

    final initials = _initials(user.fullName);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: FutureBuilder<List<dynamic>>(
          future: Future.wait<dynamic>([
            ref.read(passengerRideRepositoryProvider).listRides(),
            ref.read(passengerWalletRepositoryProvider).listUserWallets(user.id),
          ]),
          builder: (context, snapshot) {
            final payload = snapshot.data ?? const <dynamic>[];
            final rideRows = payload.isNotEmpty ? payload[0] as List<RideRecord> : const <RideRecord>[];
            final walletRows =
                payload.length > 1 ? payload[1] as List<WalletRecord> : const <WalletRecord>[];
            final rides = rideRows
                .where((ride) => ride.passengerProfileId == user.passengerProfileId)
                .toList(growable: false);
            final wallets = walletRows;
            final completedRides = rides.where((ride) => ride.isCompleted).toList();
            final activeRides = rides
                .where((ride) => !ride.isCompleted && !ride.isCancelled)
                .length;
            final totalSpend = completedRides.fold<double>(
              0,
              (sum, ride) => sum + (ride.finalFare ?? ride.estimatedFare ?? 0),
            );
            final preferredWallet = wallets.where(
              (wallet) => wallet.currency == user.preferredCurrency,
            );
            final wallet = preferredWallet.isNotEmpty
                ? preferredWallet.first
                : (wallets.isNotEmpty ? wallets.first : null);
            final recentRides = [...rides]
              ..sort((a, b) {
                final aTime = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
                final bTime = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
                return bTime.compareTo(aTime);
              });

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
              children: [
                Row(
                  children: [
                    Text(
                      'Profile',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => context.go('/wallet'),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white,
                        side: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      icon: const Icon(Icons.account_balance_wallet_outlined),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: const BoxDecoration(
                          color: AppTheme.forest,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          initials,
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        user.fullName,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: const Color(0xFF0F172A),
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        user.phoneE164,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (user.email != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          user.email!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${user.preferredCurrency} account'.toUpperCase(),
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppTheme.forest,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _StatCell(
                          value: '${rides.length}',
                          label: 'Trips',
                        ),
                      ),
                      const _CellDivider(),
                      Expanded(
                        child: _StatCell(
                          value: '$activeRides',
                          label: 'Active',
                        ),
                      ),
                      const _CellDivider(),
                      Expanded(
                        child: _StatCell(
                          value:
                              formatCurrencyAmount(user.preferredCurrency, totalSpend),
                          label: 'Spent',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Wallet',
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              wallet == null
                                  ? formatCurrencyAmount(user.preferredCurrency, 0)
                                  : formatCurrencyAmount(wallet.currency, wallet.availableBalance),
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: const Color(0xFF0F172A),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              wallet == null
                                  ? 'Your wallet will appear here once funding or promotions are posted.'
                                  : 'Locked balance: ${formatCurrencyAmount(wallet.currency, wallet.lockedBalance)}',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton(
                        onPressed: () => context.go('/wallet'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.forest,
                          side: const BorderSide(color: Color(0xFFD1FAE5)),
                        ),
                        child: const Text('Open wallet'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Recent rides',
                  child: recentRides.isEmpty
                      ? Text(
                          'Your completed and active rides will appear here once you start booking.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                        )
                      : Column(
                          children: recentRides.take(3).map((ride) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _RideTile(ride: ride),
                            );
                          }).toList(),
                        ),
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Settings',
                  child: Column(
                    children: [
                      const _ProfileActionRow(
                        icon: Icons.receipt_long_outlined,
                        label: 'Trip history',
                      ),
                      const _ProfileActionRow(
                        icon: Icons.help_outline_rounded,
                        label: 'Help Center',
                      ),
                      const _ProfileActionRow(
                        icon: Icons.shield_outlined,
                        label: 'Privacy Policy',
                      ),
                      _ProfileActionRow(
                        icon: Icons.logout_rounded,
                        label: 'Logout',
                        danger: true,
                        onTap: () async {
                          await ref.read(sessionControllerProvider.notifier).signOut();
                          if (!context.mounted) return;
                          context.go('/login');
                        },
                      ),
                    ],
                  ),
                ),
                if (snapshot.hasError) ...[
                  const SizedBox(height: 12),
                  Text(
                    snapshot.error.toString().replaceFirst('Exception: ', ''),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.red.shade700,
                    ),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  String _initials(String name) {
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

class _StatCell extends StatelessWidget {
  const _StatCell({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: const Color(0xFF64748B),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _CellDivider extends StatelessWidget {
  const _CellDivider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 32, color: const Color(0xFFF1F5F9));
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: const Color(0xFF0F172A),
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _RideTile extends StatelessWidget {
  const _RideTile({required this.ride});

  final RideRecord ride;

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d');

    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Icon(
            ride.isCompleted ? Icons.check_rounded : Icons.navigation_rounded,
            color: ride.isCompleted ? AppTheme.forest : AppTheme.orange,
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
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                ride.createdAt == null
                    ? 'Recent ride'
                    : formatter.format(ride.createdAt!),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
        Text(
          formatCurrencyAmount(ride.currency, ride.finalFare ?? ride.estimatedFare ?? 0),
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _ProfileActionRow extends StatelessWidget {
  const _ProfileActionRow({
    required this.icon,
    required this.label,
    this.danger = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool danger;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: danger
                    ? const Color(0xFFFEF2F2)
                    : const Color(0xFFF8FAFC),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: danger ? Colors.red : const Color(0xFF64748B),
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: danger ? Colors.red : const Color(0xFF0F172A),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            if (!danger)
              const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }
}
