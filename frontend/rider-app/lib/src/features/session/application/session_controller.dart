import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_session.dart';
import 'session_service.dart';

final sessionControllerProvider =
    NotifierProvider<SessionController, AuthSession?>(SessionController.new);

class SessionController extends Notifier<AuthSession?> {
  @override
  AuthSession? build() {
    return ref.read(riderSessionServiceProvider).restoreSession();
  }

  Future<void> setSession(AuthSession session) async {
    await ref.read(riderSessionServiceProvider).clear();
    await ref.read(riderSessionRepositoryProvider).write(session);
    state = session;
  }

  Future<void> signOut() async {
    await ref.read(riderSessionServiceProvider).clear();
    state = null;
  }
}
