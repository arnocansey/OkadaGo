import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/safety_repository.dart';

class SafetyScreen extends ConsumerStatefulWidget {
  const SafetyScreen({super.key});

  @override
  ConsumerState<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends ConsumerState<SafetyScreen> {
  int _reloadTick = 0;
  bool _submitting = false;
  String? _message;

  Future<void> _showAddContactDialog() async {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final relationshipController = TextEditingController();
    var primary = false;

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Add emergency contact'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
                    TextField(
                      controller: phoneController,
                      decoration: const InputDecoration(labelText: 'Phone (E.164)'),
                    ),
                    TextField(
                      controller: relationshipController,
                      decoration: const InputDecoration(labelText: 'Relationship'),
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: primary,
                      onChanged: (value) => setModalState(() => primary = value ?? false),
                      title: const Text('Set as primary contact'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Save')),
              ],
            );
          },
        );
      },
    );

    if (saved != true) {
      nameController.dispose();
      phoneController.dispose();
      relationshipController.dispose();
      return;
    }

    try {
      setState(() {
        _submitting = true;
        _message = null;
      });
      await ref.read(riderSafetyRepositoryProvider).createContact(
            name: nameController.text.trim(),
            phoneE164: phoneController.text.trim(),
            relationship: relationshipController.text.trim(),
            isPrimary: primary,
          );
      setState(() {
        _reloadTick++;
        _message = 'Emergency contact saved.';
      });
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
      nameController.dispose();
      phoneController.dispose();
      relationshipController.dispose();
    }
  }

  Future<void> _showVerifyContactDialog(SafetyContact contact) async {
    final codeController = TextEditingController();
    try {
      setState(() {
        _submitting = true;
        _message = null;
      });
      await ref.read(riderSafetyRepositoryProvider).requestContactVerification(contactId: contact.id);
      if (!mounted) return;
      setState(() => _submitting = false);

      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Verify contact'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Enter the 6-digit OTP sent to ${contact.phoneE164}.'),
              const SizedBox(height: 10),
              TextField(
                controller: codeController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: const InputDecoration(labelText: 'OTP code'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Verify')),
          ],
        ),
      );

      if (confirm == true) {
        setState(() => _submitting = true);
        await ref.read(riderSafetyRepositoryProvider).verifyContactOtp(
              contactId: contact.id,
              code: codeController.text.trim(),
            );
        setState(() {
          _reloadTick++;
          _message = 'Contact verified successfully.';
        });
      }
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
      codeController.dispose();
    }
  }

  Future<void> _triggerSos(String? rideId) async {
    try {
      setState(() {
        _submitting = true;
        _message = null;
      });
      await ref.read(riderSafetyRepositoryProvider).triggerSos(
            description: 'Rider triggered SOS from mobile app.',
            rideId: rideId,
          );
      setState(() {
        _reloadTick++;
        _message = 'SOS report submitted. Our team has been alerted.';
      });
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: FutureBuilder<SafetyOverview>(
        key: ValueKey(_reloadTick),
        future: ref.read(riderSafetyRepositoryProvider).getOverview(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(snapshot.error.toString().replaceFirst('Exception: ', ''), textAlign: TextAlign.center),
              ),
            );
          }

          final data = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
            children: [
              Text('Safety center', style: theme.textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text('Manage emergency contacts and trigger an SOS incident report instantly.', style: theme.textTheme.bodyLarge),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _submitting ? null : () => _triggerSos(data.activeRideId),
                      icon: const Icon(Icons.sos_rounded),
                      label: const Text('Trigger SOS'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  OutlinedButton.icon(
                    onPressed: _submitting ? null : _showAddContactDialog,
                    icon: const Icon(Icons.person_add_alt_1_rounded),
                    label: const Text('Add contact'),
                  ),
                ],
              ),
              if (data.activeRideId != null) ...[
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _submitting
                      ? null
                      : () async {
                          try {
                            setState(() {
                              _submitting = true;
                              _message = null;
                            });
                            await ref.read(riderSafetyRepositoryProvider).shareTrip(rideId: data.activeRideId!, start: true);
                            setState(() => _message = 'Trip share event recorded.');
                          } catch (error) {
                            setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
                          } finally {
                            if (mounted) setState(() => _submitting = false);
                          }
                        },
                  icon: const Icon(Icons.share_location_rounded),
                  label: const Text('Share active trip'),
                ),
              ],
              if (_message != null) ...[
                const SizedBox(height: 10),
                Text(_message!, style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF475569))),
              ],
              const SizedBox(height: 18),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Emergency contacts', style: theme.textTheme.titleLarge),
                      const SizedBox(height: 12),
                      if (data.contacts.isEmpty)
                        Text('No emergency contacts yet.', style: theme.textTheme.bodyMedium)
                      else
                        ...data.contacts.map(
                          (contact) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(contact.name),
                            subtitle: Text(
                              '${contact.phoneE164}${contact.relationship == null ? '' : ' • ${contact.relationship}'}'
                              '${contact.isVerified ? ' • Verified' : ' • Unverified'}',
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (!contact.isVerified)
                                  IconButton(
                                    icon: const Icon(Icons.verified_user_outlined),
                                    tooltip: 'Verify',
                                    onPressed: _submitting ? null : () => _showVerifyContactDialog(contact),
                                  ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline_rounded),
                                  onPressed: _submitting
                                      ? null
                                      : () async {
                                          try {
                                            setState(() => _submitting = true);
                                            await ref.read(riderSafetyRepositoryProvider).deleteContact(contact.id);
                                            setState(() {
                                              _reloadTick++;
                                              _message = 'Contact removed.';
                                            });
                                          } catch (error) {
                                            setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
                                          } finally {
                                            if (mounted) setState(() => _submitting = false);
                                          }
                                        },
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Recent incident reports', style: theme.textTheme.titleLarge),
                      const SizedBox(height: 12),
                      if (data.incidents.isEmpty)
                        Text('No incidents reported yet.', style: theme.textTheme.bodyMedium)
                      else
                        ...data.incidents.take(6).map(
                              (incident) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text('${incident.category} • ${incident.severity}'),
                                subtitle: Text(incident.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                                trailing: Text(
                                  incident.status,
                                  style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

