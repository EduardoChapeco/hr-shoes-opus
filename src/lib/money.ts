/**
 * Money helpers — Hr Shoes Commerce.
 * RULE (AGENTS.md): money is always integer cents + currency BRL, never float.
 * This module only FORMATS server-provided values. It performs no commercial
 * calculation (price/discount/shipping/tax) — that happens server-side only.
 */

export type CurrencyCode = "BRL";

export interface Money {
  /** Integer amount in the currency's minor unit (centavos for BRL). */
  amountCents: number;
  currency: CurrencyCode;
}

const FORMATTERS: Record<CurrencyCode, Intl.NumberFormat> = {
  BRL: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
};

/** Format integer cents as a localized currency string (e.g. "R$ 199,90"). */
export function formatMoney(
  amountCents: number,
  currency: CurrencyCode = "BRL",
): string {
  if (!Number.isInteger(amountCents)) {
    // Defensive: we never expect non-integers; surface the bug instead of hiding it.
    console.warn("formatMoney received non-integer cents:", amountCents);
  }
  return FORMATTERS[currency].format(amountCents / 100);
}

export function formatMoneyObject(money: Money): string {
  return formatMoney(money.amountCents, money.currency);
}
