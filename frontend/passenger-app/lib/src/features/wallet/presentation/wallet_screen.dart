import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/utils/currency_formatter.dart';
import '../../session/application/session_controller.dart';
import '../data/wallet_repository.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen>
    with WidgetsBindingObserver {
  int _reloadTick = 0;
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
                        .read(passengerWalletRepositoryProvider)
                        .initializePaystackTopUp(
                          amount: amount,
                          currency: currency,
                          walletType: 'passenger_cashless',
                          description: 'Passenger wallet top-up',
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
                      'Top Up Wallet',
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
        key: ValueKey(_reloadTick),
        future: ref.read(passengerWalletRepositoryProvider).listUserWallets(user.id),
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
                'Your balances below are loaded from the live backend wallet ledger.',
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
                            ? 'No wallet has been created for this account yet.'
                            : 'Locked balance: ${formatCurrencyAmount(preferredWallet.currency, preferredWallet.lockedBalance)}',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _initializingTopUp
                              ? null
                              : () => _openTopUpDialog(
                                    context: context,
                                    currency: user.preferredCurrency,
                                  ),
                          child: Text(_initializingTopUp ? 'Loading...' : 'Top Up via Paystack'),
                        ),
                      ),
                      if (_actionError != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          _actionError!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.red.shade700,
                          ),
                        ),
                      ],
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
                  'No wallets found yet. Top up from the web or operator console to see balances here.',
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
