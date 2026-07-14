import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PublicHeader } from "@/components/commerce/public-header";
import { PublicFooter } from "@/components/commerce/public-footer";
import { BottomNav } from "@/components/commerce/bottom-nav";

export const Route = createFileRoute("/_store")({
  component: StoreLayout,
});

function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      {/* pb accounts for the sticky mobile bottom nav */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter />
      <BottomNav />
    </div>
  );
}
