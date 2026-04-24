import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';

final riderProfileRepositoryProvider = Provider<RiderProfileRepository>((ref) {
  return RiderProfileRepository(ref.watch(dioProvider));
});

class RiderProfileSnapshot {
  const RiderProfileSnapshot({
    required this.id,
    required this.city,
    required this.onlineStatus,
    required this.serviceZoneName,
    required this.vehicleLabel,
  });

  final String id;
  final String? city;
  final bool onlineStatus;
  final String? serviceZoneName;
  final String? vehicleLabel;
}

class RiderProfileRepository {
  RiderProfileRepository(this._dio);

  final Dio _dio;

  Future<RiderProfileSnapshot?> getProfile(String riderProfileId) async {
    try {
      final response = await _dio.get<List<dynamic>>('/bootstrap/riders?limit=100');
      final rows = response.data ?? const [];

      for (final row in rows) {
        if (row is! Map<String, dynamic>) continue;
        if (row['id'] != riderProfileId) continue;

        final vehicle = row['vehicle'] as Map<String, dynamic>?;
        final vehicleParts = [
          vehicle?['make'],
          vehicle?['model'],
        ].whereType<String>().where((value) => value.trim().isNotEmpty).toList();
        final plate = vehicle?['plateNumber'] as String?;
        final city = row['city'] as String?;
        final serviceZone = row['serviceZone'] as Map<String, dynamic>?;

        return RiderProfileSnapshot(
          id: row['id'] as String,
          city: city,
          onlineStatus: row['onlineStatus'] as bool? ?? false,
          serviceZoneName: serviceZone?['name'] as String?,
          vehicleLabel: vehicleParts.isEmpty
              ? null
              : [
                  vehicleParts.join(' '),
                  if (plate != null && plate.trim().isNotEmpty) plate.trim(),
                ].join(' | '),
        );
      }

      return null;
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
