import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../session/application/session_controller.dart';
import '../../session/application/session_service.dart';
import '../../session/presentation/device_context.dart';
import 'widgets/passenger_auth_widgets.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _countryCode = '+233';
  bool _submitting = false;
  String? _error;

  int get _passwordStrengthScore {
    final password = _passwordController.text;
    if (password.isEmpty) return 0;

    var score = 0;
    if (password.length >= 8) score += 1;
    if (RegExp(r'[A-Z]').hasMatch(password) &&
        RegExp(r'[a-z]').hasMatch(password)) {
      score += 1;
    }
    if (RegExp(r'\d').hasMatch(password)) score += 1;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(password)) score += 1;
    return score.clamp(0, 4);
  }

  String get _passwordStrengthLabel {
    switch (_passwordStrengthScore) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      default:
        return 'Strong';
    }
  }

  String get _passwordStrengthHelper {
    switch (_passwordStrengthScore) {
      case 0:
        return 'Use 8 or more characters for a stronger password.';
      case 1:
        return 'Add more characters and mix letters, numbers, and symbols.';
      case 2:
        return 'Add a number or symbol to make it stronger.';
      case 3:
        return 'Strong enough, but extra length or a symbol would make it better.';
      default:
        return 'Great password strength.';
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
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
          .signup(
            fullName:
                '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}'
                    .trim(),
            email: _emailController.text.trim().isEmpty
                ? null
                : _emailController.text.trim(),
            countryCode: _countryCode,
            phoneLocal: _phoneController.text.trim(),
            password: _passwordController.text.trim(),
            preferredCurrency: _countryCode == '+233' ? 'GHS' : 'NGN',
            device: buildDeviceContext(),
          );
      await ref.read(sessionControllerProvider.notifier).setSession(session);
      if (!mounted) return;
      context.go('/app');
    } catch (error) {
      setState(() {
        _error = error is Exception
            ? error.toString().replaceFirst('Exception: ', '')
            : 'Unable to create your account right now.';
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AuthLogoLockup(centered: false),
                const SizedBox(height: 24),
                TextButton.icon(
                  onPressed: () => context.go('/login'),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(0, 0),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  icon: const Icon(Icons.arrow_back_rounded),
                  label: const Text('Back to login'),
                ),
                const SizedBox(height: 20),
                Text(
                  'Create account',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: const Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Start your journey with OkadaGo today.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 20),
                  AuthNoticeCard(message: _error!, error: true),
                ],
                const SizedBox(height: 28),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _firstNameController,
                        decoration: const InputDecoration(
                          labelText: 'First Name',
                          hintText: 'Chidi',
                        ),
                        validator: (value) =>
                            (value ?? '').trim().isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: TextFormField(
                        controller: _lastNameController,
                        decoration: const InputDecoration(
                          labelText: 'Last Name',
                          hintText: 'Obi',
                        ),
                        validator: (value) =>
                            (value ?? '').trim().isEmpty ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email Address',
                    hintText: 'name@example.com',
                  ),
                  validator: (value) {
                    final trimmed = (value ?? '').trim();
                    if (trimmed.isEmpty) return null;
                    if (!trimmed.contains('@')) return 'Enter a valid email.';
                    return null;
                  },
                ),
                const SizedBox(height: 18),
                DropdownButtonFormField<String>(
                  initialValue: _countryCode,
                  decoration: const InputDecoration(labelText: 'Country'),
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
                AuthPhoneField(
                  controller: _phoneController,
                  countryCode: _countryCode,
                  labelText: 'Phone Number',
                  hintText: '24 123 4567',
                  validator: (value) {
                    final digits = value?.replaceAll(RegExp(r'\D'), '') ?? '';
                    if (digits.length < 7) {
                      return 'Enter a valid phone number.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 18),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    hintText: 'Create a strong password',
                  ),
                  validator: (value) {
                    if ((value ?? '').length < 8) {
                      return 'Password must be at least 8 characters.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                Row(
                  children: List.generate(4, (index) {
                    final active = index < _passwordStrengthScore;
                    final muted =
                        index == _passwordStrengthScore - 1 &&
                        _passwordStrengthScore == 3;

                    return Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(right: index == 3 ? 0 : 6),
                        child: _StrengthBar(active: active, muted: muted),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 6),
                Text(
                  _passwordStrengthLabel,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: _passwordStrengthScore >= 3
                        ? AppTheme.forest
                        : const Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _passwordStrengthHelper,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
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
                      _submitting ? 'Creating account...' : 'Create Account',
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  'By creating an account, you agree to our Terms of Service and Privacy Policy.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StrengthBar extends StatelessWidget {
  const _StrengthBar({this.active = false, this.muted = false});

  final bool active;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 6,
      decoration: BoxDecoration(
        color: active
            ? (muted ? AppTheme.forest.withValues(alpha: 0.3) : AppTheme.forest)
            : const Color(0xFFE5E7EB),
        borderRadius: BorderRadius.circular(999),
      ),
    );
  }
}
