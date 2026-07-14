import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu } from "lucide-react";

import { Logo } from "@/components/commerce/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PRIMARY_NAV = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/promocoes", label: "Promoções" },
  { to: "/stories", label: "Stories" },
  { to: "/perfil-da-loja", label: "A loja" },
  { to: "/contato", label: "Contato" },
] as const;

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur pt-safe">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4 md:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo className="h-7" />
            </SheetHeader>
            <nav className="mt-6 flex flex-col">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                  activeProps={{ className: "text-primary" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center" aria-label="Hr Shoes — início">
          <Logo />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild aria-label="Buscar">
            <Link to="/buscar">
              <Search className="size-5" aria-hidden />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Minha conta">
            <Link to="/conta">
              <User className="size-5" aria-hidden />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Carrinho">
            <Link to="/carrinho">
              <ShoppingBag className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
