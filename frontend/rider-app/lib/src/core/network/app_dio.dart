import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_environment.dart';
import '../../features/session/data/session_repository.dart';

final dioProvider = Provider<Dio>((ref) {
  final sessionRepository = SessionRepository();
  final dio = Dio(
    BaseOptions(
      baseUrl: AppEnvironment.apiBaseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      headers: const {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final session = sessionRepository.read();
        if (session != null && session.expiresAt.isAfter(DateTime.now())) {
          options.headers['Authorization'] = 'Bearer ${session.token}';
        }
        handler.next(options);
      },
    ),
  );

  return dio;
});
