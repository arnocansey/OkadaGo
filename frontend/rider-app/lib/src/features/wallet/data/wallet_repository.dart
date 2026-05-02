import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';

final riderWalletRepositoryProvider = Provider<RiderWalletRepository>((ref) {
  return RiderWalletRepository(ref.watch(dioProvider));
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

class RiderPayoutRequest {
  const RiderPayoutRequest({
    required this.id,
    required this.method,
    required this.status,
    required this.amount,
    required this.currency,
    required this.destinationLabel,
    required this.requestedAt,
    this.reviewedAt,
    this.paidAt,
    this.rejectionReason,
  });

  final String id;
  final String method;
  final String status;
  final double amount;
  final String currency;
  final String destinationLabel;
  final DateTime requestedAt;
  final DateTime? reviewedAt;
  final DateTime? paidAt;
  final String? rejectionReason;

  factory RiderPayoutRequest.fromJson(Map<String, dynamic> json) {
    double parseAmount(dynamic value) {
      if (value is num) return value.toDouble();
      return double.tryParse(value?.toString() ?? '') ?? 0;
    }

    DateTime? parseDate(dynamic value) {
      final raw = value?.toString();
      if (raw == null || raw.isEmpty) return null;
      return DateTime.tryParse(raw);
    }

    return RiderPayoutRequest(
      id: json['id'] as String? ?? '',
      method: json['method'] as String? ?? 'MOBILE_MONEY',
      status: json['status'] as String? ?? 'REQUESTED',
      amount: parseAmount(json['amount']),
      currency: json['currency'] as String? ?? 'GHS',
      destinationLabel: json['destinationLabel'] as String? ?? 'Destination',
      requestedAt: parseDate(json['requestedAt']) ?? DateTime.now(),
      reviewedAt: parseDate(json['reviewedAt']),
      paidAt: parseDate(json['paidAt']),
      rejectionReason: json['rejectionReason'] as String?,
    );
  }
}

class WalletTopUpInitialization {
  const WalletTopUpInitialization({
    required this.reference,
    required this.authorizationUrl,
    this.accessCode,
  });

  final String reference;
  final String authorizationUrl;
  final String? accessCode;

  factory WalletTopUpInitialization.fromJson(Map<String, dynamic> json) {
    return WalletTopUpInitialization(
      reference: json['reference'] as String? ?? '',
      authorizationUrl: json['authorizationUrl'] as String? ?? '',
      accessCode: json['accessCode'] as String?,
    );
  }
}

class RiderWalletRepository {
  RiderWalletRepository(this._dio);

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

  Future<List<RiderPayoutRequest>> listCurrentRiderPayoutRequests() async {
    try {
      final response = await _dio.get<List<dynamic>>('/wallets/rider/payout-requests');
      final rows = response.data ?? const [];
      return rows
          .whereType<Map<String, dynamic>>()
          .map(RiderPayoutRequest.fromJson)
          .toList(growable: false);
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<RiderPayoutRequest> createCurrentRiderPayoutRequest({
    required double amount,
    required String destinationLabel,
    String method = 'MOBILE_MONEY',
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/wallets/rider/payout-requests',
        data: {
          'amount': amount,
          'method': method,
          'destinationLabel': destinationLabel,
        },
      );
      final payoutRequest =
          response.data?['payoutRequest'] as Map<String, dynamic>? ?? const {};
      return RiderPayoutRequest.fromJson(payoutRequest);
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<WalletTopUpInitialization> initializePaystackTopUp({
    required double amount,
    String walletType = 'rider_settlement',
    String? currency,
    String? description,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/wallets/top-up/paystack/initialize',
        data: {
          'amount': amount,
          'walletType': walletType,
          'currency': currency,
          'description': description,
        }..removeWhere((key, value) => value == null),
      );
      return WalletTopUpInitialization.fromJson(response.data ?? const {});
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
