/**
 * Retrieves environment variables securely across different runtimes:
 * 1. Vite build-time injections (import.meta.env)
 * 2. Node.js local development & Nitro Cloudflare polyfill (process.env)
 */
export function getEnvVar(key: string): string | undefined {
  // 1. Try Vite build-time injections for public keys
  if (key === "VITE_SUPABASE_URL" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (key === "VITE_SUPABASE_ANON_KEY" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  // Cloudflare bindings are polyfilled onto process.env by Nitro in TanStack Start.
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  return undefined;
}
