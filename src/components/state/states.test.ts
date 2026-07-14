import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  EmptyState,
  ErrorState,
  PermissionState,
  UnconfiguredState,
  StatusBadge,
} from "@/components/state/states";
import { LoadingState } from "@/components/state/loading";

/**
 * Critical UI states must render honestly with their message — never blank,
 * never fabricated data.
 */
describe("critical UI states", () => {
  it("EmptyState renders its title", () => {
    const html = renderToStaticMarkup(createElement(EmptyState, { title: "Sem produtos" }));
    expect(html).toContain("Sem produtos");
  });

  it("ErrorState renders a default message", () => {
    const html = renderToStaticMarkup(createElement(ErrorState, {}));
    expect(html).toContain("Algo deu errado");
  });

  it("PermissionState renders a restricted-access message", () => {
    const html = renderToStaticMarkup(createElement(PermissionState, {}));
    expect(html).toContain("Acesso restrito");
  });

  it("UnconfiguredState renders a missing-config message", () => {
    const html = renderToStaticMarkup(createElement(UnconfiguredState, {}));
    expect(html).toContain("Configuração ausente");
  });

  it("LoadingState renders an accessible status", () => {
    const html = renderToStaticMarkup(createElement(LoadingState, {}));
    expect(html).toContain("Carregando");
    expect(html).toContain('role="status"');
  });

  it("StatusBadge maps each status to a label", () => {
    for (const status of ["unconfigured", "testing", "active", "error", "planned"] as const) {
      const html = renderToStaticMarkup(createElement(StatusBadge, { status }));
      expect(html.length).toBeGreaterThan(0);
    }
  });
});
