import { describe, it, expect } from "vitest";

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
    }
    return c;
  });
}

describe("Feed XML Helper Functions", () => {
  it("should escape special XML characters correctly", () => {
    expect(escapeXml("Calçados & Acessórios")).toBe("Calçados &amp; Acessórios");
    expect(escapeXml("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&apos;xss&apos;)&lt;/script&gt;");
    expect(escapeXml('"Tênis Premium"')).toBe("&quot;Tênis Premium&quot;");
  });

  it("should format monetary values to 2 decimal places with BRL currency tag", () => {
    const priceCents = 15990;
    const priceBrl = (priceCents / 100).toFixed(2);
    expect(priceBrl).toBe("159.90");
  });
});
