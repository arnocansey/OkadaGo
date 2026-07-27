export function currencySymbol(currency: string) {
  if (currency === "GHS") return "₵";
  if (currency === "NGN") return "₦";
  return currency;
}

export function formatMoney(currency: string, amount: string | number | null | undefined) {
  const numeric =
    typeof amount === "number"
      ? amount
      : typeof amount === "string" && amount.trim() !== ""
        ? Number(amount)
        : 0;

  return `${currencySymbol(currency)}${new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(numeric) ? numeric : 0)}`;
}
