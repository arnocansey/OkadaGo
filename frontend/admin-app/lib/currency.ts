export function normalizeCurrency(currency: string | null | undefined): "GHS" | "NGN" {
  const code = (currency ?? "").trim().toUpperCase();

  if (code === "NGN" || code === "₦") {
    return "NGN";
  }

  // Ghana-first platform: treat blank/USD/$/unknown as GHS.
  return "GHS";
}

export function currencySymbol(currency: string | null | undefined) {
  return normalizeCurrency(currency) === "NGN" ? "₦" : "₵";
}

export function formatMoney(
  currency: string | null | undefined,
  amount: string | number | null | undefined
) {
  const code = normalizeCurrency(currency);
  const numeric =
    typeof amount === "number"
      ? amount
      : typeof amount === "string" && amount.trim() !== ""
        ? Number(amount)
        : 0;
  const value = Number.isFinite(numeric) ? numeric : 0;

  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currencySymbol(code)}${new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)}`;
  }
}
