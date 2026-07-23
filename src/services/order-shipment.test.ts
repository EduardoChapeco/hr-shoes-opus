import { describe, it, expect } from "vitest";

function generateTrackingUrl(trackingCode: string, trackingUrl?: string): string {
  if (trackingUrl) return trackingUrl;
  if (trackingCode.length > 8 && /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(trackingCode)) {
    return `https://rastreamento.correios.com.br/app/index.php?codigo=${trackingCode}`;
  }
  return `https://melhorrastreio.com.br/rastreio/${trackingCode}`;
}

describe("Order Shipment Tracking Helpers", () => {
  it("should generate standard Correios tracking URL for valid SRO codes", () => {
    const url = generateTrackingUrl("AA123456789BR");
    expect(url).toBe("https://rastreamento.correios.com.br/app/index.php?codigo=AA123456789BR");
  });

  it("should generate Melhor Rastreio URL for other tracking codes", () => {
    const url = generateTrackingUrl("JAD123456789");
    expect(url).toBe("https://melhorrastreio.com.br/rastreio/JAD123456789");
  });

  it("should preserve custom tracking URL if explicitly provided", () => {
    const customUrl = "https://minhatransportadora.com/track/123";
    const url = generateTrackingUrl("123", customUrl);
    expect(url).toBe(customUrl);
  });
});
