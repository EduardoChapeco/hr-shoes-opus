import { describe, expect, it } from "vitest";

import { parseCurrencyInputToCents, summarizeCashEntries } from "./cash";

describe("cash helpers", () => {
  it("parses BRL inputs to integer cents", () => {
    expect(parseCurrencyInputToCents("125,30")).toBe(12530);
    expect(parseCurrencyInputToCents("R$ 1.250,05")).toBe(125005);
    expect(parseCurrencyInputToCents("5000")).toBe(5000);
    expect(parseCurrencyInputToCents("")).toBe(0);
  });

  it("summarizes register entries without editing the ledger", () => {
    expect(
      summarizeCashEntries(10000, [
        { amount_cents: 2500, method: "cash" },
        { amount_cents: -1200, method: "cash" },
        { amount_cents: 300, method: "cash" },
      ]),
    ).toEqual({
      currentBalanceCents: 11600,
      totalInDrawerCents: 11600,
      incomeCents: 2800,
      expenseCents: 1200,
      methodTotals: {
        cash: 11600,
        pix: 0,
        credit: 0,
        debit: 0,
        other: 0,
      },
    });
  });
});
