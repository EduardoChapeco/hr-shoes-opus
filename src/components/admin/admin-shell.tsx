import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  CreditCard,
  Users,
  MessagesSquare,
  Palette,
  Megaphone,
  Wallet,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/commerce/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  planned?: boolean;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { to: "/admin", label: "Visão geral", icon: LayoutDashboard },
      { to: "/admin/onboarding", label: "Onboarding", icon: Store },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { to: "/admin/catalogo/produtos", label: "Produtos", icon: Package, planned: true },
      { to: "/admin/estoque", label: "Estoque", icon: Boxes, planned: true },
      { to: "/admin/midias", label: "Mídias", icon: Palette, planned: true },
    ],
  },
  {
    title: "Vendas",
    items: [
      { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart, planned: true },
      { to: "/admin/fretes", label: "Fretes", icon: Truck, planned: true },
      { to: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard, planned: true },
    ],
  },
  {
    title: "Relacionamento",
    items: [
      { to: "/admin/clientes", label: "Clientes", icon: Users, planned: true },
      { to: "/admin/conversas", label: "Conversas", icon: MessagesSquare, planned: true },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { to: "/admin/cms/paginas", label: "Páginas", icon: Palette, planned: true },
      { to: "/admin/marketing/cupons", label: "Marketing", icon: Megaphone, planned: true },
    ],
  },
  {
    title: "Operação",
    items: [
      { to: "/admin/caixa", label: "Caixa", icon: Wallet, planned: true },
      { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3, planned: true },
      { to: "/admin/configuracoes/loja", label: "Configurações", icon: Settings },
    ],
  },
];

const BOTTOM_NAV: NavItem[] = [
  { to: "/admin", label: "Início", icon: LayoutDashboard },
  { to: "/admin/catalogo/produtos", label: "Produtos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/configuracoes/loja", label: "Ajustes", icon: Settings },
];

function NavLinks({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <nav className="space-y-6">
      {NAV.map((group) => (
        <div key={group.title}>
          {!collapsed ? (
            <p className="eyebrow px-3 pb-2 text-muted-foreground">{group.title}</p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/admin" }}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed && "justify-center",
                  )}
                  activeProps={{
                    className: "bg-sidebar-accent text-sidebar-foreground",
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="size-5 shrink-0" aria-hidden />
                  {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                  {!collapsed && item.planned ? (
                    <Badge variant="secondary" className="shrink-0 text-[0.6rem]">
                      Em breve
                    </Badge>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          {!collapsed ? (
            <Link to="/admin" className="flex items-center">
              <Logo className="h-6" />
            </Link>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeft className="size-5" aria-hidden />
            ) : (
              <PanelLeftClose className="size-5" aria-hidden />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <NavLinks collapsed={collapsed} />
        </ScrollArea>
        <div className="border-t border-sidebar-border p-3">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to="/">{collapsed ? <Store className="size-4" /> : "Ver loja"}</Link>
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className={cn("flex min-h-screen flex-col", collapsed ? "md:pl-16" : "md:pl-64")}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur pt-safe md:px-6">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-4">
                <SheetTitle className="sr-only">Menu do painel</SheetTitle>
                <Logo className="h-6" />
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
                <NavLinks />
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Link to="/admin" className="flex items-center md:hidden">
            <Logo className="h-6" />
          </Link>
          <span className="ml-auto text-sm text-muted-foreground">Painel Hr Shoes</span>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto max-w-screen-xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Navegação do painel"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur pb-safe md:hidden"
      >
        <ul className="flex items-stretch justify-around">
          {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeOptions={{ exact: to === "/admin" }}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 py-2 text-[0.68rem] font-medium text-muted-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
