import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getNavigationMenus, getPublicStoreSettings } from "@/services/cms.functions";
import { getCart } from "@/services/cart.functions";
import { getActiveGlobalPopups } from "@/services/builder.functions";
import { useEffect } from "react";

import { PublicHeader } from "@/components/commerce/public-header";
import { PublicFooter } from "@/components/commerce/public-footer";
import { BottomNav } from "@/components/commerce/bottom-nav";
import { GlobalPopupRenderer } from "@/components/commerce/global-popup-renderer";
import { CartProvider, useCartContext } from "@/lib/cart-context";
import { SlideOutCart } from "@/components/commerce/slide-out-cart";

export const Route = createFileRoute("/_store")({
  loader: async () => {
    try {
      const [menusRes, storeRes, cart, popupsRes] = await Promise.all([
        getNavigationMenus().catch(() => []),
        getPublicStoreSettings().catch(() => null),
        getCart().catch(() => null),
        getActiveGlobalPopups().catch(() => []),
      ]);
      return {
        menus: menusRes || [],
        store: storeRes || null,
        cart,
        popups: popupsRes || [],
      };
    } catch {
      return {
        menus: [],
        store: null,
        cart: null,
        popups: [],
      };
    }
  },
  component: StoreLayoutWrapper,
  errorComponent: ({ error }: { error: any }) => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-2xl font-bold text-destructive">Erro Inesperado</h1>
      <p className="mt-2 text-muted-foreground">Ocorreu um erro ao carregar esta seção da loja.</p>
      <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-muted p-4 text-xs text-left">
        {error?.message || String(error)}
      </pre>
    </div>
  ),
});

function StoreLayoutWrapper() {
  return (
    <CartProvider>
      <StoreLayout />
    </CartProvider>
  );
}

function StoreLayout() {
  const { menus, store, cart, popups } = Route.useLoaderData() as any;
  const { initCart } = useCartContext();

  useEffect(() => {
    initCart(cart);
  }, [cart, initCart]);

  // Extract header and footer menus
  const headerMenu = menus.find((m: any) => m.handle === "header")?.items || [];
  const footerMenu = menus.find((m: any) => m.handle === "footer")?.items || [];

  const storeData = store?.data || store;
  const storeName = storeData?.name || "Hr Shoes";
  const logoUrl =
    storeData?.logoUrl || storeData?.settings?.logoUrl || storeData?.settings?.logo_url;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://hrshoes.com.br";

  // JSON-LD Structured Data (Organization + WebSite with SearchAction)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: storeName,
        url: baseUrl,
        logo: logoUrl || `${baseUrl}/logo.png`,
        contactPoint: storeData?.contactPhone
          ? {
              "@type": "ContactPoint",
              telephone: storeData.contactPhone,
              contactType: "customer service",
            }
          : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: storeName,
        publisher: { "@id": `${baseUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/buscar?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader 
        menuItems={headerMenu} 
        storeName={storeName} 
        logoUrl={logoUrl} 
        hideNameWithLogo={storeData?.settings?.hideNameWithLogo === true} 
      />
      <main className="@container flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter menuItems={footerMenu} store={storeData} />
      <BottomNav />
      <GlobalPopupRenderer popups={popups} />
      <SlideOutCart />
    </div>
  );
}
