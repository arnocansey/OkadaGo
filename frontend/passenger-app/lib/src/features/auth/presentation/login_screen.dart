import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';
import '../../session/application/session_service.dart';
import '../../session/presentation/device_context.dart';
import 'widgets/passenger_auth_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  String _countryCode = '+233';
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final session = await ref
          .read(passengerSessionServiceProvider)
          .login(
            countryCode: _countryCode,
            phoneLocal: _phoneController.text.trim(),
            password: _passwordController.text.trim(),
            device: buildDeviceContext(),
          );
      await ref.read(sessionControllerProvider.notifier).setSession(session);
      if (!mounted) return;
      context.go('/app');
    } catch (error) {
      setState(() {
        _error = error is Exception
            ? error.toString().replaceFirst('Exception: ', '')
            : 'Unable to sign in right now.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        const AuthLogoLockup(),
                        const SizedBox(height: 36),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Welcome back!',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              color: const Color(0xFF0F172A),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Enter your phone number to continue.',
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 20),
                          AuthNoticeCard(message: _error!, error: true),
                        ],
                        const SizedBox(height: 26),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Country',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: const Color(0xFF334155),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<String>(
                          initialValue: _countryCode,
                          decoration: const InputDecoration(),
                          items: const [
                            DropdownMenuItem(
                              value: '+233',
                              child: Text('Ghana (+233)'),
                            ),
                            DropdownMenuItem(
                              value: '+234',
                              child: Text('Nigeria (+234)'),
                            ),
                          ],
                          onChanged: _submitting
                              ? null
                              : (value) {
                                  if (value == null) return;
                                  setState(() => _countryCode = value);
                                },
                        ),
                        const SizedBox(height: 18),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Phone Number',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: const Color(0xFF334155),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        AuthPhoneField(
                          controller: _phoneController,
                          countryCode: _countryCode,
                          hintText: '24 123 4567',
                          validator: (value) {
                            final digits =
                                value?.replaceAll(RegExp(r'\D'), '') ?? '';
                            if (digits.length < 7) {
                              return 'Enter a valid phone number.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 18),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Password',
                                style: theme.textTheme.labelLarge?.copyWith(
                                  color: const Color(0xFF334155),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            TextButton(
                              onPressed: () {},
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                minimumSize: const Size(0, 0),
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: const Text('Forgot?'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            hintText: '........',
                          ),
                          validator: (value) {
                            if ((value ?? '').length < 8) {
                              return 'Password must be at least 8 characters.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _submitting ? null : _submit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.forest,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            child: Text(
                              _submitting ? 'Please wait...' : 'Log In',
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Center(
                          child: Text(
                            'OR',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: const Color(0xFF64748B),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon: const Icon(
                              Icons.g_mobiledata_rounded,
                              size: 28,
                            ),
                            label: const Text('Sign in with Google'),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size.fromHeight(58),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                          ),
                        ),
                        const Spacer(),
                        const SizedBox(height: 20),
                        Wrap(
                          alignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 6,
                          children: [
                            Text(
                              'New to OkadaGo?',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF334155),
                              ),
                            ),
                            TextButton(
                              onPressed: () => context.go('/signup'),
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                minimumSize: const Size(0, 0),
                              ),
                              child: const Text('Create an account'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
