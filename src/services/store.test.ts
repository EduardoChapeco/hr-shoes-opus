import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStoreSettingsHandler,
  saveStoreSettingsHandler,
  getPoliciesHandler,
  savePoliciesHandler,
  getStoreSeoHandler,
  saveStoreSeoHandler,
} from "./store.functions";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/identity";

vi.mock("@/lib/supabase", () => {
  const mSelect = vi.fn();
  const mEq = vi.fn();
  const mLimit = vi.fn();
  const mSingle = vi.fn();
  const mUpdate = vi.fn();

  const mSupabase = {
    from: vi.fn(() => ({
      select: mSelect,
      eq: mEq,
      limit: mLimit,
      single: mSingle,
      update: mUpdate,
    })),
  };

  return {
    getServerClient: vi.fn(() => mSupabase),
    mSelect,
    mEq,
    mLimit,
    mSingle,
    mUpdate,
  };
});

vi.mock("@/lib/identity", () => ({
  getServerIdentity: vi.fn(),
  assertStoreAccess: vi.fn(),
}));

describe("Store Settings Server Functions", () => {
  let supabaseMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock = getServerClient();
  });

  describe("getStoreSettings", () => {
    it("should successfully retrieve store settings for authorized user", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mockStoreData = { id: "store-456", name: "Hr Shoes" };
      supabaseMock.from().select.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockReturnValue(supabaseMock.from());
      supabaseMock.from().single.mockResolvedValue({ data: mockStoreData, error: null });

      const result = await getStoreSettingsHandler();

      expect(getServerIdentity).toHaveBeenCalled();
      expect(supabaseMock.from).toHaveBeenCalledWith("stores");
      expect(supabaseMock.from().eq).toHaveBeenCalledWith("id", "store-456");
      expect(result).toEqual({ status: "ok", data: mockStoreData });
    });

    it("should throw error if database select fails", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      supabaseMock.from().select.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockReturnValue(supabaseMock.from());
      supabaseMock.from().single.mockResolvedValue({ data: null, error: { message: "DB Error" } });

      await expect(getStoreSettingsHandler()).rejects.toThrow("Loja não encontrada ou erro ao carregar configurações");
    });
  });

  describe("saveStoreSettings", () => {
    it("should successfully update store settings for authorized user", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      supabaseMock.from().update.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockResolvedValue({ error: null });

      const updateData = { name: "New Name" };
      const result = await saveStoreSettingsHandler(updateData);

      expect(supabaseMock.from).toHaveBeenCalledWith("stores");
      expect(supabaseMock.from().update).toHaveBeenCalledWith(updateData);
      expect(supabaseMock.from().eq).toHaveBeenCalledWith("id", "store-456");
      expect(result).toEqual({ status: "success" });
    });
  });

  describe("getPolicies", () => {
    it("should successfully retrieve store policies for authorized user", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mockStoreData = { id: "store-456", policies: { terms: "terms content" } };
      supabaseMock.from().select.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockReturnValue(supabaseMock.from());
      supabaseMock.from().single.mockResolvedValue({ data: mockStoreData, error: null });

      const result = await getPoliciesHandler();

      expect(supabaseMock.from).toHaveBeenCalledWith("stores");
      expect(supabaseMock.from().eq).toHaveBeenCalledWith("id", "store-456");
      expect(result).toEqual({ status: "ok", data: mockStoreData });
    });
  });

  describe("savePolicies", () => {
    it("should successfully update policies", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      supabaseMock.from().update.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockResolvedValue({ error: null });

      const mockPolicies = { privacy_policy: "p", return_policy: "r", terms: "t" };
      const result = await savePoliciesHandler(mockPolicies);

      expect(supabaseMock.from().update).toHaveBeenCalledWith({ policies: mockPolicies });
      expect(result).toEqual({ status: "success" });
    });
  });

  describe("getStoreSeo", () => {
    it("should successfully retrieve SEO settings", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mockSeoData = { id: "store-456", seo_title: "title" };
      supabaseMock.from().select.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockReturnValue(supabaseMock.from());
      supabaseMock.from().single.mockResolvedValue({ data: mockSeoData, error: null });

      const result = await getStoreSeoHandler();

      expect(result).toEqual({ status: "ok", data: mockSeoData });
    });
  });

  describe("saveStoreSeo", () => {
    it("should successfully update SEO", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      supabaseMock.from().update.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockResolvedValue({ error: null });

      const mockSeo = { seo_title: "t", seo_description: "d", seo_keywords: "k" };
      const result = await saveStoreSeoHandler(mockSeo);

      expect(supabaseMock.from().update).toHaveBeenCalledWith(mockSeo);
      expect(result).toEqual({ status: "success" });
    });
  });
});
