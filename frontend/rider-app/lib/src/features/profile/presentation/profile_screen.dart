import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/currency_formatter.dart';
import '../../../core/theme/app_theme.dart';
import '../../rides/data/ride_repository.dart';
import '../../rides/domain/ride_record.dart';
import '../../session/application/session_controller.dart';
import '../../wallet/data/wallet_repository.dart';
import '../data/rider_profile_repository.dart';

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
    final approval = (user.riderApprovalStatus ?? 'pending').toLowerCase();
    final approvalLabel = approval == 'approved'
        ? 'Verified Rider'
        : approval == 'pending'
        ? 'Approval Pending'
        : '$approval rider';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: FutureBuilder<List<dynamic>>(
          future: Future.wait<dynamic>([
            ref.read(riderRideRepositoryProvider).listRides(),
            if (user.riderProfileId != null)
              ref.read(riderProfileRepositoryProvider).getProfile(user.riderProfileId!)
            else
              Future.value(null),
            ref.read(riderWalletRepositoryProvider).listUserWallets(user.id),
          ]),
          builder: (context, snapshot) {
            final payload = snapshot.data ?? const <dynamic>[];
            final rideRows = payload.isNotEmpty ? payload[0] as List<RideRecord> : const <RideRecord>[];
            final rides = rideRows
                .where((ride) => ride.riderProfileId == user.riderProfileId)
                .toList(growable: false);
            final profile =
                payload.length > 1 ? payload[1] as RiderProfileSnapshot? : null;
            final wallets =
                payload.length > 2 ? payload[2] as List<WalletRecord> : const <WalletRecord>[];
            final completed = rides.where((ride) => ride.isCompleted).toList();
            final totalEarnings = completed.fold<double>(
              0,
              (sum, ride) => sum + (ride.finalFare ?? ride.estimatedFare ?? 0),
            );
            final completionRate = rides.isEmpty
                ? 0
                : ((completed.length / rides.length) * 100).round();
            final liveTrips = rides
                .where((ride) => !ride.isCompleted && !ride.isCancelled)
                .length;
            final preferredWallet = wallets.where(
              (wallet) => wallet.currency == user.preferredCurrency,
            );
            final wallet = preferredWallet.isNotEmpty
                ? preferredWallet.first
                : (wallets.isNotEmpty ? wallets.first : null);

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
                      Stack(
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
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                          ),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              child: Icon(
                                approval == 'approved'
                                    ? Icons.check_circle_rounded
                                    : Icons.schedule_rounded,
                                color: approval == 'approved'
                                    ? AppTheme.forest
                                    : const Color(0xFFD97706),
                                size: 22,
                              ),
                            ),
                          ),
                        ],
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
                          color: approval == 'approved'
                              ? const Color(0xFFECFDF5)
                              : const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          approvalLabel.toUpperCase(),
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: approval == 'approved'
                                ? AppTheme.forest
                                : const Color(0xFFB45309),
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
                          value: '$liveTrips',
                          label: 'Live',
                        ),
                      ),
                      const _CellDivider(),
                      Expanded(
                        child: _StatCell(
                          value: '$completionRate%',
                          label: 'Completion',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Vehicle Details',
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              profile?.vehicleLabel ?? 'Vehicle not submitted yet',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: const Color(0xFF0F172A),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              profile?.serviceZoneName != null
                                  ? 'Service zone: ${profile!.serviceZoneName}'
                                  : 'Service zone will appear here once assigned.',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF64748B),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (profile?.city != null && profile!.city!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                'City: ${profile.city}',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.two_wheeler_rounded,
                          color: Color(0xFF334155),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Wallet',
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
                            ? 'Settlements and bonuses will appear here when funds are posted.'
                            : 'Locked balance: ${formatCurrencyAmount(wallet.currency, wallet.lockedBalance)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Total earned from completed rides: ${formatCurrencyAmount(user.preferredCurrency, totalEarnings)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF0F172A),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Verification',
                  child: Column(
                    children: [
                      _InfoRow(
                        label: 'Approval status',
                        value: approvalLabel,
                      ),
                      _InfoRow(
                        label: 'Online status',
                        value: profile?.onlineStatus == true ? 'Online' : 'Offline',
                      ),
                      _InfoRow(
                        label: 'Service zone',
                        value: profile?.serviceZoneName ?? 'Not assigned yet',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Settings',
                  child: Column(
                    children: [
                      const _ProfileActionRow(
                        icon: Icons.notifications_outlined,
                        label: 'Notification Settings',
                      ),
                      const _ProfileActionRow(
                        icon: Icons.account_balance_wallet_outlined,
                        label: 'Payout Settings',
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
    if (parts.isEmpty) return 'R';
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

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF64748B),
              ),
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: const Color(0xFF0F172A),
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
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
