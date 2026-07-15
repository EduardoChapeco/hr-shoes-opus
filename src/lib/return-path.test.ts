import { describe, expect, it } from "vitest";

import { normalizeInternalReturnPath } from "./return-path";

describe("normalizeInternalReturnPath", () => {
  it("keeps local application paths", () => {
    expect(normalizeInternalReturnPath("/conta?tab=pedidos", "/conta")).toBe("/conta?tab=pedidos");
  });

  it.each(["https://attacker.example", "//attacker.example", "/\\attacker.example", null])(
    "rejects an unsafe redirect target: %s",
    (value) => {
      expect(normalizeInternalReturnPath(value, "/conta")).toBe("/conta");
    },
  );
});
