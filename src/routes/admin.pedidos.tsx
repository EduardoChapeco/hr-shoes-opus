import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
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
import { EmptyState } from "@/components/state/states";
import { listOrders, updateOrderStatus } from "@/services/order.functions";
import { useState } from "react";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Hr Shoes" }] }),
  loader: async () => {
    const res = await listOrders();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminOrdersPage,
});

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; variant: any }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    awaiting_payment: { label: "Aguardando Pagto", variant: "outline" },
    paid: { label: "Pago", variant: "default" },
    processing: { label: "Processando", variant: "secondary" },
    shipped: { label: "Enviado", variant: "default" },
    delivered: { label: "Entregue", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };
  return map[status] || { label: status, variant: "outline" };
}

function AdminOrdersPage() {
  const initialOrders = Route.useLoaderData();
  const [orders, setOrders] = useState(initialOrders);

  const handleStatusChange = async (id: string, newStatus: any) => {
    const res = await updateOrderStatus({ data: { orderId: id, status: newStatus } });
    if (res.status === "ok") {
      setOrders(orders.map((o: any) => (o.id === id ? { ...o, status: newStatus } : o)));
    } else {
      alert("Erro ao atualizar status");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendas"
        title="Pedidos"
        description="Acompanhe e gerencie todos os pedidos da loja."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado"
          description="Quando seus clientes começarem a comprar, os pedidos aparecerão aqui."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: any) => {
                const badgeInfo = getStatusLabel(order.status);
                const date = new Date(order.created_at).toLocaleDateString("pt-BR");
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      #{order.public_token}
                    </TableCell>
                    <TableCell>{date}</TableCell>
                    <TableCell>{order.customer_name || "Desconhecido"}</TableCell>
                    <TableCell>{formatMoney(order.total_cents)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {order.status === "awaiting_payment" && (
                        <Button size="sm" onClick={() => handleStatusChange(order.id, "paid")}>
                          Aprovar Pagto
                        </Button>
                      )}
                      {order.status === "paid" && (
                        <Button size="sm" onClick={() => handleStatusChange(order.id, "shipped")}>
                          Marcar Enviado
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
