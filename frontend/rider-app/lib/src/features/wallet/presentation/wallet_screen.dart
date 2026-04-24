import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/currency_formatter.dart';
import '../../session/application/session_controller.dart';
import '../data/wallet_repository.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final user = ref.watch(sessionControllerProvider)?.user;

    if (user == null) {
      return SafeArea(
        child: Center(
          child: Text(
            'Sign in to load your wallet.',
            style: theme.textTheme.bodyLarge,
          ),
        ),
      );
    }

    return SafeArea(
      child: FutureBuilder<List<WalletRecord>>(
        future: ref.read(riderWalletRepositoryProvider).listUserWallets(user.id),
        builder: (context, snapshot) {
          final wallets = snapshot.data ?? const <WalletRecord>[];
          final preferredWallet =
              wallets.where((wallet) => wallet.currency == user.preferredCurrency).isNotEmpty
              ? wallets.firstWhere(
                  (wallet) => wallet.currency == user.preferredCurrency,
                )
              : (wallets.isNotEmpty ? wallets.first : null);

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
            children: [
              Text('Wallet', style: theme.textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                'Your rider balances below are loaded from the live backend wallet ledger.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 18),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Available balance', style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 6),
                      Text(
                        preferredWallet == null
                            ? formatCurrencyAmount(user.preferredCurrency, 0)
                            : formatCurrencyAmount(
                                preferredWallet.currency,
                                preferredWallet.availableBalance,
                              ),
                        style: theme.textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        preferredWallet == null
                            ? 'No rider wallet has been created for this account yet.'
                            : 'Locked balance: ${formatCurrencyAmount(preferredWallet.currency, preferredWallet.lockedBalance)}',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              if (snapshot.connectionState == ConnectionState.waiting)
                const Center(child: CircularProgressIndicator())
              else if (snapshot.hasError)
                Text(
                  snapshot.error.toString().replaceFirst('Exception: ', ''),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.red.shade700,
                  ),
                )
              else if (wallets.isEmpty)
                Text(
                  'No wallets found yet. Completed rides and operator top-ups will appear here.',
                  style: theme.textTheme.bodyMedium,
                )
              else
                ...wallets.map(
                  (wallet) => Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      title: Text(wallet.type.replaceAll('_', ' ')),
                      subtitle: Text(
                        'Locked ${formatCurrencyAmount(wallet.currency, wallet.lockedBalance)}',
                      ),
                      trailing: Text(
                        formatCurrencyAmount(wallet.currency, wallet.availableBalance),
                      ),
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
