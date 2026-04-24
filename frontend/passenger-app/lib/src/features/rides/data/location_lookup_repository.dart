import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';

final passengerLocationLookupRepositoryProvider =
    Provider<LocationLookupRepository>((ref) {
  return LocationLookupRepository(ref.watch(dioProvider));
});

class ReverseGeocodeResult {
  const ReverseGeocodeResult({
    required this.label,
    required this.displayName,
    required this.latitude,
    required this.longitude,
  });

  factory ReverseGeocodeResult.fromJson(Map<String, dynamic> json) {
    double parseNumber(dynamic value) =>
        value is num ? value.toDouble() : double.parse(value.toString());

    return ReverseGeocodeResult(
      label: (json['label'] as String?)?.trim().isNotEmpty == true
          ? (json['label'] as String).trim()
          : 'Current location',
      displayName: (json['displayName'] as String?)?.trim(),
      latitude: parseNumber(json['latitude'] ?? 0),
      longitude: parseNumber(json['longitude'] ?? 0),
    );
  }

  final String label;
  final String? displayName;
  final double latitude;
  final double longitude;
}

class LocationLookupRepository {
  LocationLookupRepository(this._dio);

  final Dio _dio;

  Future<ReverseGeocodeResult> reverseGeocode({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/bootstrap/reverse-geocode',
        queryParameters: {'lat': latitude, 'lon': longitude},
      );

      return ReverseGeocodeResult.fromJson(response.data ?? const {});
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
