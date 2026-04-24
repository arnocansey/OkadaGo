import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';
import '../../session/domain/auth_session.dart';

final riderAuthRepositoryProvider = Provider<RiderAuthRepository>((ref) {
  return RiderAuthRepository(ref.watch(dioProvider));
});

class RiderAuthRepository {
  RiderAuthRepository(this._dio);

  final Dio _dio;

  String _normalizeDigits(String value) {
    return value.replaceAll(RegExp(r'\D'), '');
  }

  String _normalizeLocalPhone(String phoneLocal, String countryCode) {
    final digits = _normalizeDigits(phoneLocal);
    final countryDigits = _normalizeDigits(countryCode);
    if (digits.startsWith(countryDigits)) {
      return digits.substring(countryDigits.length);
    }
    if (digits.startsWith('0') && digits.length > 1) {
      return digits.substring(1);
    }
    return digits;
  }

  String? _buildPhoneE164(String countryCode, String phoneLocal) {
    final local = _normalizeLocalPhone(phoneLocal, countryCode);
    if (local.isEmpty) return null;
    return '$countryCode$local';
  }

  Future<AuthSession> login({
    required String countryCode,
    required String phoneLocal,
    required String password,
    required Map<String, dynamic> device,
  }) async {
    try {
      final normalizedLocal = _normalizeLocalPhone(phoneLocal, countryCode);
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/rider/login',
        data: {
          'phoneLocal': normalizedLocal.isEmpty ? phoneLocal : normalizedLocal,
          'phoneE164': _buildPhoneE164(countryCode, phoneLocal),
          'password': password,
          'device': device,
        },
      );

      return AuthSession.fromJson(response.data!);
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<AuthSession> signup({
    required String fullName,
    String? email,
    required String countryCode,
    required String phoneLocal,
    required String password,
    String? city,
    String preferredCurrency = 'GHS',
    Map<String, dynamic>? device,
  }) async {
    try {
      final normalizedLocal = _normalizeLocalPhone(phoneLocal, countryCode);
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/rider/signup',
        data: {
          'fullName': fullName,
          'email': email?.trim().isEmpty ?? true ? null : email?.trim(),
          'phoneCountryCode': countryCode,
          'phoneLocal': normalizedLocal,
          'phoneE164': _buildPhoneE164(countryCode, phoneLocal),
          'preferredCurrency': preferredCurrency,
          'city': city,
          'password': password,
          'device': device,
        },
      );

      return AuthSession.fromJson(response.data!);
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
