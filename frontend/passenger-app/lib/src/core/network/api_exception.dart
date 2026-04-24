import 'package:dio/dio.dart';

Exception mapApiException(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['error'] ?? data['code'];
      if (message is String && message.trim().isNotEmpty) {
        return Exception(message);
      }
    }

    if (error.message != null && error.message!.trim().isNotEmpty) {
      return Exception(error.message);
    }
  }

  if (error is Exception) {
    return error;
  }

  return Exception('Something went wrong.');
}
