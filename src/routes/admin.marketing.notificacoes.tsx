import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Bell } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listAbandonedCarts,
  updateAbandonedCartStatus,
} from "@/services/marketing-engagement.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/marketing/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Hr Shoes" }] }),
  loader: async () => {
    const res = await listAbandonedCarts();
    if (res.status === "error") throw new Error(res.message);
    if (res.status === "unconfigured") return [];
    return res.data || [];
  },
  component: NotificacoesPage,
});

function NotificacoesPage() {
  const carts = Route.useLoaderData() as any[];
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleMark = async (id: string, status: "contacted" | "recovered" | "lost") => {
    setProcessingId(id);
    try {
      const res = await updateAbandonedCartStatus({ data: { id, status } });
      if (res.status === "error") throw new Error("Erro ao atualizar");
      toast.success("Status atualizado!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setProcessingId(null);
    }
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente",
    contacted: "Contatado",
    recovered: "Recuperado",
    lost: "Perdido",
  };

  const statusVariant: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
    pending: "secondary",
    contacted: "outline",
    recovered: "default",
    lost: "destructive",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carrinhos Abandonados e Notificações"
        description="Gerencie carrinhos abandonados e acompanhe as recuperações."
      />

      {carts.length === 0 ? (
        <EmptyState
          title="Nenhum carrinho abandonado"
          description="Quando clientes abandonarem carrinhos, eles aparecerão aqui para acompanhamento."
        />
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-4 text-left font-medium">Cliente</th>
                <th className="p-4 text-left font-medium">E-mail</th>
                <th className="p-4 text-right font-medium">Valor</th>
                <th className="p-4 text-center font-medium">Status</th>
                <th className="p-4 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((cart: any) => (
                <tr key={cart.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{cart.customer_name || "Anônimo"}</td>
                  <td className="p-4 text-muted-foreground">{cart.customer_email || "—"}</td>
                  <td className="p-4 text-right">{formatMoney(cart.total_cents || 0)}</td>
                  <td className="p-4 text-center">
                    <Badge variant={statusVariant[cart.status] || "secondary"}>
                      {statusLabel[cart.status] || cart.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {cart.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMark(cart.id, "contacted")}
                            disabled={processingId === cart.id}
                          >
                            Marcar Contatado
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMark(cart.id, "lost")}
                            disabled={processingId === cart.id}
                          >
                            Perda
                          </Button>
                        </>
                      )}
                      {cart.status === "contacted" && (
                        <Button
                          size="sm"
                          onClick={() => handleMark(cart.id, "recovered")}
                          disabled={processingId === cart.id}
                        >
                          Recuperado!
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
