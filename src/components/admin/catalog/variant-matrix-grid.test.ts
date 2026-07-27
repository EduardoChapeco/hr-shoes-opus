import { describe, it, expect } from "vitest";
import { generatePivotData, type RawVariant } from "./variant-matrix-grid";

describe("Variant Matrix Grid - Algorithm Integrity", () => {
  it("should perfectly pivot a 1D Flat Array into a 2D Matrix Map (Color x Size)", () => {
    // 1. Setup flat 1D array of combinations
    const flatVariants: RawVariant[] = [
      {
        id: "v1",
        attributes: { Cor: "Azul", Tamanho: "38" },
        stock: 5,
        price_override_cents: null,
      },
      {
        id: "v2",
        attributes: { Cor: "Azul", Tamanho: "39" },
        stock: 10,
        price_override_cents: 35000,
      },
      {
        id: "v3",
        attributes: { Cor: "Preto", Tamanho: "38" },
        stock: 2,
        price_override_cents: null,
      },
      {
        id: "v4",
        attributes: { Cor: "Preto", Tamanho: "39" },
        stock: 0,
        price_override_cents: null,
      },
    ];

    // 2. Execute Pivot Algorithm
    const pivot = generatePivotData(flatVariants, "Cor", ["Tamanho"]);

    // 3. Verify Dimensions Extraction
    expect(pivot.rows).toEqual(["Azul", "Preto"]);
    expect(pivot.cols).toEqual(["38", "39"]);

    // 4. Verify Lossless Data Mapping
    const azulRow = pivot.matrix.get("Azul");
    expect(azulRow).toBeDefined();

    // Check specific cells
    const azul38 = azulRow?.get("38");
    expect(azul38?.stock).toBe(5);
    expect(azul38?.price_override_cents).toBeNull();

    const azul39 = azulRow?.get("39");
    expect(azul39?.stock).toBe(10);
    expect(azul39?.price_override_cents).toBe(35000);

    const pretoRow = pivot.matrix.get("Preto");
    const preto39 = pretoRow?.get("39");
    expect(preto39?.stock).toBe(0);
  });

  it("should handle 3 dimensions (Color x Size x Width) gracefully by concatenating secondary columns", () => {
    const flatVariants: RawVariant[] = [
      { attributes: { Cor: "Azul", Tamanho: "38", Largura: "Largo" }, stock: 1 },
      { attributes: { Cor: "Azul", Tamanho: "38", Largura: "Fino" }, stock: 2 },
    ];

    const pivot = generatePivotData(flatVariants, "Cor", ["Tamanho", "Largura"]);

    // Columns should be concatenated with ' / '
    expect(pivot.cols).toContain("38 / Largo");
    expect(pivot.cols).toContain("38 / Fino");

    const azulRow = pivot.matrix.get("Azul");
    expect(azulRow?.get("38 / Largo")?.stock).toBe(1);
    expect(azulRow?.get("38 / Fino")?.stock).toBe(2);
  });
});
