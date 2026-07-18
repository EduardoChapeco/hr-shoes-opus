import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

// ---------------------------------------------------------------------------
// Team Management (Equipe)
// ---------------------------------------------------------------------------

export async function listTeamMembersHandler() {
  const db = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .eq("store_id", identity.store_id)
    .in("role", ["owner", "admin", "manager", "seller", "finance", "content"])
    .order("created_at", { ascending: true });

  if (error) throw error;

  if (!profiles || profiles.length === 0) return [];

  try {
    const userIds = profiles.map((p) => p.id);
    const { data: authUsers, error: authError } = await db
      .schema("auth")
      .from("users")
      .select("id, email")
      .in("id", userIds);

    if (!authError && authUsers) {
      const emailMap = new Map<string, string>(authUsers.map((u: any) => [u.id, u.email]));
      return profiles.map((p) => ({
        ...p,
        email: emailMap.get(p.id) || null,
      }));
    }
  } catch (e) {
    console.error("[admin-team] Error fetching auth emails:", e);
  }

  return profiles.map((p) => ({ ...p, email: null }));
}

export const listTeamMembers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await listTeamMembersHandler();
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-team] listTeamMembers error:", e);
    return { status: "error" as const, message: "Erro ao listar equipe." };
  }
});

export async function updateTeamMemberRoleHandler(input: {
  id: string;
  role: "owner" | "admin" | "manager" | "seller" | "finance" | "content" | "customer";
}) {
  const db = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  // Prevent owner from demoting themselves
  if (input.id === identity.id && input.role !== "owner" && identity.role === "owner") {
    throw new Error("O dono da loja não pode rebaixar a si mesmo.");
  }

  // Fetch target user's current profile first to apply business rules
  const { data: targetProfile, error: fetchError } = await db
    .from("profiles")
    .select("role")
    .eq("id", input.id)
    .eq("store_id", identity.store_id)
    .single();

  if (fetchError || !targetProfile) {
    throw new Error("Membro da equipe não encontrado ou pertence a outra loja.");
  }

  // 1. Only owner can edit owner
  if (targetProfile.role === "owner" && identity.role !== "owner") {
    throw new Error("Apenas o proprietário pode alterar suas próprias permissões.");
  }

  // 2. Only owner can promote someone to owner
  if (input.role === "owner" && identity.role !== "owner") {
    throw new Error("Apenas o proprietário pode transferir a propriedade da loja.");
  }

  const { data, error } = await db
    .from("profiles")
    .update({ role: input.role })
    .eq("id", input.id)
    .eq("store_id", identity.store_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const updateTeamMemberRole = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      role: z.enum(["owner", "admin", "manager", "seller", "finance", "content", "customer"]),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const data = await updateTeamMemberRoleHandler(input);
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-team] updateTeamMemberRole error:", e);
      return { status: "error" as const, message: e instanceof Error ? e.message : "Erro." };
    }
  });

export async function inviteTeamMemberHandler(input: {
  email: string;
  fullName: string;
  role: "admin" | "manager" | "seller" | "finance" | "content";
}) {
  const db = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  // Prevent lower roles from creating higher privileged roles
  if (identity.role === "manager" && input.role === "admin") {
    throw new Error("Gerentes não podem convidar membros com cargo de Administrador.");
  }

  // 1. Create Auth User (using admin api)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: input.email,
    password: "HrShoes123!", // Temp password
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
    },
  });

  if (authError) throw new Error(`Erro ao criar conta Auth: ${authError.message}`);

  // 2. Upsert the profile to mitigate latency and ensure store mapping is linked correctly
  const { error: profileError } = await db
    .from("profiles")
    .upsert({
      id: authData.user.id,
      role: input.role,
      store_id: identity.store_id,
      full_name: input.fullName,
    });

  if (profileError) throw new Error("Erro ao promover usuário a membro da equipe.");

  return { status: "success" as const };
}

export const inviteTeamMember = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      fullName: z.string().min(1),
      role: z.enum(["admin", "manager", "seller", "finance", "content"]),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      return await inviteTeamMemberHandler(input);
    } catch (e: unknown) {
      console.error("[admin-team] inviteTeamMember error:", e);
      return { status: "error" as const, message: e instanceof Error ? e.message : "Erro." };
    }
  });
