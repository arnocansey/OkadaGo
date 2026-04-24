import 'package:flutter/material.dart';

class PageHeading extends StatelessWidget {
  const PageHeading({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(subtitle, style: theme.textTheme.bodyLarge),
      ],
    );
  }
}
