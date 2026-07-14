import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/conta")({
  beforeLoad: async () => {
    const session = await getUserSession();
    if (!session) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: "/conta" },
      });
    }
  },
  component: AccountLayout,
});

const ACCOUNT_NAV: { to: string; label: string; exact?: boolean }[] = [
  { to: "/conta", label: "Visão geral", exact: true },
  { to: "/conta/perfil", label: "Perfil" },
  { to: "/conta/enderecos", label: "Endereços" },
  { to: "/conta/pedidos", label: "Pedidos" },
  { to: "/conta/pagamentos", label: "Pagamentos" },
  { to: "/conta/creditos", label: "Créditos" },
  { to: "/conta/gift-cards", label: "Gift cards" },
  { to: "/conta/avaliacoes", label: "Avaliações" },
  { to: "/conta/trocas", label: "Trocas" },
  { to: "/conta/suporte", label: "Suporte" },
  { to: "/conta/privacidade", label: "Privacidade" },
] as const;

function AccountLayout() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <p className="eyebrow text-primary">Minha conta</p>
      <h1 className="text-editorial mt-2 text-3xl text-foreground sm:text-4xl">Olá!</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Desktop sidebar / mobile horizontal scroll */}
        <nav aria-label="Navegação da conta" className="md:pt-1">
          <div className="md:hidden">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {ACCOUNT_NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
                    activeProps={{ className: "border-primary text-primary" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <ul className="hidden space-y-1 md:block">
            {ACCOUNT_NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "bg-accent text-foreground" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
