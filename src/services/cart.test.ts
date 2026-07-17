import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentIdentity } from "./cart-helpers";

vi.mock("@/lib/supabase", () => ({
  getServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase-ssr.server", () => ({
  getSSRClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cust-123" } } }),
    },
  })),
}));

vi.mock("@/lib/session", () => ({
  getOrCreateGuestSession: vi.fn().mockReturnValue("session-abc"),
  getGuestSession: vi.fn().mockReturnValue("session-abc"),
  getSellerRefCookie: vi.fn().mockReturnValue(null),
}));

describe("Cart Functions & Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentIdentity", () => {
    it("should return customer_id when user is authenticated", async () => {
      const identity = await getCurrentIdentity();
      expect(identity).toEqual({
        customer_id: "cust-123",
        session_token: null,
      });
    });
  });
});
