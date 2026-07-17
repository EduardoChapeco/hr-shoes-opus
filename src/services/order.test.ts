import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
} from "./order.functions";

// ------------------------------------------------------------------ Mocks --

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();

const mockQueryChain = {
  select: mockSelect,
  order: mockOrder,
  eq: mockEq,
  in: mockIn,
  update: mockUpdate,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryChain);
mockOrder.mockReturnValue(mockQueryChain);
mockEq.mockReturnValue(mockQueryChain);
mockIn.mockReturnValue(mockQueryChain);
mockUpdate.mockReturnValue(mockQueryChain);

const mockSupabase = { from: mockFrom };

vi.mock("@/lib/supabase", () => ({
  getServerClient: () => mockSupabase,
  SupabaseUnconfiguredError: class extends Error {},
}));

// --------------------------------------------------------------------- Tests

describe("listOrdersHandler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryChain);
    mockSelect.mockReturnValue(mockQueryChain);
    mockOrder.mockReturnValue(mockQueryChain);
  });

  it("should return all orders ordered by created_at desc", async () => {
    const orders = [{ id: "ord-1", status: "paid", total_cents: 15000 }];
    mockOrder.mockResolvedValueOnce({ data: orders, error: null });

    const res = await listOrdersHandler();
    expect(res).toEqual(orders);
    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("should return empty array when data is null", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: null });
    const res = await listOrdersHandler();
    expect(res).toEqual([]);
  });

  it("should propagate database error", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    await expect(listOrdersHandler()).rejects.toThrow("DB error");
  });
});

describe("getOrderByIdHandler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryChain);
    mockSelect.mockReturnValue(mockQueryChain);
    mockEq.mockReturnValue(mockQueryChain);
  });

  it("should return order details by ID", async () => {
    const order = {
      id: "ord-1",
      public_token: "ABC123",
      status: "processing",
      total_cents: 15000,
      order_items: [
        {
          id: "oi-1",
          product_title: "Tênis HR",
          qty: 2,
          unit_price_cents: 7500,
          total_cents: 15000,
        },
      ],
    };
    mockSingle.mockResolvedValueOnce({ data: order, error: null });

    const res = await getOrderByIdHandler("ord-1");
    expect(res).toEqual(order);
    expect(mockEq).toHaveBeenCalledWith("id", "ord-1");
  });

  it("should throw error when order not found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "No rows" } });
    await expect(getOrderByIdHandler("bad-id")).rejects.toThrow("Pedido não encontrado");
  });
});

describe("updateOrderStatusHandler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryChain);
    mockUpdate.mockReturnValue(mockQueryChain);
    mockEq.mockReturnValue(mockQueryChain);
  });

  it("should update order status and return ok", async () => {
    mockEq.mockResolvedValueOnce({ error: null });

    const res = await updateOrderStatusHandler("ord-1", "shipped");
    expect(res).toEqual({ status: "ok", message: "Status do pedido atualizado." });
    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(mockUpdate).toHaveBeenCalledWith({ status: "shipped" });
    expect(mockEq).toHaveBeenCalledWith("id", "ord-1");
  });

  it("should propagate error when update fails", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "RLS violation" } });
    await expect(updateOrderStatusHandler("ord-1", "delivered")).rejects.toThrow("RLS violation");
  });
});
