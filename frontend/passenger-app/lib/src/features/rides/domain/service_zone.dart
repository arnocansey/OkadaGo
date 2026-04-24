class ServiceZone {
  const ServiceZone({
    required this.id,
    required this.name,
    required this.city,
    required this.countryCode,
    required this.currency,
    required this.baseFare,
    required this.perKmFee,
    required this.perMinuteFee,
    required this.minimumFare,
    required this.cancellationFee,
    required this.waitingFeePerMin,
  });

  final String id;
  final String name;
  final String city;
  final String countryCode;
  final String currency;
  final double baseFare;
  final double perKmFee;
  final double perMinuteFee;
  final double minimumFare;
  final double cancellationFee;
  final double waitingFeePerMin;

  factory ServiceZone.fromJson(Map<String, dynamic> json) {
    num asNum(dynamic value) =>
        value is num ? value : num.parse(value.toString());

    return ServiceZone(
      id: json['id'] as String,
      name: json['name'] as String,
      city: json['city'] as String,
      countryCode: json['countryCode'] as String,
      currency: json['currency'] as String,
      baseFare: asNum(json['baseFare']).toDouble(),
      perKmFee: asNum(json['perKmFee']).toDouble(),
      perMinuteFee: asNum(json['perMinuteFee']).toDouble(),
      minimumFare: asNum(json['minimumFare']).toDouble(),
      cancellationFee: asNum(json['cancellationFee']).toDouble(),
      waitingFeePerMin: asNum(json['waitingFeePerMin']).toDouble(),
    );
  }
}
