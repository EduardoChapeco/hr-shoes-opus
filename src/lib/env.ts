import { getEvent } from "vinxi/http";

/**
 * Retrieves environment variables securely across different runtimes:
 * 1. Cloudflare Pages/Workers (via Vinxi/Nitro event context bindings)
 * 2. Vite build-time injections (import.meta.env)
 * 3. Node.js local development (process.env)
 */
export function getEnvVar(key: string): string | undefined {
  // 1. Try Vite build-time injections for public keys
  if (key === "VITE_SUPABASE_URL" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (key === "VITE_SUPABASE_ANON_KEY" && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  // 2. Try Cloudflare bindings via event context (runtime)
  try {
    const event = getEvent();
    if (event?.context?.cloudflare?.env?.[key]) {
      return event.context.cloudflare.env[key] as string;
    }
  } catch (e) {
    // getEvent() throws if called outside a request context; safely ignore
  }

  // 3. Fallback to Node.js process.env (local dev)
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  return undefined;
}
