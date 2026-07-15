import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { getCustomerChatThread, sendCustomerChatMessage } from "@/services/chat.functions";
import { getBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/state/states";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/conta/conversas/$id")({
  head: () => ({ meta: [{ title: "Suporte — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const res = await getCustomerChatThread({ data: { threadId: params.id } });
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: Page,
});

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  pending: "Aguardando resposta",
  resolved: "Resolvida",
  closed: "Encerrada",
};

function Page() {
  const { thread, messages: initialMessages } = Route.useLoaderData();
  const { id } = Route.useParams();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!id) return;

    const supabase = getBrowserClient();
    const channel = supabase
      .channel("customer-chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${id}`,
        },
        (payload) => {
          // Map to local structure and add if not present
          const newMsg = {
            id: payload.new.id,
            message: payload.new.message,
            isStaffReply: payload.new.is_staff_reply,
            createdAt: payload.new.created_at,
          };
          setMessages((prev: any[]) => {
            if (prev.find((m: any) => m.id === newMsg.id || m.message === newMsg.message && m.createdAt === newMsg.createdAt)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    const optimistic = {
      id: crypto.randomUUID(),
      message: text,
      isStaffReply: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev: any[]) => [...prev, optimistic]);
    const sent = text;
    setText("");

    try {
      const res = await sendCustomerChatMessage({ data: { threadId: id, message: sent } });
      if (res.status === "error") {
        toast.error(res.message);
        // Rollback optimistic update
        setMessages((prev: any[]) => prev.filter((m: any) => m.id !== optimistic.id));
        setText(sent);
      }
    } catch {
      toast.error("Erro ao enviar mensagem.");
      setMessages((prev: any[]) => prev.filter((m: any) => m.id !== optimistic.id));
      setText(sent);
    } finally {
      setIsSending(false);
    }
  };

  const isClosed = thread.status === "closed" || thread.status === "resolved";

  return (
    <section className="flex flex-col h-full min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/conta/pedidos" aria-label="Voltar">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-editorial text-foreground truncate">
            {thread.subject || "Suporte"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Aberta em{" "}
            {new Date(thread.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge variant={isClosed ? "secondary" : "default"}>
          {STATUS_LABELS[thread.status] ?? thread.status}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 mb-4 max-h-[50vh]">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma mensagem ainda. Envie uma mensagem para a equipe.
          </p>
        )}
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={`flex ${msg.isStaffReply ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.isStaffReply
                  ? "bg-muted text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}
            >
              <p>{msg.message}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.isStaffReply ? "text-muted-foreground" : "text-primary-foreground/70"
                }`}
              >
                {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="rounded-xl border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
          Esta conversa está encerrada. Abra um novo chamado de suporte se precisar de ajuda.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua mensagem..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!text.trim() || isSending}
            size="icon"
            aria-label="Enviar"
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </form>
      )}
    </section>
  );
}
