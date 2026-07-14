import { Link } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, User, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { to: string; label: string; icon: LucideIcon; exact?: boolean }[] =
  [
    { to: "/", label: "Início", icon: Home, exact: true },
    { to: "/catalogo", label: "Catálogo", icon: LayoutGrid },
    { to: "/buscar", label: "Buscar", icon: Search },
    { to: "/carrinho", label: "Carrinho", icon: ShoppingBag },
    { to: "/conta", label: "Conta", icon: User },
  ];

/** Sticky bottom navigation — mobile only (DESIGN.md §7). */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-safe md:hidden"
    >
      <ul className="mx-auto flex max-w-screen-sm items-stretch justify-around">
        {ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
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
  );
}

/** Canonical alias (see COMPONENT_CATALOG.md). */
export const MobileBottomNav = BottomNav;
