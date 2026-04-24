import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';
import '../domain/ride_record.dart';

final riderRideRepositoryProvider = Provider<RiderRideRepository>((ref) {
  return RiderRideRepository(ref.watch(dioProvider));
});

class RiderRideRepository {
  RiderRideRepository(this._dio);

  final Dio _dio;

  Future<List<RideRecord>> listRides() async {
    try {
      final response = await _dio.get<List<dynamic>>('/rides');
      final rows = response.data ?? const [];
      return rows
          .whereType<Map<String, dynamic>>()
          .map(RideRecord.fromJson)
          .toList(growable: false);
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<RideRecord> getRide(String rideId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/rides/$rideId');
      return RideRecord.fromJson(response.data ?? const {});
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<RideRecord> updateRideStatus({
    required String rideId,
    required String nextStatus,
    required String actorUserId,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/rides/$rideId/status',
        data: {
          'nextStatus': nextStatus,
          'actorRole': 'rider',
          'actorUserId': actorUserId,
        },
      );
      return RideRecord.fromJson(response.data ?? const {});
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> updateAvailability({
    required String riderProfileId,
    required bool onlineStatus,
    double? latitude,
    double? longitude,
  }) async {
    try {
      final data = <String, dynamic>{
        'onlineStatus': onlineStatus,
        'latitude': latitude,
        'longitude': longitude,
      }..removeWhere((key, value) => value == null);

      await _dio.patch<Map<String, dynamic>>(
        '/riders/$riderProfileId/availability',
        data: data,
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<RideRecord> updateRideLocation({
    required String rideId,
    required String riderProfileId,
    required double latitude,
    required double longitude,
    double? speedKph,
    double? heading,
    double? accuracyM,
    String source = 'rider_app',
  }) async {
    try {
      final data = <String, dynamic>{
        'riderProfileId': riderProfileId,
        'source': source,
        'latitude': latitude,
        'longitude': longitude,
        'speedKph': speedKph,
        'heading': heading,
        'accuracyM': accuracyM,
      }..removeWhere((key, value) => value == null);

      final response = await _dio.post<Map<String, dynamic>>(
        '/rides/$rideId/location',
        data: data,
      );
      return RideRecord.fromJson(response.data ?? const {});
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
