import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

export const getStoreTickets = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "support"]);

  const db = getServerClient();
  const { data, error } = await db
    .from("tickets")
    .select(`*`)
    .eq("store_id", identity.store_id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar Tickets: " + error.message);
  return data;
});

export const getTicketMessages = createServerFn({ method: "GET" })
  .validator((d: { ticketId: string }) => d)
  .handler(async ({ data: { ticketId } }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "support"]);

    const db = getServerClient();
    const { data, error } = await db
      .from("ticket_messages")
      .select(`*`)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw new Error("Erro ao buscar mensagens do ticket: " + error.message);
    return data;
  });
