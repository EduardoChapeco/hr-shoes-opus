import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listTeamMembersHandler,
  updateTeamMemberRoleHandler,
  inviteTeamMemberHandler,
} from "./admin-team.functions";
import { getServerIdentity } from "@/lib/identity";
import { getServerClient } from "@/lib/supabase";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();
const mockCreateUser = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  order: mockOrder,
  update: mockUpdate,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);
mockSingle.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: mockFrom,
  auth: {
    admin: {
      createUser: mockCreateUser,
    },
  },
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

describe("Admin Team Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockIn.mockReturnValue(mockQueryBuilder);
    mockOrder.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockSingle.mockReturnValue(mockQueryBuilder);
  });

  describe("listTeamMembersHandler", () => {
    it("should throw if user is not authorized", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "seller",
        store_id: "store-456",
        organization_id: "org-789",
      });

      await expect(listTeamMembersHandler()).rejects.toThrow("Não autorizado");
    });

    it("should return team members when authorized", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "owner",
        store_id: "store-456",
        organization_id: "org-789",
      });

      const mockData = [{ id: "user-123", full_name: "Owner", role: "owner" }];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const res = await listTeamMembersHandler();
      expect(res).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockEq).toHaveBeenCalledWith("store_id", "store-456");
    });

    it("should throw database error if retrieval fails", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        organization_id: "org-789",
      });

      mockOrder.mockResolvedValueOnce({ data: null, error: { message: "Database select error" } });

      await expect(listTeamMembersHandler()).rejects.toThrow("Database select error");
    });
  });

  describe("updateTeamMemberRoleHandler", () => {
    it("should throw if operator is not admin or owner", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "manager",
        store_id: "store-456",
        organization_id: "org-789",
      });

      await expect(
        updateTeamMemberRoleHandler({ id: "other-user", role: "seller" }),
      ).rejects.toThrow("Não autorizado");
    });

    it("should prevent owner from demoting themselves", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "owner",
        store_id: "store-456",
        organization_id: "org-789",
      });

      await expect(updateTeamMemberRoleHandler({ id: "user-123", role: "seller" })).rejects.toThrow(
        "O dono da loja não pode rebaixar a si mesmo.",
      );
    });

    it("should successfully update team member role", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "owner",
        store_id: "store-456",
        organization_id: "org-789",
      });

      const mockUpdated = { id: "user-456", role: "manager" };
      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const res = await updateTeamMemberRoleHandler({ id: "user-456", role: "manager" });
      expect(res).toEqual(mockUpdated);
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockUpdate).toHaveBeenCalledWith({ role: "manager" });
    });
  });

  describe("inviteTeamMemberHandler", () => {
    it("should throw if user is not admin, manager, or owner", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "seller",
        store_id: "store-456",
        organization_id: "org-789",
      });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Seller",
          role: "seller",
        }),
      ).rejects.toThrow("Não autorizado");
    });

    it("should throw if auth creation fails", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        organization_id: "org-789",
      });

      mockCreateUser.mockResolvedValueOnce({ data: null, error: { message: "Auth failed" } });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Seller",
          role: "seller",
        }),
      ).rejects.toThrow("Erro ao criar conta Auth: Auth failed");
    });

    it("should throw if profile promotion fails", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        organization_id: "org-789",
      });

      mockCreateUser.mockResolvedValueOnce({ data: { user: { id: "new-user-123" } }, error: null });
      mockEq.mockResolvedValueOnce({ error: { message: "Profile update failed" } });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Seller",
          role: "seller",
        }),
      ).rejects.toThrow("Erro ao promover usuário a membro da equipe.");
    });

    it("should successfully invite team member and promote profile", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        organization_id: "org-789",
      });

      mockCreateUser.mockResolvedValueOnce({ data: { user: { id: "new-user-123" } }, error: null });
      mockEq.mockResolvedValueOnce({ error: null });

      const res = await inviteTeamMemberHandler({
        email: "test@loja.com",
        fullName: "Test Seller",
        role: "seller",
      });
      expect(res).toEqual({ status: "success" });
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "test@loja.com",
        password: "HrShoes123!",
        email_confirm: true,
        user_metadata: {
          full_name: "Test Seller",
        },
      });
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockUpdate).toHaveBeenCalledWith({
        role: "seller",
        store_id: "store-456",
        full_name: "Test Seller",
      });
    });
  });
});
