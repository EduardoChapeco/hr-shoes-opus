import { describe, it, expect, vi, beforeEach } from "vitest";
import { listAdminPagesHandler } from "./cms.functions";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();

const mockQueryChain = {
  select: mockSelect,
  order: mockOrder,
};

mockSelect.mockReturnValue(mockQueryChain);
mockOrder.mockReturnValue(mockQueryChain);

const mockSupabase = { from: mockFrom };

vi.mock("@/lib/supabase", () => ({
  getServerClient: () => mockSupabase,
  SupabaseUnconfiguredError: class extends Error {},
}));

describe("CMS Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryChain);
    mockSelect.mockReturnValue(mockQueryChain);
    mockOrder.mockReturnValue(mockQueryChain);
  });

  describe("listAdminPagesHandler", () => {
    it("should list all CMS pages ordered by created_at desc", async () => {
      const mockPages = [{ id: "p1", title: "Home", slug: "home", status: "published" }];
      mockOrder.mockResolvedValueOnce({ data: mockPages, error: null });

      const res = await listAdminPagesHandler();
      expect(res).toEqual(mockPages);
      expect(mockFrom).toHaveBeenCalledWith("pages");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should return empty array when data is null", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: null });
      const res = await listAdminPagesHandler();
      expect(res).toEqual([]);
    });

    it("should throw database errors", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: new Error("DB Error") });
      await expect(listAdminPagesHandler()).rejects.toThrow("DB Error");
    });
  });
});
