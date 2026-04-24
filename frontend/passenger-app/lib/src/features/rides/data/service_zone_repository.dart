import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';
import '../domain/service_zone.dart';

final passengerServiceZoneRepositoryProvider = Provider<ServiceZoneRepository>((
  ref,
) {
  return ServiceZoneRepository(ref.watch(dioProvider));
});

class ServiceZoneRepository {
  ServiceZoneRepository(this._dio);

  final Dio _dio;

  Future<List<ServiceZone>> listZones() async {
    try {
      final response = await _dio.get<List<dynamic>>(
        '/bootstrap/service-zones',
      );
      final rows = response.data ?? const [];
      return rows
          .whereType<Map<String, dynamic>>()
          .map(ServiceZone.fromJson)
          .toList(growable: false);
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
