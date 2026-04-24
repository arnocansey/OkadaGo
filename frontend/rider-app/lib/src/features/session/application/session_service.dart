import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/data/auth_repository.dart';
import '../data/session_repository.dart';
import '../domain/auth_session.dart';

final riderSessionRepositoryProvider = Provider<SessionRepository>((ref) {
  return SessionRepository();
});

final riderSessionServiceProvider = Provider<RiderSessionService>((ref) {
  return RiderSessionService(
    authRepository: ref.watch(riderAuthRepositoryProvider),
    sessionRepository: ref.watch(riderSessionRepositoryProvider),
  );
});

class RiderSessionService {
  RiderSessionService({
    required RiderAuthRepository authRepository,
    required SessionRepository sessionRepository,
  }) : _authRepository = authRepository,
       _sessionRepository = sessionRepository;

  final RiderAuthRepository _authRepository;
  final SessionRepository _sessionRepository;

  AuthSession? restoreSession() {
    final session = _sessionRepository.read();
    if (session == null) return null;
    if (session.expiresAt.isBefore(DateTime.now())) {
      _sessionRepository.clear();
      return null;
    }
    return session;
  }

  Future<AuthSession> login({
    required String countryCode,
    required String phoneLocal,
    required String password,
    required Map<String, dynamic> device,
  }) async {
    final session = await _authRepository.login(
      countryCode: countryCode,
      phoneLocal: phoneLocal,
      password: password,
      device: device,
    );
    await _sessionRepository.write(session);
    return session;
  }

  Future<AuthSession> signup({
    required String fullName,
    String? email,
    required String countryCode,
    required String phoneLocal,
    required String password,
    String? city,
    String preferredCurrency = 'GHS',
    required Map<String, dynamic> device,
  }) async {
    final session = await _authRepository.signup(
      fullName: fullName,
      email: email,
      countryCode: countryCode,
      phoneLocal: phoneLocal,
      password: password,
      city: city,
      preferredCurrency: preferredCurrency,
      device: device,
    );
    await _sessionRepository.write(session);
    return session;
  }

  Future<void> clear() async {
    await _sessionRepository.clear();
  }
}
