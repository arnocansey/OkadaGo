import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/ride_record.dart';

final currentRideProvider =
    NotifierProvider<CurrentRideController, RideRecord?>(
      CurrentRideController.new,
    );

class CurrentRideController extends Notifier<RideRecord?> {
  @override
  RideRecord? build() => null;

  void setRide(RideRecord? ride) {
    state = ride;
  }

  void clear() {
    state = null;
  }
}
