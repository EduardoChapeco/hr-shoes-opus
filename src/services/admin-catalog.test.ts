import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOnboardingProgressHandler } from "./admin-catalog.functions";
import { getServerClient } from "@/lib/supabase";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();
const mockIn = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  limit: mockLimit,
  maybeSingle: mockMaybeSingle,
  in: mockIn,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockMaybeSingle.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);

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
});
