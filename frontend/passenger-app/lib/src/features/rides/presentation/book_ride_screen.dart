import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';
import '../application/current_ride_controller.dart';
import '../data/location_lookup_repository.dart';
import '../data/ride_repository.dart';
import '../data/service_zone_repository.dart';
import '../domain/service_zone.dart';

class BookRideScreen extends ConsumerStatefulWidget {
  const BookRideScreen({super.key});

  @override
  ConsumerState<BookRideScreen> createState() => _BookRideScreenState();
}

class _BookRideScreenState extends ConsumerState<BookRideScreen> {
  final _pickupController = TextEditingController(
    text: 'Ring Road Central, Accra',
  );
  final _destinationController = TextEditingController(
    text: 'Kotoka International Airport',
  );
  final _pickupLatController = TextEditingController(text: '5.6037');
  final _pickupLngController = TextEditingController(text: '-0.1870');
  final _destinationLatController = TextEditingController(text: '5.6052');
  final _destinationLngController = TextEditingController(text: '-0.1668');
  final _distanceController = TextEditingController(text: '8.3');
  final _durationController = TextEditingController(text: '12');

  List<ServiceZone> _zones = const [];
  ServiceZone? _selectedZone;
  String _rideType = 'standard_bike';
  String _paymentMethod = 'mobile_money';
  bool _showTripDetails = false;
  bool _loadingZones = true;
  bool _submitting = false;
  bool _locatingPickup = false;
  String? _error;
  RideEstimateResult? _estimate;

  @override
  void initState() {
    super.initState();
    _loadZones();
  }

