import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShoppingCart, Send, UserX } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  listAbandonedCarts,
  updateAbandonedCartStatus,
} from "@/services/marketing-engagement.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/marketing/carrinhos")({
  head: () => ({ meta: [{ title: "Carrinhos Abandonados — Hr Shoes" }] }),
  loader: async () => {
    const res = await listAbandonedCarts();
    return res;
  },
  component: AbandonedCartsPage,
});

function AbandonedCartsPage() {
  const carts = Route.useLoaderData() || [];
  const router = useRouter();

  const handleUpdateStatus = async (id: string, newStatus: "recovered" | "lost" | "contacted") => {
    try {
      const res = await updateAbandonedCartStatus({
        data: { id, status: newStatus },
      });
      if (res) {
        toast.success("Status atualizado!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar");
      }
    } catch {
      toast.error("Erro inesperado");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "contacted":
        return (
          <Badge variant="default" className="bg-blue-600">
            Contatado
          </Badge>
        );
      case "recovered":
        return (
          <Badge variant="default" className="bg-green-600">
            Recuperado
          </Badge>
        );
      case "lost":
        return <Badge variant="destructive">Perdido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carrinhos Abandonados"
        description="Recupere vendas de clientes que não finalizaram a compra no checkout."
      />

      {carts.length === 0 ? (
        <EmptyState
          title="Nenhum carrinho abandonado"
          description="Ainda não existem registros de desistência no checkout."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente / Contato</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carts.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{c.guest_email || "Cliente anônimo"}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.guest_phone || "Sem telefone"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatMoney(c.total_cents)}</TableCell>
                  <TableCell>{new Date(c.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(c.id, "contacted");
                        if (c.guest_phone) {
                          const phone = c.guest_phone.replace(/\D/g, "");
                          const msg = `Olá${c.guest_name ? ` ${c.guest_name}` : ""}! Sou da equipe da Hr Shoes. Vi que você deixou alguns itens no carrinho, no valor de ${formatMoney(c.total_cents)}. Conseguiu finalizar a compra ou precisa de alguma ajuda?`;
                          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
                        } else if (c.guest_email) {
                          const msg = `Olá${c.guest_name ? ` ${c.guest_name}` : ""}! Sou da equipe da Hr Shoes. Vi que você deixou itens no valor de ${formatMoney(c.total_cents)} no seu carrinho. Posso ajudar em algo?`;
                          window.open(`mailto:${c.guest_email}?subject=Seu carrinho na Hr Shoes&body=${encodeURIComponent(msg)}`, "_blank");
                        }
                      }}
                      disabled={c.status === "recovered" || c.status === "lost" || (!c.guest_phone && !c.guest_email)}
                      title={c.guest_phone ? "Contatar via WhatsApp" : c.guest_email ? "Contatar via Email" : "Sem contato"}
                    >
                      <Send className="mr-2 h-3 w-3" /> Contatar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleUpdateStatus(c.id, "lost")}
                      disabled={c.status === "recovered" || c.status === "lost"}
                      title="Marcar como Perdido"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
