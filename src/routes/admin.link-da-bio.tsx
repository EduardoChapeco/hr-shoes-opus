/**
 * admin.link-da-bio.tsx — Adapter: redirects to Builder filtered for biolinks.
 * Maintained for sidebar nav compatibility during B6 migration.
 * Removal condition: after Builder index has a dedicated Biolinks section that
 * replaces this nav item in routes.ts.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/link-da-bio")({
  loader: async () => {
    throw redirect({ to: "/admin/builder", search: { type: "biolink" } as any });
  },
  component: () => null,
});
