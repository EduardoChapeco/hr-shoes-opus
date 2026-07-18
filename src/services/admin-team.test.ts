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
const mockUpsert = vi.fn();
const mockSingle = vi.fn();
const mockCreateUser = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  order: mockOrder,
  update: mockUpdate,
  upsert: mockUpsert,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);
mockUpsert.mockReturnValue(mockQueryBuilder);
mockSingle.mockReturnValue(mockQueryBuilder);

const mockSchema = vi.fn().mockImplementation(() => ({
  from: mockFrom,
}));

const mockSupabase = {
  from: mockFrom,
  schema: mockSchema,
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
    mockUpsert.mockReturnValue(mockQueryBuilder);
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
      const expectedData = [{ id: "user-123", full_name: "Owner", role: "owner", email: null }];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const res = await listTeamMembersHandler();
      expect(res).toEqual(expectedData);
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

    it("should throw if target user profile is not found", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "owner",
        store_id: "store-456",
        organization_id: "org-789",
      });

      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

      await expect(
        updateTeamMemberRoleHandler({ id: "user-456", role: "manager" })
      ).rejects.toThrow("Membro da equipe não encontrado ou pertence a outra loja.");
    });

    it("should prevent admin from modifying owner role", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        organization_id: "org-789",
      });

      // Target user is owner
      mockSingle.mockResolvedValueOnce({ data: { role: "owner" }, error: null });

      await expect(
        updateTeamMemberRoleHandler({ id: "user-owner-id", role: "seller" })
      ).rejects.toThrow("Apenas o proprietário pode alterar suas próprias permissões.");
    });

    it("should prevent admin from promoting someone to owner", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        organization_id: "org-789",
      });

      // Target user is seller
      mockSingle.mockResolvedValueOnce({ data: { role: "seller" }, error: null });

      await expect(
        updateTeamMemberRoleHandler({ id: "user-seller-id", role: "owner" })
      ).rejects.toThrow("Apenas o proprietário pode transferir a propriedade da loja.");
    });

    it("should successfully update team member role", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "owner",
        store_id: "store-456",
        organization_id: "org-789",
      });

      const mockUpdated = { id: "user-456", role: "manager" };
      // 1. target lookup
      mockSingle.mockResolvedValueOnce({ data: { role: "seller" }, error: null });
      // 2. update query
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

    it("should prevent manager from inviting admins", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "manager",
        store_id: "store-456",
        organization_id: "org-789",
      });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Admin",
          role: "admin",
        })
      ).rejects.toThrow("Gerentes não podem convidar membros com cargo de Administrador.");
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
      mockUpsert.mockResolvedValueOnce({ error: { message: "Profile upsert failed" } });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Seller",
          role: "seller",
        }),
      ).rejects.toThrow("Erro ao promover usuário a membro da equipe.");
    });

    it("should successfully invite team member and promote profile via upsert", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        organization_id: "org-789",
      });

      mockCreateUser.mockResolvedValueOnce({ data: { user: { id: "new-user-123" } }, error: null });
      mockUpsert.mockResolvedValueOnce({ error: null });

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
      expect(mockUpsert).toHaveBeenCalledWith({
        id: "new-user-123",
        role: "seller",
        store_id: "store-456",
        full_name: "Test Seller",
      });
    });
  });
});
