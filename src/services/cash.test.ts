import { describe, it, expect, vi, beforeEach } from "vitest";
import { openRegisterHandler, addRegisterEntryHandler, processPOSSaleHandler } from "./cash.functions";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/identity";

vi.mock("@/lib/supabase", () => {
  const mSelect = vi.fn();
  const mEq = vi.fn();
  const mIn = vi.fn();
  const mIs = vi.fn();
  const mOrder = vi.fn();
  const mLimit = vi.fn();
  const mSingle = vi.fn();
  const mMaybeSingle = vi.fn();
  const mInsert = vi.fn();
  const mUpdate = vi.fn();
  const mRpc = vi.fn();

  const mSupabase = {
    from: vi.fn(() => ({
      select: mSelect,
      eq: mEq,
      in: mIn,
      is: mIs,
      order: mOrder,
      limit: mLimit,
      single: mSingle,
      maybeSingle: mMaybeSingle,
      insert: mInsert,
      update: mUpdate,
    })),
    rpc: mRpc,
  };

  return {
    getServerClient: vi.fn(() => mSupabase),
    mSelect,
    mEq,
    mIn,
    mIs,
    mOrder,
    mLimit,
    mSingle,
    mMaybeSingle,
    mInsert,
    mUpdate,
    mRpc,
  };
});

vi.mock("@/lib/identity", () => ({
  getServerIdentity: vi.fn(),
  assertStoreAccess: vi.fn(),
}));

describe("Cash Functions", () => {
  let supabaseMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock = getServerClient();
  });

  describe("openRegisterHandler", () => {
    it("should open cash register when no open register exists", async () => {
      const mockIdentity = {
        id: "user-123",
        store_id: "store-456",
        role: "owner",
        organization_id: "org-789",
      };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mInsert = vi.fn().mockResolvedValue({ error: null });

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === "cash_registers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: mMaybeSingle,
            insert: mInsert,
          };
        }
        return {};
      });

      const res = await openRegisterHandler(5000, "Fundo inicial");

      expect(res).toEqual({ status: "success" });
      expect(mInsert).toHaveBeenCalledWith({
        store_id: "store-456",
        opened_by: "user-123",
        initial_balance_cents: 5000,
        notes: "Fundo inicial",
        status: "open",
      });
    });

    it("should throw error if an active register is already open", async () => {
      const mockIdentity = {
        id: "user-123",
        store_id: "store-456",
        role: "owner",
        organization_id: "org-789",
      };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "active-reg-1" }, error: null });

      supabaseMock.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mMaybeSingle,
      }));

      await expect(openRegisterHandler(5000)).rejects.toThrow(
        "Já existe um caixa aberto nesta loja.",
      );
    });
  });

  describe("addRegisterEntryHandler", () => {
    it("should prevent a manual sangria that exceeds current cash in drawer balance", async () => {
      const mockIdentity = {
        id: "user-123",
        store_id: "store-456",
        role: "owner",
        organization_id: "org-789",
      };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      // Current cash balance is 100 BRL (initial: 10000 cents, no entries)
      const mSingle = vi.fn().mockResolvedValue({
        data: { status: "open", initial_balance_cents: 10000 },
        error: null,
      });

      // No entries in drawer
      const mSelect = vi.fn().mockReturnThis();
      const mEq = vi.fn().mockReturnThis();
      const mOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === "cash_registers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: mSingle,
          };
        }
        if (table === "cash_register_entries") {
          return {
            select: mSelect,
            eq: mEq,
            order: mOrder,
          };
        }
        return {};
      });

      // Request sangria of 150 BRL (-15000 cents) -> should throw since 150 > 100
      await expect(
        addRegisterEntryHandler("reg-111", -15000, "cash", "Pagamento de lanche"),
      ).rejects.toThrow(/Sangria indisponível/);
    });

    it("should allow a manual sangria if current cash balance is sufficient", async () => {
      const mockIdentity = {
        id: "user-123",
        store_id: "store-456",
        role: "owner",
        organization_id: "org-789",
      };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mSingle = vi.fn().mockResolvedValue({
        data: { status: "open", initial_balance_cents: 20000 }, // 200 BRL
        error: null,
      });

      const mOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      const mInsert = vi.fn().mockResolvedValue({ error: null });

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === "cash_registers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: mSingle,
          };
        }
        if (table === "cash_register_entries") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: mOrder,
            insert: mInsert,
          };
        }
        return {};
      });

      const res = await addRegisterEntryHandler("reg-111", -5000, "cash", "Sangria correta");

      expect(res).toEqual({ status: "success" });
      expect(mInsert).toHaveBeenCalled();
    });
  });

  describe("processPOSSaleHandler", () => {
    it("should process sale, deduct stock and add entry to open register", async () => {
      const mockIdentity = {
        id: "user-123",
        store_id: "store-456",
        role: "owner",
        organization_id: "org-789",
      };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mSingleReg = vi.fn().mockResolvedValue({
        data: { id: "reg-111", status: "open" },
        error: null,
      });

      const mSingleEntry = vi.fn().mockResolvedValue({
        data: { id: "entry-999" },
        error: null,
      });

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === "cash_registers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: mSingleReg,
          };
        }
        if (table === "cash_register_entries") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: mSingleEntry,
          };
        }
        return {};
      });

      supabaseMock.rpc.mockResolvedValue({ error: null });

      const res = await processPOSSaleHandler({
        registerId: "reg-111",
        items: [
          {
            variantId: "var-1",
            qty: 2,
            priceCents: 15000,
            title: "Scarpin Couro",
            sku: "SC-36",
          },
        ],
        paymentMethod: "cash",
        discountCents: 1000,
        amountPaidCents: 30000,
        customerName: "Maria Silva",
      });

      expect(res.status).toBe("success");
      expect(res.subtotalCents).toBe(30000);
      expect(res.totalCents).toBe(29000);
      expect(res.changeCents).toBe(1000);
      expect(supabaseMock.rpc).toHaveBeenCalledWith("adjust_stock", {
        p_variant_id: "var-1",
        p_qty: -2,
        p_movement_type: "sale",
        p_note: "Venda PDV Balcão - SKU: SC-36",
      });
    });
  });
});
