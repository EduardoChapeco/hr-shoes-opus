import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getNavigationMenus, getPublicStoreSettings } from "@/services/cms.functions";
import { getCart } from "@/services/cart.functions";
import { getActiveGlobalPopups } from "@/services/builder.functions";

import { PublicHeader } from "@/components/commerce/public-header";
import { PublicFooter } from "@/components/commerce/public-footer";
import { BottomNav } from "@/components/commerce/bottom-nav";
import { GlobalPopupRenderer } from "@/components/commerce/global-popup-renderer";

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
  component: StoreLayout,
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

function StoreLayout() {
  const { menus, store, cart, popups } = Route.useLoaderData() as any;

  // Extract header and footer menus
  const headerMenu = menus.find((m: any) => m.handle === "header")?.items || [];
  const footerMenu = menus.find((m: any) => m.handle === "footer")?.items || [];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader menuItems={headerMenu} storeName={store?.name} cart={cart} />
      {/* pb accounts for the sticky mobile bottom nav */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter menuItems={footerMenu} store={store} />
      <BottomNav />
      <GlobalPopupRenderer popups={popups} />
    </div>
  );
}
