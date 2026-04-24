import 'package:flutter/material.dart';

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.showWordmark = true, this.compact = false});

  final bool showWordmark;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = compact ? 42.0 : 56.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFF8A34), Color(0xFF1A6B3C)],
            ),
          ),
          child: const Center(
            child: Icon(Icons.two_wheeler_rounded, color: Colors.white),
          ),
        ),
        if (showWordmark) ...[
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'OKADA',
                style: theme.textTheme.titleLarge?.copyWith(
                  letterSpacing: 1.6,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'Passenger',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
