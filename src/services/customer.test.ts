import { describe, it, expect, vi, beforeEach } from "vitest";
import { setDefaultAddressHandler } from "./customer.functions";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

const mockQueryBuilder = {
  update: mockUpdate,
  eq: mockEq,
};

vi.mock("@/lib/supabase-ssr.server", () => {
  return {
    getSSRClient: () => ({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    }),
  };
});

describe("Customer Address Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
  });

  describe("setDefaultAddressHandler", () => {
    it("should throw error if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(setDefaultAddressHandler("some-uuid")).rejects.toThrow("Não autorizado");
    });

    it("should unset current default address, set new default address, and return success", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });

      mockEq
        .mockResolvedValueOnce({ error: null }) // First chain unset
        .mockReturnValueOnce(mockQueryBuilder) // Second chain 1st eq
        .mockResolvedValueOnce({ error: null }); // Second chain 2nd eq

      const res = await setDefaultAddressHandler("new-default-uuid");
      expect(res).toEqual({ status: "success" });
      expect(mockFrom).toHaveBeenCalledWith("customer_addresses");
    });

    it("should throw error if unset current default address fails", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });

      mockEq.mockResolvedValueOnce({ error: { message: "Database error on unset" } });

      await expect(setDefaultAddressHandler("new-default-uuid")).rejects.toThrow(
        "Database error on unset",
      );
    });

    it("should throw error if set default address fails", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });

      mockEq
        .mockResolvedValueOnce({ error: null }) // First chain unset
        .mockReturnValueOnce(mockQueryBuilder) // Second chain 1st eq
        .mockResolvedValueOnce({ error: { message: "Database error on set" } }); // Second chain 2nd eq

      await expect(setDefaultAddressHandler("new-default-uuid")).rejects.toThrow(
        "Database error on set",
      );
    });
  });
});
