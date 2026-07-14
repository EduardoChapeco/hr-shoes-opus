import { z } from "zod";

export const RoleSchema = z.enum([
  "owner",
  "admin",
  "manager",
  "seller",
  "stock",
  "finance",
  "content",
  "support",
  "customer",
]);
export type Role = z.infer<typeof RoleSchema>;

export const PermissionActionSchema = z.enum(["create", "read", "update", "delete", "manage"]);
export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const PermissionResourceSchema = z.enum([
  "products",
  "categories",
  "orders",
  "customers",
  "content",
  "settings",
  "staff",
  "reports",
]);
export type PermissionResource = z.infer<typeof PermissionResourceSchema>;

export const PermissionSchema = z.object({
  action: PermissionActionSchema,
  resource: PermissionResourceSchema,
});
export type Permission = z.infer<typeof PermissionSchema>;

/**
 * Role to Permissions Mapping
 * Defines what each role can do across the system.
 */
export const RolePermissionsRegistry: Record<Role, Permission[]> = {
  owner: [{ action: "manage", resource: "settings" }], // owners can do everything, explicitly managed in auth guards
  admin: [{ action: "manage", resource: "settings" }], // similar to owner
  manager: [
    { action: "manage", resource: "products" },
    { action: "manage", resource: "categories" },
    { action: "manage", resource: "orders" },
    { action: "manage", resource: "customers" },
    { action: "read", resource: "reports" },
  ],
  seller: [
    { action: "read", resource: "products" },
    { action: "manage", resource: "orders" },
    { action: "read", resource: "customers" },
  ],
  stock: [
    { action: "read", resource: "products" },
    { action: "update", resource: "products" }, // update stock
  ],
  finance: [
    { action: "read", resource: "orders" },
    { action: "read", resource: "reports" },
  ],
  content: [
    { action: "manage", resource: "content" },
    { action: "read", resource: "products" },
  ],
  support: [
    { action: "read", resource: "orders" },
    { action: "manage", resource: "customers" },
  ],
  customer: [
    // Customers only access their own resources via RLS, not via global admin permissions
  ],
};

export function hasPermission(
  role: Role,
  action: PermissionAction,
  resource: PermissionResource,
): boolean {
  if (role === "owner" || role === "admin") return true;

  const permissions = RolePermissionsRegistry[role] || [];
  return permissions.some(
    (p) => (p.action === action || p.action === "manage") && p.resource === resource,
  );
}
