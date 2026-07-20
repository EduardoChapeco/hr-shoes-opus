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
    const [menusRes, storeRes, cart, popupsRes] = await Promise.all([
      getNavigationMenus(),
      getPublicStoreSettings(),
      getCart(),
      getActiveGlobalPopups()
    ]);
    return {
      menus: menusRes.status === "ok" ? menusRes.data : [],
      store: storeRes.status === "ok" ? storeRes.data : null,
      cart,
      popups: popupsRes.status === "ok" ? popupsRes.data : []
    };
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

  const storeName = store?.name || "Hr Shoes";
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
        logo: store?.logoUrl || `${baseUrl}/logo.png`,
        contactPoint: store?.contactPhone
          ? {
              "@type": "ContactPoint",
              telephone: store.contactPhone,
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
        logoUrl={store?.logoUrl}
      />
      <main className="@container flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter menuItems={footerMenu} store={store} />
      <BottomNav />
      <GlobalPopupRenderer popups={popups} />
      <SlideOutCart />
    </div>
  );

}
