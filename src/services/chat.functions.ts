import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

export const listChatThreads = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const identity = await getServerIdentity();

    assertStoreAccess(identity);

    const { data, error } = await db
      .from("chat_threads")
      .select(
        `
        id, status, subject, updated_at, guest_name, guest_email,
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

    return formattedData;
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[chat] listChatThreads error:", e);
    throw new Error("Erro ao listar chats.");
  }
});

export const getChatMessages = createServerFn({ method: "GET" })
  .validator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ data: { threadId } }) => {
    try {
      const db = getServerClient();
      const identity = await getServerIdentity();

      assertStoreAccess(identity);

      const { data, error } = await db
        .from("chat_messages")
        .select("id, message, is_staff_reply, created_at, sender_id")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[chat] getChatMessages error:", e);
      throw new Error("Erro ao carregar mensagens.");
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
      const identity = await getServerIdentity();

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

      return data;
    } catch (e: unknown) {
      console.error("[chat] sendChatMessage error:", e);
      throw new Error("Erro ao enviar mensagem.");
    }
  });

// ---------------------------------------------------------------------------
// Customer-facing chat functions
// ---------------------------------------------------------------------------

export const getCustomerChatThread = createServerFn({ method: "GET" })
  .validator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ data: { threadId } }) => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autorizado");

      const db = getServerClient();

      // Fetch the thread (only if owned by this customer)
      const { data: thread, error: threadErr } = await db
        .from("chat_threads")
        .select("id, subject, status, created_at")
        .eq("id", threadId)
        .eq("customer_id", user.id)
        .single();

      if (threadErr || !thread) throw new Error("Conversa não encontrada.");

      const { data: messages, error: msgErr } = await db
        .from("chat_messages")
        .select("id, message, is_staff_reply, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (msgErr) throw new Error(msgErr.message);

      return {
        thread: {
          id: thread.id as string,
          subject: thread.subject as string | null,
          status: thread.status as string,
          createdAt: thread.created_at as string,
        },
        messages: (messages || []).map((m: any) => ({
          id: m.id as string,
          message: m.message as string,
          isStaffReply: m.is_staff_reply as boolean,
          createdAt: m.created_at as string,
        })),
      };
    } catch (e: any) {
      throw new Error(e.message || "Erro ao buscar chat.");
    }
  });

export const sendCustomerChatMessage = createServerFn({ method: "POST" })
  .validator(z.object({ threadId: z.string().uuid(), message: z.string().min(1) }))
  .handler(async ({ data: { threadId, message } }) => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autorizado");

      const db = getServerClient();

      // Validate ownership
      const { data: thread } = await db
        .from("chat_threads")
        .select("id")
        .eq("id", threadId)
        .eq("customer_id", user.id)
        .single();

      if (!thread) throw new Error("Conversa não encontrada.");

      const { error } = await db.from("chat_messages").insert({
        thread_id: threadId,
        message,
        is_staff_reply: false,
        sender_id: user.id,
      });

      if (error) throw new Error(error.message);

      await db
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadId);

      return { status: "success" as const };
    } catch (e: any) {
      throw new Error(e.message || "Erro ao enviar mensagem.");
    }
  });

export const listCustomerChatThreads = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const db = getServerClient();
    const { data, error } = await db
      .from("chat_threads")
      .select("id, subject, status, created_at, updated_at")
      .eq("customer_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e: any) {
    console.error("[chat] listCustomerChatThreads error:", e);
    throw new Error(e.message || "Erro ao listar suas conversas.");
  }
});

export const startCustomerChatThread = createServerFn({ method: "POST" })
  .validator(
    z.object({
      subject: z.string().min(3, "Assunto muito curto"),
      message: z.string().min(1, "Mensagem inicial é obrigatória"),
    }),
  )
  .handler(async ({ data: { subject, message } }) => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autorizado. Faça login para iniciar um atendimento.");

      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      if (!storeId) throw new Error("Loja não identificada.");

      const db = getServerClient();

      // Create thread
      const { data: thread, error: threadErr } = await db
        .from("chat_threads")
        .insert({
          store_id: storeId,
          customer_id: user.id,
          subject,
          status: "open",
        })
        .select()
        .single();

      if (threadErr || !thread) throw new Error(threadErr?.message || "Erro ao criar conversa.");

      // Create initial message
      const { error: msgErr } = await db.from("chat_messages").insert({
        thread_id: thread.id,
        message,
        is_staff_reply: false,
        sender_id: user.id,
      });

      if (msgErr) throw msgErr;

      return { status: "success" as const, threadId: thread.id };
    } catch (e: any) {
      console.error("[chat] startCustomerChatThread error:", e);
      throw new Error(e.message || "Erro ao iniciar conversa.");
    }
  });

export const updateChatThreadStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      threadId: z.string().uuid(),
      status: z.enum(["open", "closed", "archived"]),
    }),
  )
  .handler(async ({ data: { threadId, status } }) => {
    try {
      const identity = await getServerIdentity();
      assertStoreAccess(identity);

      const db = getServerClient();
      const { error } = await db
        .from("chat_threads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", threadId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[chat] updateChatThreadStatus error:", e);
      throw new Error(e.message || "Erro ao atualizar status da conversa.");
    }
  });

