class RideLiveLocation {
  const RideLiveLocation({
    required this.latitude,
    required this.longitude,
    this.speedKph,
    this.heading,
    this.accuracyM,
    this.recordedAt,
  });

  final double latitude;
  final double longitude;
  final double? speedKph;
  final double? heading;
  final double? accuracyM;
  final DateTime? recordedAt;
}

class RideRecord {
  const RideRecord({
    required this.id,
    required this.status,
    required this.pickupAddress,
    required this.destinationAddress,
    required this.currency,
    required this.pickupLatitude,
    required this.pickupLongitude,
    required this.destinationLatitude,
    required this.destinationLongitude,
    this.passengerProfileId,
    this.riderProfileId,
    this.estimatedFare,
    this.finalFare,
    this.estimatedDistanceKm,
    this.estimatedDurationMinutes,
    this.passengerName,
    this.passengerPhone,
    this.latestLocation,
    this.createdAt,
  });

  final String id;
  final String status;
  final String pickupAddress;
  final String destinationAddress;
  final String currency;
  final double pickupLatitude;
  final double pickupLongitude;
  final double destinationLatitude;
  final double destinationLongitude;
  final String? passengerProfileId;
  final String? riderProfileId;
  final double? estimatedFare;
  final double? finalFare;
  final double? estimatedDistanceKm;
  final int? estimatedDurationMinutes;
  final String? passengerName;
  final String? passengerPhone;
  final RideLiveLocation? latestLocation;
  final DateTime? createdAt;

  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isAssigned => status == 'assigned';
  bool get isNavigationStage =>
      status == 'assigned' || status == 'arriving' || status == 'arrived';
  bool get isStarted => status == 'started';

  factory RideRecord.fromJson(Map<String, dynamic> json) {
    double? parseDouble(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      return double.tryParse(value.toString());
    }

    int? parseInt(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toInt();
      return int.tryParse(value.toString());
    }

    final passenger = json['passenger'] as Map<String, dynamic>?;
    final passengerUser = passenger?['user'] as Map<String, dynamic>?;
    final latestLocationRow =
        (json['locations'] as List<dynamic>?)?.cast<Map<String, dynamic>?>().firstWhere(
              (row) => row != null,
              orElse: () => null,
            );

    RideLiveLocation? latestLocation;
    if (latestLocationRow != null) {
      final latitude = parseDouble(latestLocationRow['latitude']);
      final longitude = parseDouble(latestLocationRow['longitude']);
      if (latitude != null && longitude != null) {
        latestLocation = RideLiveLocation(
          latitude: latitude,
          longitude: longitude,
          speedKph: parseDouble(latestLocationRow['speedKph']),
          heading: parseDouble(latestLocationRow['heading']),
          accuracyM: parseDouble(latestLocationRow['accuracyM']),
          recordedAt: latestLocationRow['recordedAt'] is String
              ? DateTime.tryParse(latestLocationRow['recordedAt'] as String)
              : null,
        );
      }
    }

    latestLocation ??= () {
      final rider = json['rider'] as Map<String, dynamic>?;
      final latitude = parseDouble(rider?['currentLatitude']);
      final longitude = parseDouble(rider?['currentLongitude']);
      if (latitude == null || longitude == null) return null;
      return RideLiveLocation(latitude: latitude, longitude: longitude);
    }();

    return RideRecord(
      id: json['id'] as String,
      status: (json['status'] as String).toLowerCase(),
      pickupLatitude: parseDouble(json['pickupLatitude']) ?? 0,
      pickupLongitude: parseDouble(json['pickupLongitude']) ?? 0,
      pickupAddress: json['pickupAddress'] as String? ?? 'Unknown pickup',
      destinationLatitude: parseDouble(json['destinationLatitude']) ?? 0,
      destinationLongitude: parseDouble(json['destinationLongitude']) ?? 0,
      destinationAddress:
          json['destinationAddress'] as String? ?? 'Unknown destination',
      currency: json['currency'] as String? ?? 'GHS',
      passengerProfileId: json['passengerId'] as String?,
      riderProfileId: json['riderId'] as String?,
      estimatedFare: parseDouble(json['estimatedFare']),
      finalFare: parseDouble(json['finalFare']),
      estimatedDistanceKm: parseDouble(json['estimatedDistanceKm']),
      estimatedDurationMinutes: parseInt(json['estimatedDurationMinutes']),
      passengerName: passengerUser?['fullName'] as String?,
      passengerPhone: passengerUser?['phoneE164'] as String?,
      latestLocation: latestLocation,
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}
