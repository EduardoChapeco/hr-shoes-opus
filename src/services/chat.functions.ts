import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

async function getCurrentIdentity() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) return { id: null, role: "customer", store_id: null };

  const serverClient = getServerClient();
  const { data: profile } = await serverClient
    .from("profiles")
    .select("role, store_id, full_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: profile?.role || "customer",
    store_id: profile?.store_id || null,
    name: profile?.full_name || null,
  };
}

export const listChatThreads = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.store_id || identity.role === "customer") {
      throw new Error("Não autorizado");
    }

    const { data, error } = await db
      .from("chat_threads")
      .select(
        `
        id, status, subject, updated_at, guest_name, guest_email,
        users:customer_id (id),
        chat_messages (id, message, created_at, is_staff_reply)
      `,
      )
      .eq("store_id", identity.store_id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Transform for UI (get last message)
    const formattedData = data.map((thread: any) => {
      const messages = thread.chat_messages || [];
      messages.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const lastMessage = messages[0];

      return {
        id: thread.id,
        status: thread.status,
        subject: thread.subject,
        updated_at: thread.updated_at,
        customer_name: thread.guest_name || "Cliente Registrado",
        last_message: lastMessage ? lastMessage.message : "",
        is_last_reply_staff: lastMessage ? lastMessage.is_staff_reply : false,
      };
    });

    return { status: "ok" as const, data: formattedData };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[chat] listChatThreads error:", e);
    return { status: "error" as const, message: "Erro ao listar chats." };
  }
});

export const getChatMessages = createServerFn({ method: "GET" })
  .validator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ data: { threadId } }) => {
    try {
      const db = getServerClient();
      const identity = await getCurrentIdentity();

      if (!identity.store_id || identity.role === "customer") {
        throw new Error("Não autorizado");
      }

      const { data, error } = await db
        .from("chat_messages")
        .select("id, message, is_staff_reply, created_at, sender_id")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { status: "ok" as const, data };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[chat] getChatMessages error:", e);
      return { status: "error" as const, message: "Erro ao carregar mensagens." };
    }
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      threadId: z.string().uuid(),
      message: z.string().min(1),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();
      const identity = await getCurrentIdentity();

      if (!identity.store_id || identity.role === "customer") {
        throw new Error("Não autorizado");
      }

      const { data, error } = await db
        .from("chat_messages")
        .insert({
          thread_id: input.threadId,
          message: input.message,
          is_staff_reply: true,
          sender_id: identity.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread updated_at
      await db
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", input.threadId);

      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[chat] sendChatMessage error:", e);
      return { status: "error" as const, message: "Erro ao enviar mensagem." };
    }
  });