  @override
  void dispose() {
    _pickupController.dispose();
    _destinationController.dispose();
    _pickupLatController.dispose();
    _pickupLngController.dispose();
    _destinationLatController.dispose();
    _destinationLngController.dispose();
    _distanceController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _loadZones() async {
    try {
      final zones = await ref
          .read(passengerServiceZoneRepositoryProvider)
          .listZones();
      if (!mounted) return;
      setState(() {
        _zones = zones;
        _selectedZone = zones.isNotEmpty ? zones.first : null;
        _loadingZones = false;
      });
      await _refreshEstimate();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _loadingZones = false;
      });
    }
  }

  double? _parseDouble(TextEditingController controller) =>
      double.tryParse(controller.text.trim());

  int? _parseInt(TextEditingController controller) =>
      int.tryParse(controller.text.trim());

  double _haversineDistanceKm({
    required double fromLatitude,
    required double fromLongitude,
    required double toLatitude,
    required double toLongitude,
  }) {
    const earthRadiusKm = 6371.0;
    double degreesToRadians(double degrees) => degrees * math.pi / 180;
    final deltaLatitude = degreesToRadians(toLatitude - fromLatitude);
    final deltaLongitude = degreesToRadians(toLongitude - fromLongitude);
    final a =
        math.sin(deltaLatitude / 2) * math.sin(deltaLatitude / 2) +
        math.cos(degreesToRadians(fromLatitude)) *
            math.cos(degreesToRadians(toLatitude)) *
            math.sin(deltaLongitude / 2) *
            math.sin(deltaLongitude / 2);

    return earthRadiusKm * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }

  Future<void> _useCurrentLocation() async {
    setState(() {
      _locatingPickup = true;
      _error = null;
    });

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are turned off on this device.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Location permission is required to use your current pickup point.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
        ),
      );

      String pickupLabel = 'Current location';
      try {
        final lookup = await ref
            .read(passengerLocationLookupRepositoryProvider)
            .reverseGeocode(
              latitude: position.latitude,
              longitude: position.longitude,
            );
        pickupLabel = lookup.label;
      } catch (_) {
        pickupLabel = 'Current location';
      }

      _pickupController.text = pickupLabel;
      _pickupLatController.text = position.latitude.toStringAsFixed(6);
      _pickupLngController.text = position.longitude.toStringAsFixed(6);

      final destinationLat = _parseDouble(_destinationLatController);
      final destinationLng = _parseDouble(_destinationLngController);
      if (destinationLat != null && destinationLng != null) {
        final distanceKm = _haversineDistanceKm(
          fromLatitude: position.latitude,
          fromLongitude: position.longitude,
          toLatitude: destinationLat,
          toLongitude: destinationLng,
        );
        _distanceController.text = distanceKm.toStringAsFixed(1);
        _durationController.text = math.max(4, ((distanceKm / 22) * 60).round()).toString();
      }

      await _refreshEstimate();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is Exception
            ? error.toString().replaceFirst('Exception: ', '')
            : 'Unable to use your current location right now.';
      });
    } finally {
      if (mounted) {
        setState(() => _locatingPickup = false);
      }
    }
  }

  Future<void> _refreshEstimate() async {
    final zone = _selectedZone;
    final pickupLat = _parseDouble(_pickupLatController);
    final pickupLng = _parseDouble(_pickupLngController);
    final destinationLat = _parseDouble(_destinationLatController);
    final destinationLng = _parseDouble(_destinationLngController);
    final distanceKm = _parseDouble(_distanceController);
    final durationMinutes = _parseInt(_durationController);

    if (zone == null ||
        _pickupController.text.trim().isEmpty ||
        _destinationController.text.trim().isEmpty ||
        pickupLat == null ||
        pickupLng == null ||
        destinationLat == null ||
        destinationLng == null ||
        distanceKm == null ||
        durationMinutes == null) {
      return;
    }

    try {
      final estimate = await ref
          .read(passengerRideRepositoryProvider)
          .estimateRide(
            zone: zone,
            rideType: _rideType,
            pickupAddress: _pickupController.text.trim(),
            pickupLatitude: pickupLat,
            pickupLongitude: pickupLng,
            destinationAddress: _destinationController.text.trim(),
            destinationLatitude: destinationLat,
            destinationLongitude: destinationLng,
            distanceKm: distanceKm,
            durationMinutes: durationMinutes,
          );

      if (!mounted) return;
      setState(() {
        _estimate = estimate;
      });
    } catch (_) {}
  }

  Future<void> _choosePaymentMethod() async {
    final method = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        final options = [
          ('mobile_money', 'MTN MoMo'),
          ('cash', 'Cash'),
          ('wallet', 'Wallet'),
          ('card', 'Card'),
        ];

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 48,
                    height: 6,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1D5DB),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  'Choose payment method',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 14),
                ...options.map(
                  (option) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: _PaymentBadge(label: _paymentBadge(option.$1)),
                    title: Text(option.$2),
                    trailing: option.$1 == _paymentMethod
                        ? const Icon(
                            Icons.check_circle_rounded,
                            color: AppTheme.forest,
                          )
                        : null,
                    onTap: () => Navigator.of(context).pop(option.$1),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (method == null || !mounted) return;
    setState(() {
      _paymentMethod = method;
    });
  }

  Future<void> _bookRide() async {
    final session = ref.read(sessionControllerProvider);
    final user = session?.user;
    final zone = _selectedZone;

    if (user == null || user.passengerProfileId == null) {
      setState(
        () => _error = 'Passenger session is missing a passenger profile.',
      );
      return;
    }

    if (zone == null) {
      setState(() => _error = 'Create a service zone in the backend first.');
      return;
    }

    final pickupLat = _parseDouble(_pickupLatController);
    final pickupLng = _parseDouble(_pickupLngController);
    final destinationLat = _parseDouble(_destinationLatController);
    final destinationLng = _parseDouble(_destinationLngController);
    final distanceKm = _parseDouble(_distanceController);
    final durationMinutes = _parseInt(_durationController);

    if (_pickupController.text.trim().isEmpty ||
        _destinationController.text.trim().isEmpty ||
        pickupLat == null ||
        pickupLng == null ||
        destinationLat == null ||
        destinationLng == null ||
        distanceKm == null ||
        durationMinutes == null) {
      setState(
        () => _error =
            'Fill in the route, coordinates, distance, and duration.',
      );
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final repo = ref.read(passengerRideRepositoryProvider);
      final estimate = await repo.estimateRide(
        zone: zone,
        rideType: _rideType,
        pickupAddress: _pickupController.text.trim(),
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        destinationAddress: _destinationController.text.trim(),
        destinationLatitude: destinationLat,
        destinationLongitude: destinationLng,
        distanceKm: distanceKm,
        durationMinutes: durationMinutes,
      );

      final ride = await repo.requestRide(
        user: user,
        zone: zone,
        rideType: _rideType,
        paymentMethod: _paymentMethod,
        pickupAddress: _pickupController.text.trim(),
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        destinationAddress: _destinationController.text.trim(),
        destinationLatitude: destinationLat,
        destinationLongitude: destinationLng,
        distanceKm: distanceKm,
        durationMinutes: durationMinutes,
      );

      ref.read(currentRideProvider.notifier).setRide(ride);
      if (!mounted) return;
      setState(() {
        _estimate = estimate;
      });
      context.go('/tracking');
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: Column(
        children: [
          Container(
            color: AppTheme.forest,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 8,
              left: 8,
              right: 16,
              bottom: 12,
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(
                    Icons.arrow_back_rounded,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Select ride',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Stack(
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.45,
                  child: DecoratedBox(
                    decoration: const BoxDecoration(color: Color(0xFFE5E7EB)),
                    child: CustomPaint(
                      painter: _RoutePainter(),
                      child: Stack(
                        children: const [
                          Positioned(
                            top: 135,
                            left: 105,
                            child: _PinLabel(
                              label: '4 min',
                              color: AppTheme.forest,
                            ),
                          ),
                          Positioned(
                            top: 205,
                            left: 235,
                            child: _Pin(color: Color(0xFFEF4444)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned.fill(
                  top: MediaQuery.of(context).size.height * 0.40,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(28),
                      ),
                      boxShadow: [
                        BoxShadow(
                          blurRadius: 20,
                          offset: Offset(0, -4),
                          color: Color(0x1A000000),
                        ),
                      ],
                    ),
                    child: _loadingZones
                        ? const Center(child: CircularProgressIndicator())
                        : ListView(
                            children: [
                              const SizedBox(height: 4),
                              _LocationStopField(
                                dotColor: AppTheme.forest,
                                controller: _pickupController,
                                label: 'Pickup',
                              ),
                              const SizedBox(height: 10),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: OutlinedButton.icon(
                                  onPressed: _locatingPickup
                                      ? null
                                      : _useCurrentLocation,
                                  icon: const Icon(Icons.my_location_rounded),
                                  label: Text(
                                    _locatingPickup
                                        ? 'Locating...'
                                        : 'Use current location',
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 14),
                              _LocationStopField(
                                dotColor: const Color(0xFFEF4444),
                                controller: _destinationController,
                                label: 'Drop-off',
                                showDivider: false,
                              ),
                              const SizedBox(height: 18),
                              InkWell(
                                onTap: () => setState(
                                  () => _showTripDetails = !_showTripDetails,
                                ),
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: const Color(0xFFE5E7EB),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.tune_rounded,
                                        color: Color(0xFF64748B),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          'Trip details and service zone',
                                          style: theme.textTheme.titleSmall
                                              ?.copyWith(
                                                fontWeight: FontWeight.w700,
                                              ),
                                        ),
                                      ),
                                      Icon(
                                        _showTripDetails
                                            ? Icons.keyboard_arrow_up_rounded
                                            : Icons.keyboard_arrow_down_rounded,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              if (_showTripDetails) ...[
                                const SizedBox(height: 14),
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextField(
                                        controller: _pickupLatController,
                                        keyboardType:
                                            const TextInputType.numberWithOptions(
                                              decimal: true,
                                              signed: true,
                                            ),
                                        decoration: const InputDecoration(
                                          labelText: 'Pickup lat',
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: TextField(
                                        controller: _pickupLngController,
                                        keyboardType:
                                            const TextInputType.numberWithOptions(
                                              decimal: true,
                                              signed: true,
                                            ),
                                        decoration: const InputDecoration(
                                          labelText: 'Pickup lng',
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextField(
                                        controller: _destinationLatController,
                                        keyboardType:
                                            const TextInputType.numberWithOptions(
                                              decimal: true,
                                              signed: true,
                                            ),
                                        decoration: const InputDecoration(
                                          labelText: 'Drop-off lat',
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: TextField(
                                        controller: _destinationLngController,
                                        keyboardType:
                                            const TextInputType.numberWithOptions(
                                              decimal: true,
                                              signed: true,
                                            ),
                                        decoration: const InputDecoration(
                                          labelText: 'Drop-off lng',
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextField(
                                        controller: _distanceController,
                                        keyboardType:
                                            const TextInputType.numberWithOptions(
                                              decimal: true,
                                            ),
                                        decoration: const InputDecoration(
                                          labelText: 'Distance (km)',
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: TextField(
                                        controller: _durationController,
                                        keyboardType: TextInputType.number,
                                        decoration: const InputDecoration(
                                          labelText: 'Duration (min)',
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<ServiceZone>(
                                  initialValue: _selectedZone,
                                  items: _zones
                                      .map(
                                        (zone) => DropdownMenuItem(
                                          value: zone,
                                          child: Text(
                                            '${zone.name} - ${zone.city}',
                                          ),
                                        ),
                                      )
                                      .toList(),
                                  onChanged: (zone) async {
                                    setState(() => _selectedZone = zone);
                                    await _refreshEstimate();
                                  },
                                  decoration: const InputDecoration(
                                    labelText: 'Service zone',
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: _refreshEstimate,
                                    child: const Text('Refresh quote'),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 8),
                              Text(
                                'Ride options',
                                style: theme.textTheme.labelLarge?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(
                                    child: _RideOptionCard(
                                      icon: Icons.two_wheeler_rounded,
                                      label: 'OkadaGo',
                                      eta: '4 min',
                                      fare: _estimate?.totalFare,
                                      selected: _rideType == 'standard_bike',
                                      badge: 'Fast',
                                      onTap: () async {
                                        setState(
                                          () => _rideType = 'standard_bike',
                                        );
                                        await _refreshEstimate();
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _RideOptionCard(
                                      icon: Icons.directions_bike_rounded,
                                      label: 'OkadaX',
                                      eta: '3 min',
                                      fare: _estimate?.totalFare,
                                      selected: _rideType == 'express_bike',
                                      onTap: () async {
                                        setState(
                                          () => _rideType = 'express_bike',
                                        );
                                        await _refreshEstimate();
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              Row(
                                children: [
                                  _PaymentBadge(
                                    label: _paymentBadge(_paymentMethod),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      _paymentLabel(_paymentMethod),
                                      style: theme.textTheme.titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: _choosePaymentMethod,
                                    child: const Text('Change'),
                                  ),
                                ],
                              ),
                              if (_error != null) ...[
                                const SizedBox(height: 12),
                                Text(
                                  _error!,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: Colors.red.shade700,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _submitting ? null : _bookRide,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.forest,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      _submitting
                                          ? 'Booking...'
                                          : 'Book ${_rideType == 'standard_bike' ? 'OkadaGo' : 'OkadaX'}',
                                    ),
                                    Text(
                                      _estimate != null
                                          ? '${_selectedZone?.currency ?? ''} ${_estimate!.totalFare.toStringAsFixed(2)}'
                                          : '--',
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationStopField extends StatelessWidget {
  const _LocationStopField({
    required this.dotColor,
    required this.controller,
    required this.label,
    this.showDivider = true,
  });

  final Color dotColor;
  final TextEditingController controller;
  final String label;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: dotColor.withValues(alpha: 0.15),
          ),
          alignment: Alignment.center,
          child: Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Container(
            padding: EdgeInsets.only(bottom: showDivider ? 14 : 0),
            decoration: showDivider
                ? const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: Color(0xFFF3F4F6)),
                    ),
                  )
                : null,
            child: TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: label,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.zero,
              ),
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: const Color(0xFF111827),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _RideOptionCard extends StatelessWidget {
  const _RideOptionCard({
    required this.icon,
    required this.label,
    required this.eta,
    required this.fare,
    required this.selected,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final String label;
  final String eta;
  final double? fare;
  final bool selected;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? AppTheme.forest : const Color(0xFFE5E7EB),
            width: selected ? 2 : 1,
          ),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            if (badge != null)
              Positioned(
                top: -22,
                right: -4,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFB800),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    badge!,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF111827),
                    ),
                  ),
                ),
              ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  icon,
                  color: selected ? AppTheme.forest : const Color(0xFF4B5563),
                  size: 28,
                ),
                const SizedBox(height: 10),
                Text(
                  label,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 2),
                Text(
                  eta,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  fare != null ? fare!.toStringAsFixed(2) : '--',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: selected ? AppTheme.forest : const Color(0xFF111827),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Pin extends StatelessWidget {
  const _Pin({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: const [
          BoxShadow(
            blurRadius: 10,
            offset: Offset(0, 3),
            color: Color(0x33000000),
          ),
        ],
      ),
      child: const Center(
        child: SizedBox(
          width: 8,
          height: 8,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
  }
}

class _PinLabel extends StatelessWidget {
  const _PinLabel({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            boxShadow: const [
              BoxShadow(
                blurRadius: 8,
                offset: Offset(0, 3),
                color: Color(0x22000000),
              ),
            ],
          ),
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        const SizedBox(height: 6),
        _Pin(color: color),
      ],
    );
  }
}

class _PaymentBadge extends StatelessWidget {
  const _PaymentBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: const Color(0xFFFACC15),
        borderRadius: BorderRadius.circular(17),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: const Color(0xFF111827),
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _RoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()
      ..color = AppTheme.forest.withValues(alpha: 0.18)
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += 30) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }

    for (double y = 0; y < size.height; y += 30) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }

    final route = Paint()
      ..color = AppTheme.forest
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(size.width * 0.31, size.height * 0.43)
      ..cubicTo(
        size.width * 0.39,
        size.height * 0.43,
        size.width * 0.47,
        size.height * 0.58,
        size.width * 0.64,
        size.height * 0.64,
      );

    canvas.drawPath(path, route);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

String _paymentLabel(String method) {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'wallet':
      return 'Wallet';
    case 'card':
      return 'Card';
    default:
      return 'MTN MoMo';
  }
}

String _paymentBadge(String method) {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'wallet':
      return 'Wall';
    case 'card':
      return 'Card';
    default:
      return 'MoMo';
  }
}
