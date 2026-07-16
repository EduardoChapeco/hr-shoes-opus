import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOnboardingProgressHandler,
  listCategoriesHandler,
  createCategoryHandler,
  listProductTypesHandler,
  createProductTypeHandler,
  listAdminProductsHandler,
  createProductHandler,
  getProductByIdHandler,
  updateProductHandler,
  upsertProductVariantHandler,
  deleteProductMediaHandler,
  addProductMediaLinkHandler,
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
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();

const mockStorageFrom = vi.fn();
const mockRemove = vi.fn();

const mockStorageBucket = {
  remove: mockRemove,
};
mockStorageFrom.mockReturnValue(mockStorageBucket);

const mockQueryBuilder = {
  select: mockSelect,
  limit: mockLimit,
  maybeSingle: mockMaybeSingle,
  in: mockIn,
  order: mockOrder,
  insert: mockInsert,
  single: mockSingle,
  delete: mockDelete,
  eq: mockEq,
  update: mockUpdate,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockMaybeSingle.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockInsert.mockReturnValue(mockQueryBuilder);
mockSingle.mockReturnValue(mockQueryBuilder);
mockDelete.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: mockFrom,
  storage: {
    from: mockStorageFrom,
  },
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
    mockDelete.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockStorageFrom.mockReturnValue(mockStorageBucket);
    mockRemove.mockResolvedValue({ error: null });
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

  describe("listAdminProductsHandler", () => {
    it("should retrieve products ordered by created_at desc", async () => {
      const mockProducts = [{ id: "prod-1", title: "Sapato Social", price_cents: 15000 }];
      mockOrder.mockResolvedValueOnce({ data: mockProducts, error: null });

      const res = await listAdminProductsHandler();
      expect(res).toEqual(mockProducts);
      expect(mockFrom).toHaveBeenCalledWith("products");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should propagate error on select fail", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: "Database select error" } });

      await expect(listAdminProductsHandler()).rejects.toThrow("Database select error");
    });
  });

  describe("createProductHandler", () => {
    it("should successfully insert a product and create variants/categories/media records", async () => {
      // 1st single: stores
      mockSingle.mockResolvedValueOnce({ data: { id: "store-123" } });
      // 2nd single: products insert
      const mockProduct = { id: "prod-1", title: "Tênis Preto" };
      mockSingle.mockResolvedValueOnce({ data: mockProduct, error: null });
      // 3rd single: variants insert
      mockSingle.mockResolvedValueOnce({ data: { id: "var-1", sku: "TENIS-P-38" }, error: null });

      const input = {
        title: "Tênis Preto",
        slug: "tenis-preto",
        price_cents: 19900,
        status: "published" as const,
        attributes: {},
        category_ids: ["cat-123"],
        media_urls: ["https://media.com/img1.png"],
        variants: [{ sku: "TENIS-P-38", attributes: { size: "38" }, price_cents: 19900, stock: 10 }],
      };

      const res = await createProductHandler(input);
      expect(res).toEqual(mockProduct);
      expect(mockFrom).toHaveBeenCalledWith("stores");
      expect(mockFrom).toHaveBeenCalledWith("products");
      expect(mockFrom).toHaveBeenCalledWith("product_categories");
      expect(mockFrom).toHaveBeenCalledWith("product_variants");
      expect(mockFrom).toHaveBeenCalledWith("stock_movements");
      expect(mockFrom).toHaveBeenCalledWith("product_media");
    });

    it("should throw if store not found", async () => {
      mockSingle.mockResolvedValueOnce({ data: null });

      await expect(
        createProductHandler({ title: "T", slug: "t", status: "draft", price_cents: 10, attributes: {} }),
      ).rejects.toThrow("No store found");
    });

    it("should propagate product insert database error", async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: "store-123" } });
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Insert error" } });

      await expect(
        createProductHandler({ title: "T", slug: "t", status: "draft", price_cents: 10, attributes: {} }),
      ).rejects.toThrow("Insert error");
    });
  });

  describe("getProductByIdHandler", () => {
    it("should retrieve a product by ID", async () => {
      const mockProduct = { id: "prod-1", title: "Tênis" };
      mockSingle.mockResolvedValueOnce({ data: mockProduct, error: null });

      const res = await getProductByIdHandler("prod-1");
      expect(res).toEqual(mockProduct);
      expect(mockFrom).toHaveBeenCalledWith("products");
      expect(mockEq).toHaveBeenCalledWith("id", "prod-1");
    });

    it("should propagate error on select single fail", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

      await expect(getProductByIdHandler("prod-1")).rejects.toThrow("Not found");
    });
  });

  describe("updateProductHandler", () => {
    it("should update product data and categories if provided", async () => {
      const mockUpdatedProduct = { id: "prod-1", title: "Tênis Novo" };
      mockSingle.mockResolvedValueOnce({ data: mockUpdatedProduct, error: null });

      const res = await updateProductHandler({
        id: "prod-1",
        title: "Tênis Novo",
        category_ids: ["cat-99"],
      });

      expect(res).toEqual(mockUpdatedProduct);
      expect(mockFrom).toHaveBeenCalledWith("products");
      expect(mockUpdate).toHaveBeenCalledWith({ title: "Tênis Novo" });
      expect(mockFrom).toHaveBeenCalledWith("product_categories");
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should propagate update database error", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Update fail" } });

      await expect(updateProductHandler({ id: "prod-1", title: "Error" })).rejects.toThrow("Update fail");
    });
  });

  describe("upsertProductVariantHandler", () => {
    it("should insert variant when id is missing", async () => {
      const mockVar = { id: "var-99", sku: "TENIS-99" };
      mockSingle.mockResolvedValueOnce({ data: mockVar, error: null });

      const res = await upsertProductVariantHandler({
        product_id: "prod-1",
        sku: "TENIS-99",
        status: "active",
        attributes: { size: "39" },
      });

      expect(res).toEqual(mockVar);
      expect(mockFrom).toHaveBeenCalledWith("product_variants");
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should update variant when id is present", async () => {
      const mockVar = { id: "var-99", sku: "TENIS-99" };
      mockSingle.mockResolvedValueOnce({ data: mockVar, error: null });

      const res = await upsertProductVariantHandler({
        id: "var-99",
        product_id: "prod-1",
        sku: "TENIS-99",
        status: "active",
        attributes: { size: "39" },
      });

      expect(res).toEqual(mockVar);
      expect(mockFrom).toHaveBeenCalledWith("product_variants");
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should propagate database error", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "DB Variant fail" } });

      await expect(
        upsertProductVariantHandler({
          product_id: "prod-1",
          sku: "TENIS-99",
          status: "active",
          attributes: {},
        }),
      ).rejects.toThrow("DB Variant fail");
    });
  });

  describe("deleteProductMediaHandler", () => {
    it("should successfully delete media link from db and invoke storage remove", async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      const res = await deleteProductMediaHandler({
        id: "media-1",
        url: "https://foo.com/product-media/img-123.png",
      });

      expect(res).toEqual({ status: "success" });
      expect(mockFrom).toHaveBeenCalledWith("product_media");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockStorageFrom).toHaveBeenCalledWith("product-media");
      expect(mockRemove).toHaveBeenCalledWith(["img-123.png"]);
    });

    it("should propagate database media deletion error", async () => {
      mockEq.mockResolvedValueOnce({ error: { message: "Link delete fail" } });

      await expect(
        deleteProductMediaHandler({ id: "media-1", url: "https://foo.com/product-media/img-123.png" }),
      ).rejects.toThrow("Link delete fail");
    });
  });

  describe("addProductMediaLinkHandler", () => {
    it("should successfully link product media in the database", async () => {
      const mockMediaLink = { id: "media-9", product_id: "prod-1", url: "https://foo.com/pic.jpg" };
      mockSingle.mockResolvedValueOnce({ data: mockMediaLink, error: null });

      const res = await addProductMediaLinkHandler({
        product_id: "prod-1",
        url: "https://foo.com/pic.jpg",
      });

      expect(res).toEqual(mockMediaLink);
      expect(mockFrom).toHaveBeenCalledWith("product_media");
      expect(mockInsert).toHaveBeenCalledWith({
        product_id: "prod-1",
        url: "https://foo.com/pic.jpg",
        sort_order: 99,
      });
    });

    it("should propagate media linking database error", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Link insert fail" } });

      await expect(
        addProductMediaLinkHandler({ product_id: "prod-1", url: "https://foo.com/pic.jpg" }),
      ).rejects.toThrow("Link insert fail");
    });
  });
});
