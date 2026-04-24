import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:okadago_rider_app/src/features/auth/presentation/login_screen.dart';
import 'package:okadago_rider_app/src/features/auth/presentation/signup_screen.dart';

void main() {
  testWidgets('login screen renders rider auth controls', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: LoginScreen())),
    );

    expect(find.text('Welcome back!'), findsOneWidget);
    expect(find.text('Log In'), findsAtLeastNWidgets(1));
    expect(find.text('Sign in with Google'), findsOneWidget);
  });

  testWidgets('signup screen renders account creation controls', (
    tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: SignupScreen())),
    );

    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('Next: document upload'), findsAtLeastNWidgets(1));
  });
}
