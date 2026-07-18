import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  CreditCard,
  Users,
  MessagesSquare,
  FileText,
  Images,
  Megaphone,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  Store,
  CheckSquare,
  Plus,
  ChevronLeft,
  Grid,
  Bell,
  Calendar,
  LogOut,
  UserPlus
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/commerce/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ADMIN_SIDEBAR_NAV, ADMIN_BOTTOM_NAV, getRoute, hasRoleAccess } from "@/lib/routes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { signOut } from "@/services/auth.functions";

// ---------------------------------------------------------------------------
// Icon registry
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  CreditCard,
  Users,
  MessagesSquare,
  FileText,
  Images,
  Megaphone,
  Wallet,
  BarChart3,
  Settings,
  Store,
  CheckSquare,
  Plus,
  ChevronLeft,
  Grid,
  Bell,
  Calendar,
  LogOut,
  UserPlus
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Settings;
}

// ---------------------------------------------------------------------------
// Contextual Actions mapping
// ---------------------------------------------------------------------------
function getContextualAction(pathname: string) {
  if (pathname.startsWith("/admin/catalogo/produtos")) {
    return { label: "Novo Produto", path: "/admin/catalogo/produtos/novo", icon: "Plus" };
  }
  if (pathname.startsWith("/admin/clientes")) {
    return { label: "Cadastrar Cliente", path: "/admin/clientes", icon: "UserPlus" };
  }
  if (pathname.startsWith("/admin/caixa")) {
    return { label: "Novo Lançamento", path: "/admin/caixa/lancamentos", icon: "Plus" };
  }
  if (pathname.startsWith("/admin/cms/paginas")) {
    return { label: "Nova Página", path: "/admin/cms/paginas/novo", icon: "Plus" };
  }
  if (pathname.startsWith("/admin/marketing/cupons")) {
    return { label: "Novo Cupom", path: "/admin/marketing/cupons", icon: "Plus" };
  }
  if (pathname.startsWith("/admin/pedidos")) {
    return { label: "Venda PDV / Caixa", path: "/admin/caixa", icon: "ShoppingCart" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Active nav group resolver
// ---------------------------------------------------------------------------
function getActiveGroup(pathname: string): string {
  if (pathname.startsWith("/admin/catalogo") || pathname.startsWith("/admin/estoque") || pathname.startsWith("/admin/midias")) {
    return "Catálogo";
  }
  if (pathname.startsWith("/admin/pedidos") || pathname.startsWith("/admin/fretes") || pathname.startsWith("/admin/pagamentos") || pathname.startsWith("/admin/comprovantes")) {
    return "Vendas";
  }
  if (pathname.startsWith("/admin/clientes") || pathname.startsWith("/admin/conversas") || pathname.startsWith("/admin/suporte") || pathname.startsWith("/admin/pedidos/trocas")) {
    return "Relacionamento";
  }
  if (pathname.startsWith("/admin/cms") || pathname.startsWith("/admin/perfil-publico") || pathname.startsWith("/admin/marketing") || pathname.startsWith("/admin/stories") || pathname.startsWith("/admin/destaques") || pathname.startsWith("/admin/link-da-bio")) {
    return "Conteúdo & Vitrine";
  }
  if (pathname.startsWith("/admin/caixa") || pathname.startsWith("/admin/equipe") || pathname.startsWith("/admin/relatorios") || pathname.startsWith("/admin/configuracoes") || pathname.startsWith("/admin/comissoes")) {
    return "Operação";
  }
  return "Geral";
}

// Top-level modules list
const MODULES = [
  { label: "Visão Geral", path: "/admin", icon: "LayoutDashboard", group: "Geral" },
  { label: "Catálogo", path: "/admin/catalogo/produtos", icon: "Package", group: "Catálogo" },
  { label: "Vendas", path: "/admin/pedidos", icon: "ShoppingCart", group: "Vendas" },
  { label: "Relacionamento", path: "/admin/clientes", icon: "Users", group: "Relacionamento" },
  { label: "Conteúdo & Vitrine", path: "/admin/perfil-publico", icon: "Store", group: "Conteúdo & Vitrine" },
  { label: "Operação", path: "/admin/caixa", icon: "Wallet", group: "Operação" },
];

// ---------------------------------------------------------------------------
// HeaderRightIsland Component
// ---------------------------------------------------------------------------
function HeaderRightIsland() {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setDateStr(
        now.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-10 items-center gap-3 rounded-full border border-border/80 bg-card px-4 py-1.5 shadow-xs text-xs font-medium text-foreground">
      {dateStr && (
        <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
          <Calendar className="size-3.5 text-primary" />
          {dateStr}
        </span>
      )}
      <span className="h-3 w-px bg-border" />
      {timeStr && <span className="font-bold">{timeStr}</span>}
      <span className="h-3 w-px bg-border" />
      <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-primary rounded-full" aria-label="Notificações">
        <Bell className="size-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminShell
// ---------------------------------------------------------------------------
export function AdminShell({ children, session }: { children: ReactNode; session: any }) {
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const pathname = router.state.location.pathname;

  const handleLogout = async () => {
    try {
      const res = await signOut();
      if (res.status === "success") {
        toast.success("Sessão encerrada.");
        router.navigate({ to: "/entrar", replace: true });
      } else {
        toast.error(res.message || "Erro ao sair");
      }
    } catch {
      toast.error("Erro inesperado ao encerrar sessão.");
    }
  };

  const getInitials = (email: string) => {
    const name = email.split("@")[0] || "U";
    return name.slice(0, 2).toUpperCase();
  };

  const activeGroup = getActiveGroup(pathname);

  // Switch viewMode based on route
  const [viewMode, setViewMode] = useState<"modules" | "subpages">(() => {
    return (pathname === "/admin" || pathname === "/admin/" || pathname === "/admin/onboarding") ? "modules" : "subpages";
  });

  useEffect(() => {
    if (pathname === "/admin" || pathname === "/admin/" || pathname === "/admin/onboarding") {
      setViewMode("modules");
    } else {
      setViewMode("subpages");
    }
  }, [pathname]);

  const contextualAction = getContextualAction(pathname);
  const ActionIcon = contextualAction ? resolveIcon(contextualAction.icon) : null;

  // Filter sidebar groups based on user's role
  const filteredNav = ADMIN_SIDEBAR_NAV.map((group) => {
    const allowedItems = group.items.filter((item) => {
      const route = getRoute(item.path);
      return route ? hasRoleAccess(session?.role, route.roles) : false;
    });
    return { ...group, items: allowedItems };
  }).filter((group) => group.items.length > 0);

  const activeGroupNav = filteredNav.find((g) => g.title === activeGroup);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar - Vertical Island Pill Layout */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={cn(
          "fixed left-[8px] top-[8px] bottom-[8px] z-40 hidden flex-col border border-border bg-sidebar rounded-2xl shadow-md transition-all duration-300 md:flex",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Top: Brand/Logo & Action Button */}
        <div className="flex flex-col items-center gap-4 border-b border-sidebar-border p-3">
          {/* Dynamic Circular Action Button */}
          {contextualAction ? (
            <Link
              to={contextualAction.path}
              className={cn(
                "flex h-11 items-center gap-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-brand",
                collapsed ? "w-11 justify-center" : "w-full px-4"
              )}
              title={contextualAction.label}
            >
              {ActionIcon && <ActionIcon className="size-5 shrink-0" />}
              {!collapsed && <span className="text-xs font-bold truncate">{contextualAction.label}</span>}
            </Link>
          ) : (
            <div className={cn("flex items-center", collapsed ? "h-11 justify-center" : "h-11 w-full px-2")}>
              {collapsed ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Store className="size-5 text-primary" />
                </div>
              ) : (
                <Link to="/admin" className="flex items-center">
                  <Logo className="h-6" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Scrollable menu content */}
        <ScrollArea className="flex-1 px-3 py-4">
          {viewMode === "subpages" && activeGroupNav ? (
            <div className="space-y-4">
              {!collapsed && (
                <p className="eyebrow px-3 pb-1 text-primary font-bold tracking-wider">{activeGroupNav.title}</p>
              )}
              <ul className="space-y-1">
                {activeGroupNav.items.map((item) => {
                  const Icon = resolveIcon(item.icon);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        activeOptions={{ exact: item.path === "/admin" }}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          collapsed && "justify-center"
                        )}
                        activeProps={{
                          className: "bg-sidebar-accent text-sidebar-foreground",
                        }}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        {!collapsed && <span className="flex-1 truncate text-xs">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            // Top level modules view
            <div className="space-y-4">
              {!collapsed && (
                <p className="eyebrow px-3 pb-1 text-muted-foreground font-bold tracking-wider">Módulos</p>
              )}
              <ul className="space-y-1">
                {MODULES.map((mod) => {
                  const Icon = resolveIcon(mod.icon);
                  const isCurrent = activeGroup === mod.group;
                  return (
                    <li key={mod.path}>
                      <Link
                        to={mod.path}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          isCurrent && "bg-sidebar-accent/50 text-sidebar-foreground",
                          collapsed && "justify-center"
                        )}
                        title={collapsed ? mod.label : undefined}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        {!collapsed && <span className="flex-1 truncate text-xs">{mod.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </ScrollArea>

        {/* Bottom actions: Modules Back & Storefront */}
        <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
          {viewMode === "subpages" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold"
              onClick={() => setViewMode("modules")}
            >
              {collapsed ? <Grid className="size-4" /> : "Menu de Módulos"}
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="w-full text-xs hover:bg-sidebar-accent">
            <Link to="/">{collapsed ? <Store className="size-4" /> : "Ver loja pública"}</Link>
          </Button>

          {/* User profile & Logout footer */}
          <div className="mt-2 pt-2 border-t border-sidebar-border/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="size-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                  {getInitials(session?.email || "Admin")}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-semibold text-xs text-foreground truncate max-w-[120px]" title={session?.email}>
                    {session?.email || "Colaborador"}
                  </span>
                  <span className="text-[9px] text-muted-foreground capitalize">
                    {session?.role || "Acesso"}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={handleLogout}
                type="button"
                title="Sair do painel"
              >
                <LogOut className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          collapsed ? "md:pl-[84px]" : "md:pl-[280px]"
        )}
      >
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
                <div className="space-y-6">
                  <div>
                    <p className="eyebrow px-3 pb-2 text-muted-foreground">Navegação Geral</p>
                    <ul className="space-y-1">
                      {MODULES.map((mod) => {
                        const Icon = resolveIcon(mod.icon);
                        return (
                          <li key={mod.path}>
                            <Link
                              to={mod.path}
                              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground"
                            >
                              <Icon className="size-5" />
                              {mod.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Link to="/admin" className="flex items-center md:hidden">
            <Logo className="h-6" />
          </Link>
          <span className="hidden text-sm font-semibold tracking-tight text-foreground/80 sm:inline-block">
            {activeGroup !== "Geral" ? `Painel > ${activeGroup}` : "Centro de Comando"}
          </span>

          {/* Premium Right Island showing Date/Time/Notifications */}
          <div className="ml-auto">
            <HeaderRightIsland />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto max-w-screen-xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav — driven by ADMIN_BOTTOM_NAV from routes.ts */}
      <nav
        aria-label="Navegação do painel"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur pb-safe md:hidden"
      >
        <ul className="flex items-stretch justify-around">
          {ADMIN_BOTTOM_NAV.filter((item) => {
            const route = getRoute(item.path);
            return route ? hasRoleAccess(session?.role, route.roles) : false;
          }).map(({ path, label, icon }) => {
            const Icon = resolveIcon(icon);
            return (
              <li key={path} className="flex-1">
                <Link
                  to={path}
                  activeOptions={{ exact: path === "/admin" }}
                  className="flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 py-2 text-nav font-medium text-muted-foreground"
                  activeProps={{ className: "text-primary" }}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
