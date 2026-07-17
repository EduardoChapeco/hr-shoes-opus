import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStockLevelsHandler,
  adjustStockHandler,
  getStockMovementsHandler,
} from "./stock.functions";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockIlike = vi.fn();
const mockLimit = vi.fn();
const mockRpc = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  order: mockOrder,
  ilike: mockIlike,
  limit: mockLimit,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockIlike.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock("@/lib/supabase", () => {
  return {
    getServerClient: () => mockSupabase,
    SupabaseUnconfiguredError: class extends Error {},
  };
});

describe("Stock Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockOrder.mockReturnValue(mockQueryBuilder);
    mockIlike.mockReturnValue(mockQueryBuilder);
    mockLimit.mockReturnValue(mockQueryBuilder);
  });

  describe("getStockLevelsHandler", () => {
    it("should retrieve all stock variants ordered by sku", async () => {
      const mockVariants = [
        {
          id: "v-1",
          sku: "TENIS-39",
          stock_on_hand: 10,
          stock_reserved: 2,
          products: { title: "Tênis" },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockVariants, error: null });

      const res = await getStockLevelsHandler({});
      expect(res).toEqual(mockVariants);
      expect(mockFrom).toHaveBeenCalledWith("product_variants");
      expect(mockOrder).toHaveBeenCalledWith("sku");
    });

    it("should apply ilike filter when search param is provided", async () => {
      const mockVariants = [{ id: "v-1", sku: "TENIS-39" }];
      mockIlike.mockResolvedValueOnce({ data: mockVariants, error: null });

      const res = await getStockLevelsHandler({ search: "TENIS" });
      expect(res).toEqual(mockVariants);
      expect(mockIlike).toHaveBeenCalledWith("sku", "%TENIS%");
    });

    it("should propagate database error", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB select fail" } });

      await expect(getStockLevelsHandler({})).rejects.toThrow("DB select fail");
    });

    it("should return empty array when data is null with no error", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: null });

      const res = await getStockLevelsHandler({});
      expect(res).toEqual([]);
    });
  });

  describe("adjustStockHandler", () => {
    it("should call adjust_stock RPC with correct parameters and return ok status", async () => {
      mockRpc.mockResolvedValueOnce({ error: null });

      const res = await adjustStockHandler({
        variantId: "var-uuid-1",
        qty: 10,
        movementType: "purchase",
        note: "Compra de fornecedor",
      });

      expect(res).toEqual({ status: "ok", message: "Estoque ajustado com sucesso." });
      expect(mockRpc).toHaveBeenCalledWith("adjust_stock", {
        p_variant_id: "var-uuid-1",
        p_qty: 10,
        p_movement_type: "purchase",
        p_note: "Compra de fornecedor",
      });
    });

    it("should use null note when not provided", async () => {
      mockRpc.mockResolvedValueOnce({ error: null });

      await adjustStockHandler({ variantId: "var-uuid-1", qty: -1, movementType: "damage" });
      expect(mockRpc).toHaveBeenCalledWith("adjust_stock", {
        p_variant_id: "var-uuid-1",
        p_qty: -1,
        p_movement_type: "damage",
        p_note: null,
      });
    });

    it("should propagate RPC error", async () => {
      mockRpc.mockResolvedValueOnce({ error: { message: "Variant not found" } });

      await expect(
        adjustStockHandler({ variantId: "bad-uuid", qty: 1, movementType: "adjustment" }),
      ).rejects.toThrow("Variant not found");
    });
  });

  describe("getStockMovementsHandler", () => {
    it("should retrieve stock movements ordered by created_at desc limited by limit param", async () => {
      const mockMovements = [
        { id: "mov-1", movement_type: "purchase", qty: 10, created_at: "2026-01-01" },
      ];
      mockLimit.mockResolvedValueOnce({ data: mockMovements, error: null });

      const res = await getStockMovementsHandler(50);
      expect(res).toEqual(mockMovements);
      expect(mockFrom).toHaveBeenCalledWith("stock_movements");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it("should propagate database error", async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: { message: "DB movements fail" } });

      await expect(getStockMovementsHandler(50)).rejects.toThrow("DB movements fail");
    });

    it("should return empty array when data is null", async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: null });

      const res = await getStockMovementsHandler(10);
      expect(res).toEqual([]);
    });
  });
});
