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
  FileText,
  Images,
  Megaphone,
  Wallet,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Store,
  CheckSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/commerce/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ADMIN_SIDEBAR_NAV, ADMIN_BOTTOM_NAV, getRoute, hasRoleAccess } from "@/lib/routes";

// ---------------------------------------------------------------------------
// Icon registry — resolves icon name strings from routes.ts to LucideIcon
// components. Add new icons here when adding new nav entries to routes.ts.
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
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Settings;
}

// ---------------------------------------------------------------------------
// NavLinks — driven entirely by ADMIN_SIDEBAR_NAV from routes.ts
// ---------------------------------------------------------------------------
function NavLinks({ collapsed = false, session }: { collapsed?: boolean; session: any }) {
  // Filter sidebar groups based on user's role
  const filteredNav = ADMIN_SIDEBAR_NAV.map((group) => {
    const allowedItems = group.items.filter((item) => {
      const route = getRoute(item.path);
      return route ? hasRoleAccess(session?.role, route.roles) : false;
    });
    return { ...group, items: allowedItems };
  }).filter((group) => group.items.length > 0);

  return (
    <nav className="space-y-6">
      {filteredNav.map((group) => (
        <div key={group.title}>
          {!collapsed ? (
            <p className="eyebrow px-3 pb-2 text-muted-foreground">{group.title}</p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = resolveIcon(item.icon);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    activeOptions={{ exact: item.path === "/admin" }}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      collapsed && "justify-center",
                    )}
                    activeProps={{
                      className: "bg-sidebar-accent text-sidebar-foreground",
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// AdminShell — main layout wrapper for all /admin/* routes
// ---------------------------------------------------------------------------
export function AdminShell({ children, session }: { children: ReactNode; session: any }) {
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
          <NavLinks collapsed={collapsed} session={session} />
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
                <NavLinks session={session} />
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
