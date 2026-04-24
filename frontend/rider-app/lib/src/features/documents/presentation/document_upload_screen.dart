import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';

class DocumentUploadScreen extends StatelessWidget {
  const DocumentUploadScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppTheme.forest,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    'O',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'OkadaGo Partner',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: AppTheme.forest,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'Complete rider verification',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your rider account has been created. The next step is submitting the documents needed for approval.',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: const Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 28),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: const [
                  _ProgressHeader(currentStep: 2),
                  SizedBox(height: 22),
                  _UploadDropzone(
                    title: 'National ID / Ghana Card',
                    subtitle: 'Click to upload or drag and drop. SVG, PNG, JPG or PDF (max. 5MB).',
                  ),
                  SizedBox(height: 18),
                  _UploadedFileCard(
                    title: 'license_front.jpg',
                    subtitle: 'Driver license - 1.2 MB',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Required documents',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 12),
            const _RequirementCard(
              title: 'Government ID',
              subtitle: 'National ID, voter card, or passport',
              icon: Icons.badge_outlined,
            ),
            const SizedBox(height: 12),
            const _RequirementCard(
              title: 'Driver license',
              subtitle: 'Valid motorcycle or driver permit',
              icon: Icons.credit_card_outlined,
            ),
            const SizedBox(height: 12),
            const _RequirementCard(
              title: 'Bike registration',
              subtitle: 'Registration and plate details',
              icon: Icons.two_wheeler_rounded,
            ),
            const SizedBox(height: 12),
            const _RequirementCard(
              title: 'Insurance',
              subtitle: 'Active insurance document where available',
              icon: Icons.shield_outlined,
            ),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.schedule_rounded,
                    color: Color(0xFFB45309),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'We review rider applications within 24 to 48 hours. Make sure every document is clear and current to avoid delays.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF92400E),
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.go('/app'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.forest,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text('Continue to rider dashboard'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressHeader extends StatelessWidget {
  const _ProgressHeader({required this.currentStep});

  final int currentStep;

  @override
  Widget build(BuildContext context) {
    const labels = ['Personal', 'Documents', 'Vehicle', 'Review'];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(labels.length, (index) {
        final stepNumber = index + 1;
        final complete = stepNumber < currentStep;
        final active = stepNumber == currentStep;

        return Expanded(
          child: Column(
            children: [
              Row(
                children: [
                  if (index != 0)
                    Expanded(
                      child: Container(
                        height: 2,
                        color: complete || active
                            ? AppTheme.forest
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: complete
                          ? AppTheme.forest
                          : active
                          ? Colors.white
                          : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: complete || active
                            ? AppTheme.forest
                            : const Color(0xFFCBD5E1),
                        width: 2,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: complete
                        ? const Icon(
                            Icons.check_rounded,
                            size: 18,
                            color: Colors.white,
                          )
                        : Text(
                            '$stepNumber',
                            style: TextStyle(
                              color: active
                                  ? AppTheme.forest
                                  : const Color(0xFF94A3B8),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                  ),
                  if (index != labels.length - 1)
                    Expanded(
                      child: Container(
                        height: 2,
                        color: stepNumber < currentStep
                            ? AppTheme.forest
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                labels[index],
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: complete || active
                      ? const Color(0xFF0F172A)
                      : const Color(0xFF94A3B8),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

class _UploadDropzone extends StatelessWidget {
  const _UploadDropzone({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 28),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFCBD5E1),
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.forest.withValues(alpha: 0.10),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.cloud_upload_outlined,
              color: AppTheme.forest,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: const Color(0xFF64748B),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _UploadedFileCard extends StatelessWidget {
  const _UploadedFileCard({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0xFFDCFCE7),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: AppTheme.forest,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }
}

class _RequirementCard extends StatelessWidget {
  const _RequirementCard({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: AppTheme.forest),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            color: Color(0xFF94A3B8),
          ),
        ],
      ),
    );
  }
}
