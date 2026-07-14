import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getUserSession();
    if (!session || session.role === "customer") {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: "/admin" },
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
