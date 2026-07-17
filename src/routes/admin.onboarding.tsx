import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/onboarding")({
  component: () => <Navigate to="/admin/configuracoes/etapas" replace />,
});
