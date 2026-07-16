import { getEvent } from "vinxi/http";

// ─── Runtime-level env cache ─────────────────────────────────────────────────
// Populated once per Worker lifecycle from Cloudflare bindings.
// In Cloudflare Pages (nitropack cloudflare-pages preset) the env object is
// set on globalThis.__env__ before every request (see cloudflare-pages.mjs).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves an environment variable across all supported runtimes:
 *
 *  1. globalThis.__env__  → Cloudflare Pages / Workers (set by Nitro preset)
 *  2. event.context._platform.cloudflare.env  → Nitro H3 event context
 *  3. process.env         → Local dev (Node.js / Vite)
 *  4. import.meta.env     → Vite build-time injections for VITE_* keys
 */
export function getEnvVar(key: string): string | undefined {
  // 1. globalThis.__env__ — set by Nitro's cloudflare-pages.mjs on every request
  const gEnv = (globalThis as any).__env__;
  if (gEnv && typeof gEnv[key] === "string" && gEnv[key]) {
    return gEnv[key];
  }

  // 2. Vinxi/H3 event context._platform.cloudflare.env
  try {
    const event = getEvent();
    const platformEnv =
      (event?.context as any)?._platform?.cloudflare?.env ??
      (event?.context as any)?._platform?.env;
    if (platformEnv && typeof platformEnv[key] === "string" && platformEnv[key]) {
      return platformEnv[key];
    }
  } catch {
    // getEvent() can throw outside a request context — ignore
  }

  // 3. process.env (Node.js local dev / Nitro node preset)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }

  // 4. Vite build-time injections (VITE_* public keys only)
  if (
    typeof import.meta !== "undefined" &&
    (import.meta as any).env?.[key]
  ) {
    return (import.meta as any).env[key];
  }

  return undefined;
}
