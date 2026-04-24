import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';

final passengerWalletRepositoryProvider = Provider<PassengerWalletRepository>((
  ref,
) {
  return PassengerWalletRepository(ref.watch(dioProvider));
});

class WalletRecord {
  const WalletRecord({
    required this.id,
    required this.type,
    required this.currency,
    required this.availableBalance,
    required this.lockedBalance,
  });

  final String id;
  final String type;
  final String currency;
  final double availableBalance;
  final double lockedBalance;

  factory WalletRecord.fromJson(Map<String, dynamic> json) {
    double parse(dynamic value) {
      if (value is num) return value.toDouble();
      return double.tryParse(value?.toString() ?? '') ?? 0;
    }

    return WalletRecord(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      currency: json['currency'] as String? ?? 'GHS',
      availableBalance: parse(json['availableBalance']),
      lockedBalance: parse(json['lockedBalance']),
    );
  }
}

class PassengerWalletRepository {
  PassengerWalletRepository(this._dio);

  final Dio _dio;

  Future<List<WalletRecord>> listUserWallets(String userId) async {
    try {
      final response = await _dio.get<List<dynamic>>('/wallets/users/$userId');
      final rows = response.data ?? const [];
      return rows
          .whereType<Map<String, dynamic>>()
          .map(WalletRecord.fromJson)
          .toList(growable: false);
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
