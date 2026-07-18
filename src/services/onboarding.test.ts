import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOnboardingStatusHandler } from "./onboarding.functions";
import { getServerIdentity } from "@/lib/identity";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGt = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  gt: mockGt,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockGt.mockReturnValue(mockQueryBuilder);
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

describe("Onboarding Services", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockGt.mockReturnValue(mockQueryBuilder);
    mockSingle.mockReturnValue(mockQueryBuilder);
    mockMaybeSingle.mockReturnValue(mockQueryBuilder);

    vi.mocked(getServerIdentity).mockResolvedValue({
      id: "user-123",
      role: "owner",
      store_id: "store-123",
      organization_id: null,
    });
  });

  it("should classify completed steps when database returns complete records", async () => {
    const mockStore = {
      name: "Hr Shoes Central",
      email: "contato@hrshoes.com",
      phone: "4999999999",
      address: "Rua Central 100",
      city: "Chapecó",
      state: "SC",
      logo_url: "https://example.com/logo.png",
      policies: { returns: "30 dias" },
      seo_title: "Hr Shoes — Loja de Calçados",
      seo_description: "A melhor loja de calçados",
      pix_key: "chave-pix",
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "stores") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockStore, error: null }) }) }) };
      }
      if (table === "shipping_rates" || table === "categories" || table === "products" || table === "orders" || table === "coupons") {
        return { select: () => Promise.resolve({ count: 2, error: null }) };
      }
      if (table === "product_variants") {
        return { select: () => ({ gt: () => Promise.resolve({ count: 5, error: null }) }) };
      }
      return mockQueryBuilder;
    });

    const overview = await getOnboardingStatusHandler();

    expect(overview.completedSteps).toBe(12);
    expect(overview.progressPercentage).toBe(100);
    expect(overview.isStoreReadyToSell).toBe(true);
  });

  it("should classify technical_error for a table failure without zeroing other steps", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "stores") {
        return { select: () => ({ eq: () => ({ single: () => Promise.reject(new Error("Database connection timeout")) }) }) };
      }
      if (table === "shipping_rates" || table === "categories" || table === "products" || table === "orders" || table === "coupons") {
        return { select: () => Promise.resolve({ count: 1, error: null }) };
      }
      if (table === "product_variants") {
        return { select: () => ({ gt: () => Promise.resolve({ count: 1, error: null }) }) };
      }
      return mockQueryBuilder;
    });

    const overview = await getOnboardingStatusHandler();

    const profileStep = overview.steps.find((s) => s.id === "profile");
    const shippingStep = overview.steps.find((s) => s.id === "shipping");

    expect(profileStep?.status).toBe("technical_error");
    expect(shippingStep?.status).toBe("completed");
    expect(overview.completedSteps).toBeGreaterThan(0);
  });

  it("should classify locked step when prerequisites are missing", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "stores") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { name: "Hr Shoes" }, error: null }) }) }) };
      }
      if (table === "product_variants") {
        return { select: () => ({ gt: () => Promise.resolve({ count: 0, error: null }) }) };
      }
      return { select: () => Promise.resolve({ count: 0, error: null }) };
    });

    const overview = await getOnboardingStatusHandler();

    const stockStep = overview.steps.find((s) => s.id === "stock");
    const orderStep = overview.steps.find((s) => s.id === "first_order");

    expect(stockStep?.status).toBe("locked");
    expect(orderStep?.status).toBe("locked");
  });
});
