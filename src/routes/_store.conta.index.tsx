import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Package, MapPin, CreditCard, Heart, RefreshCw } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCustomerOrders } from "@/services/order.functions";
import { getProfile } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/conta/")({
  head: () => ({ meta: [{ title: "Minha Conta — Hr Shoes" }] }),
  loader: async () => {
    const [ordersRes, profile] = await Promise.all([listCustomerOrders(), getProfile()]);
    const orders = ordersRes || [];
    return { orders, profile };
  },
  component: Page,
});

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  awaiting_payment: "Aguardando Pagamento",
  paid: "Pago",
  processing: "Em Separação",
  ready_for_pickup: "Pronto para Retirada",
  shipped: "Enviado",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  return_requested: "Devolução Solicitada",
  returned: "Devolvido",
};

const QUICK_ACCESS = [
  { to: "/conta/pedidos", label: "Pedidos", icon: Package, description: "Acompanhe seus pedidos" },
  {
    to: "/conta/enderecos",
    label: "Endereços",
    icon: MapPin,
    description: "Gerencie seus endereços",
  },
  {
    to: "/conta/pagamentos",
    label: "Pagamentos",
    icon: CreditCard,
    description: "Formas de pagamento",
  },
  {
    to: "/conta/avaliacoes",
    label: "Avaliações",
    icon: Heart,
    description: "Seus produtos avaliados",
  },
  { to: "/conta/trocas", label: "Trocas", icon: RefreshCw, description: "Solicitações de troca" },
  {
    to: "/conta/gift-cards",
    label: "Gift Cards",
    icon: ShoppingBag,
    description: "Saldo de cartões",
  },
] as const;

function Page() {
  const { orders, profile } = Route.useLoaderData();
  const recentOrders = orders.slice(0, 3);

  return (
    <section className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Bem-vinda de volta
        </p>
        <h2 className="text-editorial text-2xl text-foreground">
          {profile.fullName || profile.email}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
      </div>

      {/* Quick access grid */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_ACCESS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors"
            >
              <item.icon className="size-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Pedidos Recentes</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/conta/pedidos">Ver todos</Link>
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não realizou nenhum pedido.</p>
            <Button size="sm" className="mt-4" asChild>
              <Link to="/catalogo">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">#{order.public_token}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {formatMoney(order.total_cents)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
