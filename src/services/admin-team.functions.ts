import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

// ---------------------------------------------------------------------------
// Team Management (Equipe)
// ---------------------------------------------------------------------------

export const listTeamMembers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = await getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager"]);

    const { data, error } = await db
      .from("profiles")
      .select("id, full_name, avatar_url, role, created_at")
      .eq("store_id", identity.store_id)
      .in("role", ["owner", "admin", "manager", "seller", "finance", "content"])
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-team] listTeamMembers error:", e);
    return { status: "error" as const, message: "Erro ao listar equipe." };
  }
});

export const updateTeamMemberRole = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      role: z.enum(["owner", "admin", "manager", "seller", "finance", "content", "customer"]),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = await getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin"]);

      // Prevent owner from demoting themselves
      if (input.id === identity.id && input.role !== "owner" && identity.role === "owner") {
        throw new Error("O dono da loja não pode rebaixar a si mesmo.");
      }

      const { data, error } = await db
        .from("profiles")
        .update({ role: input.role })
        .eq("id", input.id)
        .eq("store_id", identity.store_id)
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-team] updateTeamMemberRole error:", e);
      return { status: "error" as const, message: e instanceof Error ? e.message : "Erro." };
    }
  });

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
      const db = await getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager"]);

      // 1. Create Auth User (using admin api)
      const { data: authData, error: authError } = await db.auth.admin.createUser({
        email: input.email,
        password: "HrShoes123!", // Temp password
        email_confirm: true,
        user_metadata: {
           full_name: input.fullName
        }
      });

      if (authError) throw new Error(`Erro ao criar conta Auth: ${authError.message}`);

      // 2. The trigger `on_auth_user_created` in Postgres automatically creates a `profiles` row 
      // with role 'customer'. We need to update it to the desired team role and link to store.
      const { error: profileError } = await db
        .from("profiles")
        .update({ 
           role: input.role,
           store_id: identity.store_id,
           full_name: input.fullName
        })
        .eq("id", authData.user.id);

      if (profileError) throw new Error("Erro ao promover usuário a membro da equipe.");

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[admin-team] inviteTeamMember error:", e);
      return { status: "error" as const, message: e instanceof Error ? e.message : "Erro." };
    }
  });
