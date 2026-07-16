import { getEvent } from "vinxi/http";

/**
 * Retrieves environment variables securely across different runtimes:
 * 1. Cloudflare runtime bindings (event.context.cloudflare.env) via Vinxi event context
 * 2. Vite build-time injections (import.meta.env)
 * 3. Node.js local development & Nitro Cloudflare polyfill (process.env)
 */
export function getEnvVar(key: string): string | undefined {
  // 1. Try Vinxi request context first (for Cloudflare production runtime bindings)
  try {
    const event = getEvent();
    const env = (event?.context as any)?.cloudflare?.env || (event?.context as any)?.env;
    if (env && env[key]) {
      return env[key];
    }
  } catch {}

  // 2. Try Vite build-time injections for public keys
  if (key === "VITE_SUPABASE_URL" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (key === "VITE_SUPABASE_ANON_KEY" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  // 3. Cloudflare bindings are polyfilled onto process.env by Nitro in local TanStack Start.
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  return undefined;
}
