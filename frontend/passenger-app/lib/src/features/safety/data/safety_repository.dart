import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_dio.dart';

final passengerSafetyRepositoryProvider = Provider<PassengerSafetyRepository>((ref) {
  return PassengerSafetyRepository(ref.watch(dioProvider));
});

class SafetyContact {
  const SafetyContact({
    required this.id,
    required this.name,
    required this.phoneE164,
    required this.relationship,
    required this.isPrimary,
    required this.isVerified,
  });

  final String id;
  final String name;
  final String phoneE164;
  final String? relationship;
  final bool isPrimary;
  final bool isVerified;

  factory SafetyContact.fromJson(Map<String, dynamic> json) {
    return SafetyContact(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      phoneE164: json['phoneE164'] as String? ?? '',
      relationship: json['relationship'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
    );
  }
}

class SafetyOverview {
  const SafetyOverview({
    required this.contacts,
    required this.incidents,
    required this.activeRideId,
  });

  final List<SafetyContact> contacts;
  final List<SafetyIncident> incidents;
  final String? activeRideId;
}

class SafetyIncident {
  const SafetyIncident({
    required this.id,
    required this.severity,
    required this.status,
    required this.category,
    required this.description,
    required this.createdAt,
    required this.rideId,
  });

  final String id;
  final String severity;
  final String status;
  final String category;
  final String description;
  final DateTime? createdAt;
  final String? rideId;

  factory SafetyIncident.fromJson(Map<String, dynamic> json) {
    return SafetyIncident(
      id: json['id'] as String? ?? '',
      severity: json['severity'] as String? ?? 'HIGH',
      status: json['status'] as String? ?? 'OPEN',
      category: json['category'] as String? ?? 'SOS',
      description: json['description'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
      rideId: json['rideId'] as String?,
    );
  }
}

class PassengerSafetyRepository {
  PassengerSafetyRepository(this._dio);

  final Dio _dio;

  Future<SafetyOverview> getOverview() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/safety/overview');
      final data = response.data ?? const {};
      final contacts = (data['contacts'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(SafetyContact.fromJson)
          .toList(growable: false);
      final incidents = (data['incidents'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(SafetyIncident.fromJson)
          .toList(growable: false);
      final activeRide = data['activeRide'] as Map<String, dynamic>?;
      return SafetyOverview(
        contacts: contacts,
        incidents: incidents,
        activeRideId: activeRide?['id'] as String?,
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> createContact({
    required String name,
    required String phoneE164,
    String? relationship,
    bool isPrimary = false,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/safety/contacts',
        data: {
          'name': name,
          'phoneE164': phoneE164,
          'relationship': relationship,
          'isPrimary': isPrimary,
        }..removeWhere((key, value) => value == null || (value is String && value.trim().isEmpty)),
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> deleteContact(String contactId) async {
    try {
      await _dio.delete<Map<String, dynamic>>('/safety/contacts/$contactId');
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> triggerSos({
    required String description,
    String? rideId,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/safety/incidents',
        data: {
          'severity': 'CRITICAL',
          'category': 'SOS',
          'description': description,
          'rideId': rideId,
        }..removeWhere((key, value) => value == null),
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> shareTrip({
    required String rideId,
    required bool start,
    String channel = 'LINK',
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/safety/share-trip',
        data: {
          'rideId': rideId,
          'mode': start ? 'START' : 'STOP',
          'channel': channel,
        },
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> requestContactVerification({
    required String contactId,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/safety/contacts/verification/request',
        data: {
          'contactId': contactId,
        },
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }

  Future<void> verifyContactOtp({
    required String contactId,
    required String code,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/safety/contacts/verification/confirm',
        data: {
          'contactId': contactId,
          'code': code,
        },
      );
    } catch (error) {
      throw mapApiException(error);
    }
  }
}
