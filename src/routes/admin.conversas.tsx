import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listChatThreads, getChatMessages, sendChatMessage } from "@/services/chat.functions";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/conversas")({
  head: () => ({ meta: [{ title: "Conversas — Hr Shoes" }] }),
  loader: async () => {
    const res = await listChatThreads();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: ChatInboxPage,
});

function ChatInboxPage() {
  const threads = Route.useLoaderData() || [];
  const router = useRouter();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSelectThread = async (id: string) => {
    setSelectedThread(id);
    try {
      const res = await getChatMessages({ data: { threadId: id } });
      if (res.status === "ok") {
        setMessages(res.data);
      }
    } catch (e) {
      toast.error("Erro ao carregar mensagens");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;

    setIsSending(true);
    try {
      const res = await sendChatMessage({ data: { threadId: selectedThread, message: replyText } });
      if (res.status === "success") {
        setReplyText("");
        // Reload messages for the active thread
        handleSelectThread(selectedThread);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao enviar.");
      }
    } catch (err) {
      toast.error("Erro inesperado");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <PageHeader
        title="Conversas (Chat)"
        description="Atenda seus clientes em tempo real."
      />

      <div className="flex-1 border rounded-md overflow-hidden flex bg-card">
        {/* Sidebar */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b font-medium flex justify-between items-center bg-muted/20">
            Inbox
            <Badge variant="secondary">{threads.length}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum chat aberto.
              </div>
            ) : (
              threads.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectThread(t.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedThread === t.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm truncate">{t.customer_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate line-clamp-2">
                    {t.is_last_reply_staff ? "Você: " : ""}{t.last_message || t.subject}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
              <MessageSquare className="h-12 w-12 opacity-20" />
              <p>Selecione uma conversa para responder.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                <span className="font-semibold">
                  {threads.find((t: any) => t.id === selectedThread)?.customer_name}
                </span>
                <Badge>{threads.find((t: any) => t.id === selectedThread)?.status}</Badge>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">Nenhuma mensagem.</p>
                ) : (
                  messages.map((m: any) => (
                    <div
                      key={m.id}
                      className={`flex ${m.is_staff_reply ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg text-sm ${
                          m.is_staff_reply
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        }`}
                      >
                        {m.message}
                        <div
                          className={`text-[10px] mt-1 ${
                            m.is_staff_reply ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <Input
                    placeholder="Digite sua resposta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={isSending || !replyText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
