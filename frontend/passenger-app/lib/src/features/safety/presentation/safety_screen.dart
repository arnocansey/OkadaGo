import 'package:flutter/material.dart';

class SafetyScreen extends StatelessWidget {
  const SafetyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        children: [
          Text('Safety center', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            'Emergency contacts, SOS, trip sharing, and incident reporting will live here.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.health_and_safety_rounded,
                    color: Color(0xFFFF6B00),
                    size: 46,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Safety tools are ready for wiring',
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'We can connect SOS actions, trusted contacts, and ride-share events after auth and ride state are live.',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
