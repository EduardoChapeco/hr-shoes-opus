import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { getUserSession } from "@/services/auth.functions";

import { getRoute, hasRoleAccess } from "@/lib/routes";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const session = await getUserSession();
    if (!session || session.role === "customer") {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname },
      });
    }

    // Granular RBAC Check
    // Prevent redirect loop by ignoring the check if already targeting /admin root exactly
    if (location.pathname !== "/admin") {
      const routeConfig = getRoute(location.pathname);
      if (routeConfig && !hasRoleAccess(session.role, routeConfig.roles)) {
        throw redirect({
          to: "/admin",
          search: { error: "unauthorized" },
        });
      }
    }

    return { session };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const search: any = Route.useSearch();
  const navigate = Route.useNavigate();

  const { session } = Route.useRouteContext();
  
  useEffect(() => {
    if (search.error === "unauthorized") {
      toast.error("Acesso Negado: Você não tem permissão para acessar aquela página.");
      // Clear the query string
      navigate({ to: "/admin", replace: true });
    }
  }, [search.error, navigate]);

  return (
    <AdminShell session={session}>
      <Outlet />
    </AdminShell>
  );
}
