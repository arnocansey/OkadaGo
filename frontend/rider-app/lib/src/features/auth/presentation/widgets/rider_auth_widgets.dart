import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';

class RiderAuthLogoLockup extends StatelessWidget {
  const RiderAuthLogoLockup({super.key, this.centered = true});

  final bool centered;

  @override
  Widget build(BuildContext context) {
    final row = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.forest,
            borderRadius: BorderRadius.circular(12),
          ),
          alignment: Alignment.center,
          child: const Text(
            'O',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          'OkadaGo',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: AppTheme.forest,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );

    if (centered) {
      return Center(child: row);
    }

    return row;
  }
}

class RiderAuthNoticeCard extends StatelessWidget {
  const RiderAuthNoticeCard({
    super.key,
    required this.message,
    this.error = false,
  });

  final String message;
  final bool error;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: error ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: error ? const Color(0xFFFECACA) : const Color(0xFFA7F3D0),
        ),
      ),
      child: Text(
        message,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: error ? const Color(0xFFB91C1C) : const Color(0xFF047857),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class RiderAuthPhoneField extends StatelessWidget {
  const RiderAuthPhoneField({
    super.key,
    required this.controller,
    required this.hintText,
    this.labelText,
    this.countryCode = '+233',
    this.validator,
  });

  final TextEditingController controller;
  final String hintText;
  final String? labelText;
  final String countryCode;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            decoration: const BoxDecoration(
              border: Border(
                right: BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
            child: Text(
              countryCode,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: const Color(0xFF475569),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: TextFormField(
              controller: controller,
              keyboardType: TextInputType.phone,
              validator: validator,
              decoration: InputDecoration(
                labelText: labelText,
                hintText: hintText,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
