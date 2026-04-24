import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'core/storage/app_storage.dart';

Future<void> bootstrap() async {
  await dotenv.load(fileName: '.env');
  await AppStorage.initialize();
}
