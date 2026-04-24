import 'package:intl/intl.dart';

String currencySymbol(String currencyCode) {
  switch (currencyCode) {
    case 'GHS':
      return '₵';
    case 'NGN':
      return '₦';
    default:
      return currencyCode;
  }
}

String formatCurrencyAmount(String currencyCode, num amount) {
  final formatter = NumberFormat('#,##0.00', 'en_GH');
  return '${currencySymbol(currencyCode)}${formatter.format(amount)}';
}
