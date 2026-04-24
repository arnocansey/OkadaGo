import 'package:flutter/foundation.dart';

Map<String, dynamic> buildDeviceContext() {
  return {
    'deviceId': defaultTargetPlatform.name,
    'platform': defaultTargetPlatform.name,
    'userAgent': 'okadago-rider-flutter',
  };
}
