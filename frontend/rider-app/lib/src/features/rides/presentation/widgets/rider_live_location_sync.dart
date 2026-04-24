import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../application/current_ride_controller.dart';
import '../../data/ride_repository.dart';
import '../../domain/ride_record.dart';

class RiderLiveLocationSync extends ConsumerStatefulWidget {
  const RiderLiveLocationSync({
    super.key,
    required this.riderProfileId,
    required this.online,
    this.ride,
  });

  final String? riderProfileId;
  final bool online;
  final RideRecord? ride;

  @override
  ConsumerState<RiderLiveLocationSync> createState() =>
      _RiderLiveLocationSyncState();
}

class _RiderLiveLocationSyncState extends ConsumerState<RiderLiveLocationSync> {
  Timer? _timer;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _restartSync();
  }

  @override
  void didUpdateWidget(covariant RiderLiveLocationSync oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.online != widget.online ||
        oldWidget.riderProfileId != widget.riderProfileId ||
        oldWidget.ride?.id != widget.ride?.id ||
        oldWidget.ride?.status != widget.ride?.status) {
      _restartSync();
    }
  }

  void _restartSync() {
    _timer?.cancel();

    if (!_shouldSync) {
      return;
    }

    unawaited(_syncOnce());
    _timer = Timer.periodic(
      const Duration(seconds: 12),
      (_) => unawaited(_syncOnce()),
    );
  }

  bool get _shouldSync {
    if (widget.riderProfileId == null) return false;
    if (widget.online) return true;
    return widget.ride != null;
  }

  Future<void> _syncOnce() async {
    if (_syncing || !_shouldSync || widget.riderProfileId == null) return;

    _syncing = true;
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
        ),
      );

      await ref.read(riderRideRepositoryProvider).updateAvailability(
            riderProfileId: widget.riderProfileId!,
            onlineStatus: widget.online || widget.ride != null,
            latitude: position.latitude,
            longitude: position.longitude,
          );

      final activeRide = widget.ride;
      if (activeRide != null &&
          !activeRide.isCompleted &&
          !activeRide.isCancelled) {
        final updatedRide = await ref.read(riderRideRepositoryProvider).updateRideLocation(
              rideId: activeRide.id,
              riderProfileId: widget.riderProfileId!,
              latitude: position.latitude,
              longitude: position.longitude,
              speedKph: position.speed >= 0 ? position.speed * 3.6 : null,
              heading: position.heading >= 0 ? position.heading : null,
              accuracyM: position.accuracy >= 0 ? position.accuracy : null,
            );
        ref.read(currentRideProvider.notifier).setRide(updatedRide);
      }
    } catch (_) {
      // Location sync should fail softly so ride operations stay usable.
    } finally {
      _syncing = false;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}
