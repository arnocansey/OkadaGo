import '../../../core/storage/app_storage.dart';
import '../domain/auth_session.dart';

class SessionRepository {
  static const _sessionKey = 'okadago_rider_session';

  AuthSession? read() {
    final json = AppStorage.readJson(_sessionKey);
    if (json == null) return null;
    return AuthSession.fromJson(json);
  }

  Future<void> write(AuthSession session) {
    return AppStorage.writeJson(_sessionKey, session.toJson());
  }

  Future<void> clear() {
    return AppStorage.remove(_sessionKey);
  }
}
