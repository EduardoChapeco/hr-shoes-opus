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
