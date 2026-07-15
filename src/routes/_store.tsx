import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getNavigationMenus, getPublicStoreSettings } from "@/services/cms.functions";

import { PublicHeader } from "@/components/commerce/public-header";
import { PublicFooter } from "@/components/commerce/public-footer";
import { BottomNav } from "@/components/commerce/bottom-nav";

export const Route = createFileRoute("/_store")({
  loader: async () => {
    const [menusRes, storeRes] = await Promise.all([
      getNavigationMenus().catch(() => ({ status: "error", data: [] })),
      getPublicStoreSettings().catch(() => ({ status: "error", data: null })),
    ]);
    return {
      menus: menusRes.status === "ok" ? menusRes.data : [],
      store: storeRes.status === "ok" ? storeRes.data : null,
    };
  },
  component: StoreLayout,
});

function StoreLayout() {
  const { menus, store } = Route.useLoaderData() as any;

  // Extract header and footer menus
  const headerMenu = menus.find((m: any) => m.handle === "header")?.items || [];
  const footerMenu = menus.find((m: any) => m.handle === "footer")?.items || [];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader menuItems={headerMenu} storeName={store?.name} />
      {/* pb accounts for the sticky mobile bottom nav */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter menuItems={footerMenu} store={store} />
      <BottomNav />
    </div>
  );
}
