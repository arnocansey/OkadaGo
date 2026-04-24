class AuthUser {
  const AuthUser({
    required this.id,
    required this.role,
    required this.fullName,
    required this.phoneCountryCode,
    required this.phoneE164,
    required this.phoneLocal,
    required this.preferredCurrency,
    this.email,
    this.riderProfileId,
    this.riderApprovalStatus,
  });

  final String id;
  final String role;
  final String fullName;
  final String phoneCountryCode;
  final String phoneE164;
  final String phoneLocal;
  final String preferredCurrency;
  final String? email;
  final String? riderProfileId;
  final String? riderApprovalStatus;

  String get firstName {
    final trimmed = fullName.trim();
    if (trimmed.isEmpty) return 'Rider';
    return trimmed.split(RegExp(r'\s+')).first;
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      role: json['role'] as String,
      fullName: json['fullName'] as String,
      email: json['email'] as String?,
      phoneCountryCode: json['phoneCountryCode'] as String? ?? '+233',
      phoneE164: json['phoneE164'] as String,
      phoneLocal: json['phoneLocal'] as String,
      preferredCurrency: json['preferredCurrency'] as String,
      riderProfileId: json['riderProfileId'] as String?,
      riderApprovalStatus: json['riderApprovalStatus'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'fullName': fullName,
      'email': email,
      'phoneCountryCode': phoneCountryCode,
      'phoneE164': phoneE164,
      'phoneLocal': phoneLocal,
      'preferredCurrency': preferredCurrency,
      'riderProfileId': riderProfileId,
      'riderApprovalStatus': riderApprovalStatus,
    };
  }
}
