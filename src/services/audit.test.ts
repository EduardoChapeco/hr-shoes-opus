import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuditLogHandler } from "./audit.functions";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/identity";

vi.mock("@/lib/supabase", () => {
  const mSelect = vi.fn();
  const mEq = vi.fn();
  const mOrder = vi.fn();
  const mLimit = vi.fn();

  const mSupabase = {
    from: vi.fn(() => ({
      select: mSelect,
      eq: mEq,
      order: mOrder,
      limit: mLimit,
    })),
  };

  return {
    getServerClient: vi.fn(() => mSupabase),
    mSelect,
    mEq,
    mOrder,
    mLimit,
  };
});

vi.mock("@/lib/identity", () => ({
  getServerIdentity: vi.fn(),
  assertStoreAccess: vi.fn(),
}));

describe("Audit Server Functions", () => {
  let supabaseMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock = getServerClient();
  });

  describe("getAuditLog", () => {
    it("should successfully retrieve audit log for authorized user", async () => {
      const mockIdentity = {
        id: "user-123",
        store_id: "store-456",
        role: "owner",
        organization_id: "org-789",
      };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mockLogs = [{ id: "log-1", action: "update" }];
      supabaseMock.from().select.mockReturnValue(supabaseMock.from());
      supabaseMock.from().eq.mockReturnValue(supabaseMock.from());
      supabaseMock.from().order.mockReturnValue(supabaseMock.from());
      supabaseMock.from().limit.mockResolvedValue({ data: mockLogs, error: null });

      const result = await getAuditLogHandler();

      expect(supabaseMock.from).toHaveBeenCalledWith("audit_log");
      expect(supabaseMock.from().eq).toHaveBeenCalledWith("store_id", "store-456");
      expect(result).toEqual(mockLogs);
    });
  });
});
