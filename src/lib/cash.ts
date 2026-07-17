export type CashEntryMethod = "cash" | "credit" | "debit" | "pix" | "other";
export type CashRegisterStatus = "open" | "closed" | "discrepancy";

export interface CashRegisterProfile {
  full_name: string | null;
}

export interface CashRegisterEntry {
  id: string;
  register_id: string;
  order_id: string | null;
  amount_cents: number;
  method: CashEntryMethod;
  description: string;
  created_at: string;
}

export interface ActiveCashRegister {
  id: string;
  store_id: string;
  opened_by: string;
  closed_by: string | null;
  opened_at: string;
  closed_at: string | null;
  status: CashRegisterStatus;
  initial_balance_cents: number;
  expected_balance_cents: number | null;
  final_balance_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  opened_by_profile: CashRegisterProfile | null;
  closed_by_profile?: CashRegisterProfile | null;
  currentBalanceCents: number;
  totalInDrawerCents: number;
  incomeCents: number;
  expenseCents: number;
  recentEntries: CashRegisterEntry[];
  methodTotals: Record<CashEntryMethod, number>;
}

export interface CashRegisterHistoryItem extends ActiveCashRegister {
  closed_by_profile: CashRegisterProfile | null;
}

export function parseCurrencyInputToCents(value: string): number {
  const normalized = value.trim();
  if (!normalized) return 0;

  const hasDecimalSeparator = /[,.]\d{1,2}$/.test(normalized);
  if (!hasDecimalSeparator) {
    return Number.parseInt(normalized.replace(/\D/g, "") || "0", 10);
  }

  const decimalIndex = Math.max(normalized.lastIndexOf(","), normalized.lastIndexOf("."));
  const wholePart = normalized.slice(0, decimalIndex);
  const centsPart = normalized.slice(decimalIndex + 1);
  const whole = Number.parseInt(wholePart.replace(/\D/g, "") || "0", 10);
  const cents = Number.parseInt(centsPart.padEnd(2, "0").slice(0, 2), 10);

  return whole * 100 + cents;
}

export function summarizeCashEntries(
  initialBalanceCents: number,
  entries: Pick<CashRegisterEntry, "amount_cents" | "method">[],
) {
  const methodTotals: Record<CashEntryMethod, number> = {
    cash: initialBalanceCents,
    pix: 0,
    credit: 0,
    debit: 0,
    other: 0,
  };

  let incomeCents = 0;
  let expenseCents = 0;

  entries.forEach((entry) => {
    if (entry.amount_cents >= 0) {
      incomeCents += entry.amount_cents;
    } else {
      expenseCents += Math.abs(entry.amount_cents);
    }

    const method = entry.method || "cash";
    if (method in methodTotals) {
      methodTotals[method] += entry.amount_cents;
    }
  });

  return {
    currentBalanceCents: methodTotals.cash, // Cash balance in drawer
    totalInDrawerCents: Object.values(methodTotals).reduce((sum, v) => sum + v, 0),
    incomeCents,
    expenseCents,
    methodTotals,
  };
}
