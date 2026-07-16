import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfileHandler } from "./auth.functions";

const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

const mockQueryBuilder = {
  update: mockUpdate,
  eq: mockEq,
};

// Set up default chaining behavior
mockUpdate.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnThis();

vi.mock("@/lib/supabase-ssr.server", () => {
  return {
    getSSRClient: () => ({
      auth: {
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
      },
      from: mockFrom,
    }),
  };
});

describe("Auth Profile Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnThis();
  });

  describe("updateProfileHandler", () => {
    it("should throw error if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(updateProfileHandler({ fullName: "Test User" })).rejects.toThrow("Não autorizado");
    });

    it("should throw error if auth update fails", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });
      mockUpdateUser.mockResolvedValueOnce({ error: { message: "Auth service error" } });

      await expect(updateProfileHandler({ fullName: "Test User" })).rejects.toThrow(
        "Auth service error",
      );
    });

    it("should throw error if profiles database update fails", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });
      mockUpdateUser.mockResolvedValueOnce({ error: null });
      mockEq.mockResolvedValueOnce({ error: { message: "Database update error" } });

      await expect(updateProfileHandler({ fullName: "Test User" })).rejects.toThrow(
        "Database update error",
      );
    });

    it("should update auth user and database profile and return success", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });
      mockUpdateUser.mockResolvedValueOnce({ error: null });
      mockEq.mockResolvedValueOnce({ error: null });

      const res = await updateProfileHandler({ fullName: "Test User", phone: "123456" });
      expect(res).toEqual({ status: "success" });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: {
          full_name: "Test User",
          phone: "123456",
        },
      });
      expect(mockFrom).toHaveBeenCalledWith("profiles");
    });
  });
});
