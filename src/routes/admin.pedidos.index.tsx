import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ShoppingBag,
  Search,
  MoreVertical,
  Eye,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  ReceiptText,
  Clock,
  Filter,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/state/states";
import { listOrders, updateOrderStatus } from "@/services/order.functions";
import { approvePayment } from "@/services/payment.functions";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/admin/pedidos/")({
  head: () => ({ meta: [{ title: "Gestão de Pedidos — Hr Shoes" }] }),
  loader: async () => {
    const res = await listOrders();
    return res || [];
  },
  component: AdminOrdersPage,
});

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning" }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    awaiting_payment: { label: "Aguardando Pagto", variant: "warning" },
    payment_processing: { label: "Processando Pagto", variant: "info" },
    paid: { label: "Pago", variant: "success" },
    processing: { label: "Em Separação", variant: "secondary" },
    ready_for_pickup: { label: "Pronto p/ Retirada", variant: "success" },
    shipped: { label: "Enviado", variant: "info" },
    delivered: { label: "Entregue", variant: "success" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };
  return map[status] || { label: status, variant: "outline" };
}

function AdminOrdersPage() {
  const initialOrders = Route.useLoaderData();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter orders by search & tab
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const tokenStr = `#${order.public_token || ""}`.toLowerCase();
      const customerName = (order.customer_snapshot?.name || "").toLowerCase();
      const customerEmail = (order.customer_snapshot?.email || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        tokenStr.includes(query) || customerName.includes(query) || customerEmail.includes(query);

      let matchesTab = true;
      if (statusTab === "awaiting") matchesTab = order.status === "awaiting_payment" || order.status === "payment_processing";
      else if (statusTab === "processing") matchesTab = order.status === "processing" || order.status === "paid";
      else if (statusTab === "shipped") matchesTab = order.status === "shipped" || order.status === "ready_for_pickup";
      else if (statusTab === "delivered") matchesTab = order.status === "delivered";
      else if (statusTab === "cancelled") matchesTab = order.status === "cancelled";

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, statusTab]);

  // Update status action
  const handleStatusChange = async (orderId: string, newStatus: any) => {
    setIsProcessing(true);
    try {
      const res = await updateOrderStatus({ data: { orderId, status: newStatus } });
      if (res) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        toast.success(`Status do pedido alterado com sucesso!`);
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao atualizar status.");
      }
    } catch (e: any) {
      toast.error("Erro ao atualizar o pedido.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Approve Payment
  const handleQuickApprove = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res = await approvePayment({ data: { orderId, receivedMethod: "cash" } });
      if (res) {
        toast.success("Pagamento aprovado! Pedido avançou para separação.");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "processing" } : o)),
        );
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao aprovar pagamento.");
      }
    } catch (e: any) {
      toast.error("Erro ao aprovar pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestão Comercial de Vendas"
        title="Painel de Pedidos"
        description="Acompanhe o ciclo de vida completo de cada pedido, da aprovação do pagamento até a entrega final ao cliente."
      />

      {/* Toolbar & Filtros de Status */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <Tabs defaultValue="all" value={statusTab} onValueChange={setStatusTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-6 w-full sm:w-auto h-9">
            <TabsTrigger value="all" className="text-xs">
              Todos ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="awaiting" className="text-xs">
              Aguardando ({orders.filter((o) => o.status === "awaiting_payment").length})
            </TabsTrigger>
            <TabsTrigger value="processing" className="text-xs">
              Separação ({orders.filter((o) => o.status === "processing" || o.status === "paid").length})
            </TabsTrigger>
            <TabsTrigger value="shipped" className="text-xs">
              Enviados ({orders.filter((o) => o.status === "shipped").length})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs">
              Entregues ({orders.filter((o) => o.status === "delivered").length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">
              Cancelados ({orders.filter((o) => o.status === "cancelled").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar por #pedido ou nome da cliente..."
            className="pl-9 text-xs bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Pedidos */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado"
          description={
            searchQuery || statusTab !== "all"
              ? "Tente alterar os termos de busca ou filtros de status aplicados."
              : "Quando suas clientes realizarem compras no e-commerce ou balcão, os pedidos aparecerão aqui."
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Pedido</TableHead>
                <TableHead>Data & Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Meio / Frete</TableHead>
                <TableHead className="text-right">Total Final</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const badgeInfo = getStatusLabel(order.status);

                return (
                  <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      #{order.public_token || order.id.slice(0, 6)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(order.created_at)}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                          {order.customer_snapshot?.name || "Cliente Avulso"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.customer_snapshot?.email || order.customer_snapshot?.phone || "Sem contato"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground uppercase">
                          {order.payment_method || "Pix / Balcão"}
                        </span>
                        <span>{order.shipping_method || "Entrega Padrão"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-extrabold text-sm text-foreground">
                      {formatMoney(order.total_cents)}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={badgeInfo.variant} className="text-[10px] uppercase tracking-wider">
                        {badgeInfo.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações do pedido">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-xs">Ações Operacionais</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/pedidos/${order.id}` as never}>
                              <Eye className="size-3.5 mr-2" />
                              Ver Ficha 360 do Pedido
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/pedidos/${order.id}/recibo` as never} target="_blank">
                              <ReceiptText className="size-3.5 mr-2" />
                              Imprimir Recibo / Comprovante
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {order.status === "awaiting_payment" && (
                            <DropdownMenuItem onClick={() => handleQuickApprove(order.id)}>
                              <CheckCircle2 className="size-3.5 mr-2 text-emerald-600" />
                              Aprovar Pagamento
                            </DropdownMenuItem>
                          )}

                          {(order.status === "paid" || order.status === "processing") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  order.id,
                                  order.shipping_method === "pickup" ? "ready_for_pickup" : "shipped",
                                )
                              }
                            >
                              <Truck className="size-3.5 mr-2 text-blue-600" />
                              {order.shipping_method === "pickup" ? "Pronto p/ Retirada" : "Marcar como Enviado"}
                            </DropdownMenuItem>
                          )}

                          {(order.status === "shipped" || order.status === "ready_for_pickup") && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "delivered")}>
                              <PackageCheck className="size-3.5 mr-2 text-emerald-600" />
                              Confirmar Entrega ao Cliente
                            </DropdownMenuItem>
                          )}

                          {order.status !== "cancelled" && order.status !== "delivered" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, "cancelled")}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="size-3.5 mr-2" />
                              Cancelar Pedido
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
