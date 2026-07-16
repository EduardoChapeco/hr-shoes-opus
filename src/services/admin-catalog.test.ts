import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOnboardingProgressHandler,
  listCategoriesHandler,
  createCategoryHandler,
  listProductTypesHandler,
  createProductTypeHandler,
} from "./admin-catalog.functions";
import { getServerClient } from "@/lib/supabase";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  limit: mockLimit,
  maybeSingle: mockMaybeSingle,
  in: mockIn,
  order: mockOrder,
  insert: mockInsert,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockMaybeSingle.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockInsert.mockReturnValue(mockQueryBuilder);
mockSingle.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: mockFrom,
};

vi.mock("@/lib/supabase", () => {
  return {
    getServerClient: () => mockSupabase,
    SupabaseUnconfiguredError: class extends Error {},
  };
});

describe("Admin Catalog Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockLimit.mockReturnValue(mockQueryBuilder);
    mockMaybeSingle.mockReturnValue(mockQueryBuilder);
    mockIn.mockReturnValue(mockQueryBuilder);
    mockOrder.mockReturnValue(mockQueryBuilder);
    mockInsert.mockReturnValue(mockQueryBuilder);
    mockSingle.mockReturnValue(mockQueryBuilder);
  });

  describe("getOnboardingProgressHandler", () => {
    it("should return false for all steps when database tables are empty", async () => {
      // Setup the sequence of select calls
      mockSelect
        .mockReturnValueOnce(mockQueryBuilder) // stores
        .mockResolvedValueOnce({ count: 0 }) // theme_settings
        .mockResolvedValueOnce({ count: 0 }) // products
        .mockResolvedValueOnce({ count: 0 }) // shipping_rates
        .mockReturnValueOnce(mockQueryBuilder) // integration_credentials
        .mockResolvedValueOnce({ count: 0 }); // pages

      mockMaybeSingle.mockResolvedValueOnce({ data: null });
      mockIn.mockResolvedValueOnce({ count: 0 });

      const res = await getOnboardingProgressHandler();
      expect(res).toEqual({
        storeDone: false,
        themeDone: false,
        productsDone: false,
        shippingDone: false,
        paymentsDone: false,
        cmsDone: false,
      });
    });

    it("should return true for steps that have completed setup / data in tables", async () => {
      // Setup the sequence of select calls
      mockSelect
        .mockReturnValueOnce(mockQueryBuilder) // stores
        .mockResolvedValueOnce({ count: 1 }) // theme_settings
        .mockResolvedValueOnce({ count: 5 }) // products
        .mockResolvedValueOnce({ count: 0 }) // shipping_rates
        .mockReturnValueOnce(mockQueryBuilder) // integration_credentials
        .mockResolvedValueOnce({ count: 3 }); // pages

      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "store-123", settings: { some: "config" } } });
      mockIn.mockResolvedValueOnce({ count: 2 });

      const res = await getOnboardingProgressHandler();
      expect(res).toEqual({
        storeDone: true,
        themeDone: true,
        productsDone: true,
        shippingDone: false,
        paymentsDone: true,
        cmsDone: true,
      });
    });
  });

  describe("listCategoriesHandler", () => {
    it("should retrieve categories ordered by sort_order", async () => {
      const mockCategories = [{ id: "cat-1", name: "Sapatos", slug: "sapatos" }];
      mockOrder.mockResolvedValueOnce({ data: mockCategories, error: null });

      const res = await listCategoriesHandler();
      expect(res).toEqual(mockCategories);
      expect(mockFrom).toHaveBeenCalledWith("categories");
      expect(mockOrder).toHaveBeenCalledWith("sort_order", { ascending: true });
    });

    it("should propagate database error", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB select error" } });

      await expect(listCategoriesHandler()).rejects.toThrow("DB select error");
    });
  });

  describe("createCategoryHandler", () => {
    it("should successfully insert a category linked to the store", async () => {
      // 1st single (store query): returns store id
      // 2nd single (category query): returns new category
      mockSingle
        .mockResolvedValueOnce({ data: { id: "store-123" } })
        .mockResolvedValueOnce({ data: { id: "cat-1", name: "Novidades", slug: "novidades" }, error: null });

      const input = { name: "Novidades", slug: "novidades", status: "active" as const };
      const res = await createCategoryHandler(input);

      expect(res).toEqual({ id: "cat-1", name: "Novidades", slug: "novidades" });
      expect(mockFrom).toHaveBeenCalledWith("stores");
      expect(mockFrom).toHaveBeenCalledWith("categories");
      expect(mockInsert).toHaveBeenCalledWith({
        store_id: "store-123",
        ...input,
      });
    });

    it("should throw error if store is missing", async () => {
      // 1st single returns null
      mockSingle.mockResolvedValueOnce({ data: null });

      await expect(
        createCategoryHandler({ name: "Novidades", slug: "novidades", status: "active" }),
      ).rejects.toThrow("No store found");
    });

    it("should propagate database insert error", async () => {
      // 1st single returns store
      // 2nd single returns insert error
      mockSingle
        .mockResolvedValueOnce({ data: { id: "store-123" } })
        .mockResolvedValueOnce({ data: null, error: { message: "DB insert error" } });

      await expect(
        createCategoryHandler({ name: "Novidades", slug: "novidades", status: "active" }),
      ).rejects.toThrow("DB insert error");
    });
  });

  describe("listProductTypesHandler", () => {
    it("should retrieve product types ordered by created_at desc", async () => {
      const mockTypes = [{ id: "type-1", name: "Tênis", slug: "tenis", field_schema: [] }];
      mockOrder.mockResolvedValueOnce({ data: mockTypes, error: null });

      const res = await listProductTypesHandler();
      expect(res).toEqual(mockTypes);
      expect(mockFrom).toHaveBeenCalledWith("product_types");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should propagate database error", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB select error" } });

      await expect(listProductTypesHandler()).rejects.toThrow("DB select error");
    });
  });

  describe("createProductTypeHandler", () => {
    it("should successfully insert a product type linked to store and organization", async () => {
      mockSingle
        .mockResolvedValueOnce({ data: { id: "store-123", organization_id: "org-456" } })
        .mockResolvedValueOnce({ data: { id: "type-1", name: "Tênis", slug: "tenis" }, error: null });

      const input = { name: "Tênis", slug: "tenis", field_schema: [{ name: "Tamanho", kind: "text", required: true }] };
      const res = await createProductTypeHandler(input);

      expect(res).toEqual({ id: "type-1", name: "Tênis", slug: "tenis" });
      expect(mockFrom).toHaveBeenCalledWith("stores");
      expect(mockFrom).toHaveBeenCalledWith("product_types");
      expect(mockInsert).toHaveBeenCalledWith({
        store_id: "store-123",
        organization_id: "org-456",
        ...input,
      });
    });

    it("should throw error if store is missing", async () => {
      mockSingle.mockResolvedValueOnce({ data: null });

      await expect(
        createProductTypeHandler({ name: "Tênis", slug: "tenis", field_schema: [] }),
      ).rejects.toThrow("No store found");
    });

    it("should propagate database insert error", async () => {
      mockSingle
        .mockResolvedValueOnce({ data: { id: "store-123", organization_id: "org-456" } })
        .mockResolvedValueOnce({ data: null, error: { message: "DB insert error" } });

      await expect(
        createProductTypeHandler({ name: "Tênis", slug: "tenis", field_schema: [] }),
      ).rejects.toThrow("DB insert error");
    });
  });
});
