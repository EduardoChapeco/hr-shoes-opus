import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.fn();

vi.mock("@/lib/supabase", () => {
  return {
    getAnonServerClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                single: mockSingle,
              }),
            }),
          }),
        }),
      }),
    }),
    SupabaseUnconfiguredError: class SupabaseUnconfiguredError extends Error {},
  };
});

import { getProductBySlugHandler } from "./product.functions";

describe("Product Functions (BFF)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar o ProductDetailDTO direto quando o produto for encontrado", async () => {
    const mockProduct = {
      id: "prod-1",
      slug: "sapato-social-preto",
      title: "Sapato Social Preto Premium",
      description: "Couro legítimo",
      short_description: "Sapato social",
      brand: "Hr Shoes",
      price_cents: 29990,
      compare_at_cents: 35000,
      product_media: [{ id: "m-1", url: "https://img.com/1.jpg", alt: "Foto", media_type: "image", sort_order: 0 }],
      product_variants: [
        {
          id: "v-1",
          sku: "SAP-39",
          status: "active",
          price_override_cents: null,
          stock_on_hand: 10,
          stock_reserved: 2,
          attributes: { Tamanho: "39" },
          product_media: [],
        },
      ],
      product_categories: [],
      reviews: [],
    };

    mockSingle.mockResolvedValueOnce({ data: mockProduct, error: null });

    const result = await getProductBySlugHandler("sapato-social-preto");

    expect(result).toBeDefined();
    expect(result.id).toBe("prod-1");
    expect(result.title).toBe("Sapato Social Preto Premium");
    expect(result.variants[0].availableQty).toBe(8); // 10 - 2 = 8
    expect(result.variants[0].effectivePriceCents).toBe(29990);
  });

  it("deve lançar exceção quando o produto não for encontrado (404 / PGRST116)", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    await expect(
      getProductBySlugHandler("produto-inexistente"),
    ).rejects.toThrow("Produto não encontrado");
  });
});
