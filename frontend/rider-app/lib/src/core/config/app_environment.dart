import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnvironment {
  AppEnvironment._();

  static String get apiBaseUrl {
    final configured = dotenv.maybeGet('API_BASE_URL');
    return (configured?.trim().isNotEmpty ?? false)
        ? configured!.trim()
        : 'http://localhost:4000/v1';
  }

  static String get mapProvider {
    return dotenv.maybeGet('MAP_PROVIDER')?.trim() ??
        'leaflet-web-google-mobile';
  }
}
