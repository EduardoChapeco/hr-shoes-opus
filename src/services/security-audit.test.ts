import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Security Audit & Input Hardening", () => {
  it("should validate and sanitize zipcode inputs against SQL/HTML injection attempts", () => {
    const zipcodeSchema = z.preprocess(
      (val) => String(val).replace(/\D/g, ""),
      z.string().length(8, "CEP inválido")
    );

    expect(zipcodeSchema.parse("89900-000")).toBe("89900000");
    expect(zipcodeSchema.parse("89900-000'<script>alert('xss')</script>")).toBe("89900000");
    expect(() => zipcodeSchema.parse("123")).toThrow();
  });

  it("should enforce integer cents conversion and reject floating-point monetary values", () => {
    const parsePriceCents = (input: number) => {
      if (!Number.isInteger(input) || input < 0) {
        throw new Error("Preço deve ser um valor inteiro em centavos (BRL)");
      }
      return input;
    };

    expect(parsePriceCents(19900)).toBe(19900);
    expect(() => parsePriceCents(199.90)).toThrow();
    expect(() => parsePriceCents(-500)).toThrow();
  });

  it("should sanitize user text input preventing XSS script execution", () => {
    const sanitizeText = (input: string) => {
      return input.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case "<": return "&lt;";
          case ">": return "&gt;";
          case "&": return "&amp;";
          case "'": return "&apos;";
          case '"': return "&quot;";
        }
        return c;
      });
    };

    const maliciousInput = '<img src=x onerror="alert(1)"> & "test"';
    const sanitized = sanitizeText(maliciousInput);
    expect(sanitized).not.toContain("<img");
    expect(sanitized).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;test&quot;');
  });
});
