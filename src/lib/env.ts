import { getEvent } from "vinxi/http";

// Global cache for environment variables to prevent context loss across async boundaries in Cloudflare Workers.
const cachedEnv: Record<string, string> = {};

/**
 * Retrieves environment variables securely across different runtimes:
 * 1. Global cache (if populated in a previous/current request)
 * 2. Cloudflare runtime bindings (event.context.cloudflare.env) via Vinxi event context
 * 3. Vite build-time injections (import.meta.env)
 * 4. Node.js local development & Nitro Cloudflare polyfill (process.env)
 */
export function getEnvVar(key: string): string | undefined {
  // 1. Try our global cache first (extremely fast and survives async boundaries)
  if (cachedEnv[key]) {
    return cachedEnv[key];
  }

  // 2. Try Vinxi request context first (for Cloudflare production runtime bindings)
  try {
    const event = getEvent();
    const env = (event?.context as any)?.cloudflare?.env || (event?.context as any)?.env;
    if (env) {
      // Cache all available variables so they are preserved for future calls
      for (const [k, v] of Object.entries(env)) {
        if (typeof v === "string") {
          cachedEnv[k] = v;
        }
      }
      if (env[key]) {
        return env[key];
      }
    }
  } catch {}

  // 3. Try Vite build-time injections for public keys
  if (key === "VITE_SUPABASE_URL" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (key === "VITE_SUPABASE_ANON_KEY" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  // 4. Cloudflare bindings are polyfilled onto process.env by Nitro in local TanStack Start.
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key]) {
      cachedEnv[key] = process.env[key];
      return process.env[key];
    }
  }

  return undefined;
}
