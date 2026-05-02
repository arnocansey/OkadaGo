import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';
import '../../session/domain/auth_user.dart';
import '../domain/ride_record.dart';
import '../domain/service_zone.dart';

final passengerRideRepositoryProvider = Provider<PassengerRideRepository>((
  ref,
) {
  return PassengerRideRepository(ref.watch(dioProvider));
});

class RideEstimateResult {
  const RideEstimateResult({
    required this.totalFare,
    required this.riderEarnings,
    required this.platformCommission,
  });

  final double totalFare;
  final double riderEarnings;
  final double platformCommission;
}

class PassengerRideRepository {
  PassengerRideRepository(this._dio);

  final Dio _dio;

  Future<RideEstimateResult> estimateRide({
    required ServiceZone zone,
    required String rideType,
    required String pickupAddress,
    required double pickupLatitude,
    required double pickupLongitude,
    required String destinationAddress,
    required double destinationLatitude,
    required double destinationLongitude,
    required double distanceKm,
    required int durationMinutes,
    double surgeMultiplier = 1,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/rides/estimate',
        data: {
          'pickup': {
            'address': pickupAddress,
            'latitude': pickupLatitude,
            'longitude': pickupLongitude,
          },
          'destination': {
            'address': destinationAddress,
            'latitude': destinationLatitude,
            'longitude': destinationLongitude,
          },
          'pricing': {
            'countryCode': zone.countryCode,
            'currency': zone.currency,
            'rideType': rideType,
            'baseFare': zone.baseFare,
            'perKmFee': zone.perKmFee,
            'perMinuteFee': zone.perMinuteFee,
            'minimumFare': zone.minimumFare,
            'cancellationFee': zone.cancellationFee,
            'waitingFeePerMinute': zone.waitingFeePerMin,
            'commissionPercent': 12,
            'surgeMultiplier': surgeMultiplier,
            'zoneFee': 0,
            'promoDiscount': 0,
            'referralDiscount': 0,
            'estimatedDistanceKm': distanceKm,
            'estimatedDurationMinutes': durationMinutes,
            'waitingMinutes': 0,
          },
        },
      );

      final pricing =
          response.data?['pricing'] as Map<String, dynamic>? ?? const {};
      double parse(dynamic value) =>
          value is num ? value.toDouble() : double.parse(value.toString());

      return RideEstimateResult(
        totalFare: parse(pricing['totalFare'] ?? 0),
        riderEarnings: parse(pricing['riderEarnings'] ?? 0),
        platformCommission: parse(pricing['platformCommission'] ?? 0),
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<RideRecord> requestRide({
    required AuthUser user,
    required ServiceZone zone,
    required String rideType,
    required String paymentMethod,
    required String pickupAddress,
    required double pickupLatitude,
    required double pickupLongitude,
    required String destinationAddress,
    required double destinationLatitude,
    required double destinationLongitude,
    required double distanceKm,
    required int durationMinutes,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/rides/request',
        data: {
          'passengerProfileId': user.passengerProfileId,
          'serviceZoneId': zone.id,
          'paymentMethod': paymentMethod,
          'pickup': {
            'address': pickupAddress,
            'latitude': pickupLatitude,
            'longitude': pickupLongitude,
          },
          'destination': {
            'address': destinationAddress,
            'latitude': destinationLatitude,
            'longitude': destinationLongitude,
          },
          'estimatedDistanceKm': distanceKm,
          'estimatedDurationMinutes': durationMinutes,
          'rideType': rideType,
          'surgeMultiplier': 1,
        },
      );

      final ride = response.data?['ride'] as Map<String, dynamic>? ?? const {};
      return RideRecord.fromJson(ride);
    } catch (error) {
      throw mapApiException(error);
    }
  }

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
    required String actorRole,
    required String actorUserId,
    String? cancellationReason,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/rides/$rideId/status',
        data: {
          'nextStatus': nextStatus,
          'actorRole': actorRole,
          'actorUserId': actorUserId,
          'cancellationReason': cancellationReason,
        },
      );

      return RideRecord.fromJson(response.data ?? const {});
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> submitRideRating({
    required String rideId,
    required int score,
    String? category,
    String? review,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/ratings/rides/$rideId',
        data: {
          'score': score,
          'category': category,
          'review': review,
        }..removeWhere((key, value) => value == null || (value is String && value.trim().isEmpty)),
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
