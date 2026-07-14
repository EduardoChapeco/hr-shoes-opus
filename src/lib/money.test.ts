import { describe, it, expect } from "vitest";

import { formatMoney } from "@/lib/money";

describe("formatMoney", () => {
  it("formats integer cents as BRL", () => {
    expect(formatMoney(19990)).toBe("R$\u00a0199,90");
    expect(formatMoney(0)).toBe("R$\u00a00,00");
    expect(formatMoney(100)).toBe("R$\u00a01,00");
  });
});
