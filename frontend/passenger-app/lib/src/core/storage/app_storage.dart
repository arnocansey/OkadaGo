import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class AppStorage {
  AppStorage._();

  static late SharedPreferences _preferences;
  static bool _ready = false;

  static Future<void> initialize() async {
    _preferences = await SharedPreferences.getInstance();
    _ready = true;
  }

  static SharedPreferences get instance {
    if (!_ready) {
      throw StateError('AppStorage has not been initialized.');
    }
    return _preferences;
  }

  static Map<String, dynamic>? readJson(String key) {
    final raw = instance.getString(key);
    if (raw == null || raw.isEmpty) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  static Future<void> writeJson(String key, Map<String, dynamic> value) {
    return instance.setString(key, jsonEncode(value));
  }

  static Future<void> remove(String key) {
    return instance.remove(key);
  }
}
