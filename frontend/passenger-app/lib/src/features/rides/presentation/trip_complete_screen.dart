import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/currency_formatter.dart';
import '../application/current_ride_controller.dart';
import '../data/ride_repository.dart';

class TripCompleteScreen extends ConsumerStatefulWidget {
  const TripCompleteScreen({super.key});

  @override
  ConsumerState<TripCompleteScreen> createState() => _TripCompleteScreenState();
}

class _TripCompleteScreenState extends ConsumerState<TripCompleteScreen> {
  final _commentController = TextEditingController();
  final Set<String> _selectedTags = <String>{'Great driver', 'Safe riding'};
  int _score = 4;
  bool _submitting = false;
  String? _error;

  static const _tagOptions = <String>[
    'Great driver',
    'Safe riding',
    'On time',
    'Clean bike',
  ];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitRating() async {
    final ride = ref.read(currentRideProvider);
    if (ride == null) {
      context.go('/app');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final category = _selectedTags.isEmpty ? null : _selectedTags.first;
      final reviewParts = <String>[
        if (_selectedTags.isNotEmpty) _selectedTags.join(', '),
        if (_commentController.text.trim().isNotEmpty) _commentController.text.trim(),
      ];
      final review = reviewParts.isEmpty ? null : reviewParts.join(' | ');

      await ref.read(passengerRideRepositoryProvider).submitRideRating(
            rideId: ride.id,
            score: _score,
            category: category,
            review: review,
          );

      if (!mounted) return;
      context.go('/app');
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ride = ref.watch(currentRideProvider);
    final total = ride?.finalFare ?? ride?.estimatedFare ?? 0;

    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('Trip complete'),
        actions: [
          IconButton(
            onPressed: () => context.go('/app'),
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        children: [
          Column(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: CircleAvatar(
                    radius: 28,
                    backgroundColor: Color(0xFF0D6B4A),
                    child: Icon(
                      Icons.check_rounded,
                      size: 32,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                formatCurrencyAmount(ride?.currency ?? 'GHS', total),
                style: theme.textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                ride?.isCancelled == true ? 'Ride cancelled' : 'Payment recorded',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Card(
            color: const Color(0xFFF9FAFB),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _TripStat(
                        label: 'Duration',
                        value: '${ride?.estimatedDurationMinutes ?? '--'} min',
                      ),
                      _TripStat(
                        label: 'Distance',
                        value: '${ride?.estimatedDistanceKm?.toStringAsFixed(1) ?? '--'} km',
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  _RouteSummary(
                    pickup: ride?.pickupAddress ?? 'Pickup unavailable',
                    destination: ride?.destinationAddress ?? 'Destination unavailable',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 28),
          Column(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: const Color(0xFFDCFCE7),
                child: Text(
                  _initials(ride?.riderName ?? 'Rider'),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0D6B4A),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Rate ${ride?.riderName ?? 'your rider'}',
                style: theme.textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'How was your ride?',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  5,
                  (index) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: InkWell(
                      onTap: _submitting
                          ? null
                          : () {
                              setState(() {
                                _score = index + 1;
                              });
                            },
                      borderRadius: BorderRadius.circular(20),
                      child: Icon(
                        Icons.star_rounded,
                        size: 38,
                        color: index < _score
                            ? const Color(0xFFFFB800)
                            : const Color(0xFFE5E7EB),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: _tagOptions
                    .map(
                      (tag) => _FeedbackChip(
                        label: tag,
                        selected: _selectedTags.contains(tag),
                        onTap: _submitting
                            ? null
                            : () {
                                setState(() {
                                  if (_selectedTags.contains(tag)) {
                                    _selectedTags.remove(tag);
                                  } else {
                                    _selectedTags.add(tag);
                                  }
                                });
                              },
                      ),
                    )
                    .toList(growable: false),
              ),
              const SizedBox(height: 18),
              TextField(
                controller: _commentController,
                minLines: 2,
                maxLines: 3,
                enabled: !_submitting,
                decoration: const InputDecoration(
                  hintText: 'Add a comment (optional)',
                ),
              ),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.red.shade700,
              ),
            ),
          ],
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submitting ? null : _submitRating,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0D6B4A),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            child: Text(_submitting ? 'Submitting...' : 'Submit rating'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : () => context.go('/app'),
            child: const Text('Skip'),
          ),
        ],
      ),
    );
  }

  static String _initials(String value) {
    final parts = value
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'RD';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first.substring(0, 1)}${parts.last.substring(0, 1)}'.toUpperCase();
  }
}

class _TripStat extends StatelessWidget {
  const _TripStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF6B7280)),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _RouteSummary extends StatelessWidget {
  const _RouteSummary({required this.pickup, required this.destination});

  final String pickup;
  final String destination;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.circle, size: 12, color: Color(0xFF0D6B4A)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                pickup,
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.circle, size: 12, color: Color(0xFFEF4444)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                destination,
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _FeedbackChip extends StatelessWidget {
  const _FeedbackChip({
    required this.label,
    this.selected = false,
    this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF0D6B4A) : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? const Color(0xFF0D6B4A) : const Color(0xFFE5E7EB),
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: selected ? Colors.white : const Color(0xFF374151),
                fontWeight: FontWeight.w700,
              ),
        ),
      ),
    );
  }
}
