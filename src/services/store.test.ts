import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStoreSettingsHandler, saveStoreSettingsHandler } from "./store.functions";
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

    it("should throw error if database update fails", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner" };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      supabaseMock.from().update.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockResolvedValue({ error: { message: "Update Failed" } });

      const updateData = { name: "New Name" };
      await expect(saveStoreSettingsHandler(updateData)).rejects.toThrow("Erro ao salvar dados da loja: Update Failed");
    });
  });
});
