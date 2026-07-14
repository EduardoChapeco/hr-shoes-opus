import { describe, it, expect } from "vitest";

import {
  ALL_ROUTES,
  PUBLIC_ROUTES,
  ADMIN_ROUTES,
  CUSTOMER_ROUTES,
  toTanstackPath,
} from "@/lib/routes";

describe("route registry", () => {
  it("has no duplicate paths", () => {
    const paths = ALL_ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every route has a non-empty label and description", () => {
    for (const r of ALL_ROUTES) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.description.length).toBeGreaterThan(0);
    }
  });

  it("marks dynamic routes consistently with params", () => {
    for (const r of ALL_ROUTES) {
      const hasParam = /:[A-Za-z0-9_]+/.test(r.path);
      expect(Boolean(r.dynamic)).toBe(hasParam);
    }
  });

  it("public routes are visitor-accessible", () => {
    for (const r of PUBLIC_ROUTES) {
      expect(r.audience).toBe("public");
    }
  });

  it("admin routes never allow visitor/customer", () => {
    for (const r of ADMIN_ROUTES) {
      expect(r.roles).not.toContain("visitor");
      expect(r.roles).not.toContain("customer");
    }
  });

  it("customer routes belong to public or customer audience", () => {
    for (const r of CUSTOMER_ROUTES) {
      expect(["public", "customer"]).toContain(r.audience);
    }
  });

  it("converts docs paths to TanStack param syntax", () => {
    expect(toTanstackPath("/produto/:slug")).toBe("/produto/$slug");
    expect(toTanstackPath("/pedido/:publicToken/confirmacao")).toBe(
      "/pedido/$publicToken/confirmacao",
    );
  });
});
