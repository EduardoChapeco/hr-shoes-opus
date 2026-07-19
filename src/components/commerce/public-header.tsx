import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Logo } from "@/components/commerce/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useCartContext } from "@/lib/cart-context";

const FALLBACK_NAV = [
  { url: "/catalogo", label: "Catálogo" },
  { url: "/promocoes", label: "Promoções" },
  { url: "/perfil-da-loja", label: "A loja" },
];

export function PublicHeader({
  menuItems = [],
  storeName,
  cart,
}: {
  menuItems?: any[];
  storeName?: string;
  cart?: any;
}) {
  const navItems = menuItems.length > 0 ? menuItems : FALLBACK_NAV;
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { cart: contextCart, setIsCartOpen } = useCartContext();

  // Auto-focus search input when it opens
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate({ to: "/buscar", search: { q: searchQuery.trim() } });
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur pt-safe">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4 md:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Abrir menu">
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo className="h-7" />
            </SheetHeader>
            <nav className="mt-6 flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                  activeProps={{ className: "text-primary bg-accent/50" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          aria-label={`${storeName || "Hr Shoes"} — início`}
        >
          <Logo />
          {storeName && (
            <span className="font-bold text-lg tracking-tight hidden lg:inline-block">
              {storeName}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 flex-1 justify-end">
          {/* Expandable Search */}
          <div
            className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
              isSearchOpen ? "w-full max-w-[280px] opacity-100 mr-2" : "w-0 opacity-0 md:w-0 md:opacity-0"
            }`}
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-9 pl-9 pr-8 rounded-full border-border bg-accent/50 focus-visible:bg-background transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full"
              >
                <X className="size-3.5" />
              </button>
            </form>
          </div>

          {/* Search Trigger (hidden when search is open) */}
          {!isSearchOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
              className="shrink-0"
            >
              <Search className="size-5" aria-hidden />
            </Button>
          )}

          <Button variant="ghost" size="icon" asChild aria-label="Minha conta" className="shrink-0">
            <Link to="/conta">
              <User className="size-5" aria-hidden />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCartOpen(true)}
            aria-label="Carrinho"
            className="relative shrink-0"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {contextCart && contextCart.itemCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {contextCart.itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
