import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listShippingZonesHandler,
  upsertShippingZoneHandler,
  deleteShippingZoneHandler,
  upsertShippingRateHandler,
  deleteShippingRateHandler,
  calculateShippingHandler,
} from "./shipping.functions";

const storeId = "store-123";
const userId = "user-123";

// Helper to create a thenable query builder mock
function createMockQueryBuilder(resolvedValue: any) {
  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => builder),
    update: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    single: vi.fn().mockImplementation(() => builder),
    limit: vi.fn().mockImplementation(() => builder),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve(resolvedValue).then(onfulfilled);
    }),
  };
  return builder;
}

const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getServerClient: () => mockSupabase,
  SupabaseUnconfiguredError: class extends Error {},
}));

vi.mock("@/lib/supabase-ssr.server", () => ({
  getSSRClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe("Shipping Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock profiles query (for getAdminIdentity)
    mockFrom.mockImplementation((table) => {
      if (table === "profiles") {
        return createMockQueryBuilder({
          data: { role: "owner", store_id: storeId },
          error: null,
        });
      }
      return createMockQueryBuilder({ data: [], error: null });
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
  });

  describe("listShippingZonesHandler", () => {
    it("should list all zones belonging to the store", async () => {
      const mockZones = [{ id: "zone-1", name: "Sul", regions: ["80", "81"], is_active: true }];
      const builder = createMockQueryBuilder({ data: mockZones, error: null });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });

      const res = await listShippingZonesHandler();
      expect(res).toEqual(mockZones);
      expect(mockFrom).toHaveBeenCalledWith("shipping_zones");
      expect(builder.eq).toHaveBeenCalledWith("store_id", storeId);
    });

    it("should propagate errors from database", async () => {
      const builder = createMockQueryBuilder({ data: null, error: new Error("DB Error") });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });
      await expect(listShippingZonesHandler()).rejects.toThrow("DB Error");
    });
  });

  describe("upsertShippingZoneHandler", () => {
    it("should insert a new zone", async () => {
      const newZone = { name: "Sudeste", regions: ["11", "12", "13"], is_active: true };
      const createdZone = { id: "zone-2", ...newZone, store_id: storeId };
      const builder = createMockQueryBuilder({ data: createdZone, error: null });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });

      const res = await upsertShippingZoneHandler(newZone);
      expect(res).toEqual(createdZone);
      expect(builder.insert).toHaveBeenCalledWith({ ...newZone, store_id: storeId });
    });

    it("should update an existing zone", async () => {
      const zoneToUpdate = { id: "zone-2", name: "Sudeste Editado", regions: ["11"], is_active: true };
      const updatedZone = { ...zoneToUpdate, store_id: storeId };
      const builder = createMockQueryBuilder({ data: updatedZone, error: null });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });

      const res = await upsertShippingZoneHandler(zoneToUpdate);
      expect(res).toEqual(updatedZone);
      expect(builder.update).toHaveBeenCalledWith({
        store_id: storeId,
        name: "Sudeste Editado",
        regions: ["11"],
        is_active: true,
      });
      expect(builder.eq).toHaveBeenCalledWith("id", "zone-2");
    });
  });

  describe("deleteShippingZoneHandler", () => {
    it("should delete a zone belonging to the store", async () => {
      const builder = createMockQueryBuilder({ error: null });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });

      await deleteShippingZoneHandler("zone-2");
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "zone-2");
      expect(builder.eq).toHaveBeenCalledWith("store_id", storeId);
    });

    it("should throw error if delete fails", async () => {
      const builder = createMockQueryBuilder({ error: new Error("Fail to delete") });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });

      await expect(deleteShippingZoneHandler("zone-2")).rejects.toThrow("Fail to delete");
    });
  });

  describe("upsertShippingRateHandler", () => {
    it("should insert a rate", async () => {
      const mockRate = { zone_id: "zone-1", name: "PAC", price_cents: 1500, is_active: true };
      const createdRate = { id: "rate-1", ...mockRate };
      const builder = createMockQueryBuilder({ data: createdRate, error: null });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });

      const res = await upsertShippingRateHandler(mockRate);
      expect(res).toEqual(createdRate);
      expect(builder.insert).toHaveBeenCalledWith({
        ...mockRate,
        min_order_cents: null,
        estimated_days: null,
      });
    });
  });

  describe("deleteShippingRateHandler", () => {
    it("should delete a shipping rate", async () => {
      const builder = createMockQueryBuilder({ error: null });
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return createMockQueryBuilder({ data: { role: "owner", store_id: storeId }, error: null });
        }
        return builder;
      });

      await deleteShippingRateHandler("rate-1");
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "rate-1");
    });
  });

  describe("calculateShippingHandler", () => {
    it("should match zipcode and return applicable rates", async () => {
      const mockZones = [
        {
          id: "zone-1",
          regions: ["80", "81"],
          rates: [
            { id: "rate-1", name: "PAC Sul", price_cents: 1000, is_active: true },
          ],
        },
        {
          id: "zone-2",
          regions: ["*"],
          rates: [
            { id: "rate-2", name: "PAC Nacional", price_cents: 2500, is_active: true },
          ],
        },
      ];

      mockFrom.mockImplementation((table) => {
        if (table === "stores") {
          return createMockQueryBuilder({ data: { id: storeId }, error: null });
        }
        if (table === "shipping_zones") {
          return createMockQueryBuilder({ data: mockZones, error: null });
        }
        return createMockQueryBuilder({ data: [], error: null });
      });

      const res = await calculateShippingHandler("80000000");
      expect(res).toContainEqual(expect.objectContaining({ name: "PAC Sul" }));
      expect(res).toContainEqual(expect.objectContaining({ name: "PAC Nacional" }));
    });
  });
});
