// ─── Runtime-level env resolver ──────────────────────────────────────────────
// Resolves environment variables securely and reliably across all target environments:
//
// 1. TanStack Start Event AsyncLocalStorage:
//    TanStack Start registers its request store on globalThis under a specific Symbol.
//    Under Cloudflare Workers / Pages, Vinxi's `getEvent()` is broken because globalThis.app
//    is undefined, causing runtime crashes. Accessing the store directly works flawlessly.
//
// 2. process.env:
//    Fallback for Local Dev (Node.js/Vite) & Nitro Cloudflare polyfills.
//
// 3. import.meta.env:
//    Vite build-time injections (for public VITE_* variables).
// ─────────────────────────────────────────────────────────────────────────────

export function getEnvVar(key: string): string | undefined {
  // 1. Resolve via TanStack Start's event storage
  try {
    const sym = Symbol.for("tanstack-start:event-storage");
    const storage = (globalThis as any)[sym];
    if (storage) {
      const store = storage.getStore();
      const req = store?.h3Event?.req;
      const env = req?.runtime?.cloudflare?.env;
      if (env && typeof env[key] === "string" && env[key]) {
        return env[key];
      }
    }
  } catch {
    // Ignore context access errors
  }

  // 2. Fallback to process.env (Node.js runtime / local dev)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }

  // 3. Fallback to Vite build-time env injection (VITE_* public variables only)
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }

  return undefined;
}
