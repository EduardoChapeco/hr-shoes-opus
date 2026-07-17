import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardDataHandler } from "./dashboard.functions";
import { getServerIdentity } from "@/lib/identity";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  lte: mockLte,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockGte.mockReturnValue(mockQueryBuilder);
mockLte.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockSingle.mockReturnValue(mockQueryBuilder);
mockMaybeSingle.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: mockFrom,
};

vi.mock("@/lib/supabase", () => {
  return {
    getServerClient: () => mockSupabase,
    SupabaseUnconfiguredError: class extends Error {},
  };
});

vi.mock("@/lib/identity", () => {
  return {
    getServerIdentity: vi.fn(),
    assertStoreAccess: vi.mocked((identity: any, allowedRoles: string[]) => {
      if (!identity.id || !identity.store_id || !allowedRoles.includes(identity.role)) {
        throw new Error("Não autorizado");
      }
    }),
  };
});

describe("Dashboard Services", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockGte.mockReturnValue(mockQueryBuilder);
    mockLte.mockReturnValue(mockQueryBuilder);
    mockOrder.mockReturnValue(mockQueryBuilder);
    mockLimit.mockReturnValue(mockQueryBuilder);
    mockSingle.mockReturnValue(mockQueryBuilder);
    mockMaybeSingle.mockReturnValue(mockQueryBuilder);

    vi.mocked(getServerIdentity).mockResolvedValue({
      id: "user-123",
      role: "owner",
      store_id: "store-123",
    });
  });

  it("should aggregate sales, orders, stock alerts and store checklist correctly", async () => {
    const now = new Date().toISOString();

    const mockOrders = [
      { id: "o-1", status: "paid", total_cents: 15000, created_at: now },
      { id: "o-2", status: "awaiting_payment", total_cents: 8000, created_at: now },
    ];

    const mockVariants = [
      { id: "v-1", sku: "SAP-38", stock_on_hand: 2, products: { title: "Sapato Fem" } },
    ];

    const mockStore = { name: "Hr Shoes Central", phone: "4999999999", address: "Rua Central" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "orders") {
        return { select: () => ({ eq: () => Promise.resolve({ data: mockOrders, error: null }) }) };
      }
      if (table === "product_variants") {
        return {
          select: () => ({
            lte: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: mockVariants, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "customers") {
        return { select: () => ({ gte: () => Promise.resolve({ count: 5, error: null }) }) };
      }
      if (table === "carts") {
        return { select: () => ({ gte: () => Promise.resolve({ count: 2, error: null }) }) };
      }
      if (table === "cash_registers") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { id: "reg-1", opened_at: now, initial_balance_cents: 10000 },
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "cash_register_entries") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [{ amount_cents: 5000 }], error: null }) }) };
      }
      if (table === "stores") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockStore, error: null }) }) }) };
      }
      if (table === "products") {
        return { select: () => Promise.resolve({ count: 10, error: null }) };
      }
      if (table === "categories") {
        return { select: () => Promise.resolve({ count: 3, error: null }) };
      }
      if (table === "store_payment_settings") {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { pix_manual_enabled: true }, error: null }) }) }) };
      }
      if (table === "shipping_rates") {
        return { select: () => Promise.resolve({ count: 2, error: null }) };
      }
      return mockQueryBuilder;
    });

    const metrics = await getDashboardDataHandler();

    expect(metrics.salesTodayCents).toBe(15000);
    expect(metrics.ordersTodayCount).toBe(2);
    expect(metrics.ordersBreakdown.needsSeparation).toBe(1);
    expect(metrics.ordersBreakdown.awaitingPayment).toBe(1);
    expect(metrics.criticalStockCount).toBe(1);
    expect(metrics.lowStockItems[0].sku).toBe("SAP-38");
    expect(metrics.activeCashRegister?.isOpen).toBe(true);
    expect(metrics.activeCashRegister?.currentBalanceCents).toBe(15000);
    expect(metrics.setupProgressPercentage).toBe(100);
  });

  it("should throw error if user has no store access", async () => {
    vi.mocked(getServerIdentity).mockResolvedValue({
      id: "user-999",
      role: "visitor",
      store_id: null as any,
    });

    await expect(getDashboardDataHandler()).rejects.toThrow("Não autorizado");
  });
});
