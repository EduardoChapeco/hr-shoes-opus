/**
 * Supabase clients — Hr Shoes Commerce
 *
 * SERVER CLIENT (server-side only):
 *   Uses service_role key — NEVER import this in browser/component code.
 *   Only safe inside createServerFn() handlers or API routes.
 *
 * BROWSER CLIENT:
 *   Uses anon key — safe for Auth flows in the browser.
 *   Does NOT bypass RLS; all data access still goes through server functions.
 *
 * CONFIGURATION:
 *   Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (public, browser-safe).
 *   Server functions additionally require SUPABASE_SERVICE_ROLE_KEY (secret, server-only).
 *   Missing config → explicit `unconfigured` state, never a silent fallback.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getEnvVar } from "./env";

// ---------------------------------------------------------------------------
// Environment validation schemas
// ---------------------------------------------------------------------------

const BrowserEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(10, "VITE_SUPABASE_ANON_KEY is required"),
});

const ServerEnvSchema = BrowserEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(10, "SUPABASE_SERVICE_ROLE_KEY is required for server operations"),
});

// ---------------------------------------------------------------------------
// Typed unconfigured error
// ---------------------------------------------------------------------------

export class SupabaseUnconfiguredError extends Error {
  readonly code = "supabase_unconfigured" as const;
  constructor(reason: string) {
    let debugInfo = "";
    try {
      // globalThis.__env__ is set by Nitro's cloudflare-pages.mjs before every request
      const gEnv = (globalThis as any).__env__;
      debugInfo += ` [__env__: ${gEnv ? Object.keys(gEnv).join(",") : "null"}]`;
    } catch {}
    try {
      const keysInProcess = typeof process !== "undefined" && process.env ? Object.keys(process.env) : [];
      debugInfo += ` [process.env keys: ${keysInProcess.length}]`;
    } catch {}
    super(`Supabase not configured: ${reason}${debugInfo}`);
  }
}

// ---------------------------------------------------------------------------
// Browser client (Auth only — data access must go through server functions)
// ---------------------------------------------------------------------------

let _browserClient: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (_browserClient) return _browserClient;

  const env = BrowserEnvSchema.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });

  if (!env.success) {
    throw new SupabaseUnconfiguredError(env.error.issues.map((i) => i.message).join("; "));
  }

  _browserClient = createClient(env.data.VITE_SUPABASE_URL, env.data.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _browserClient;
}

// ---------------------------------------------------------------------------
// Server client (service_role — server-side only)
// ---------------------------------------------------------------------------

/**
 * Returns the server-side Supabase client with service_role privileges.
 * MUST only be called inside createServerFn() or server-only modules.
 * Throws SupabaseUnconfiguredError if env vars are missing.
 *
 * NOTE: Not cached at module level — Cloudflare Workers reuse module instances
 * across requests. Since globalThis.__env__ is updated per-request by Nitro,
 * we must re-resolve env vars on every call.
 */
export function getServerClient(): SupabaseClient {
  const env = ServerEnvSchema.safeParse({
    VITE_SUPABASE_URL: getEnvVar("VITE_SUPABASE_URL"),
    VITE_SUPABASE_ANON_KEY: getEnvVar("VITE_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  });

  if (!env.success) {
    throw new SupabaseUnconfiguredError(env.error.issues.map((i) => i.message).join("; "));
  }

  return createClient(
    env.data.VITE_SUPABASE_URL,
    env.data.SUPABASE_SERVICE_ROLE_KEY, // service_role — bypasses RLS (server only)
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Anon Server client (anon key — server-side only, respects RLS)
// ---------------------------------------------------------------------------

/**
 * Returns the server-side Supabase client with anon privileges.
 * Respects RLS and uses the public anon key.
 *
 * NOTE: Not cached at module level — see getServerClient() for reasoning.
 */
export function getAnonServerClient(): SupabaseClient {
  const env = BrowserEnvSchema.safeParse({
    VITE_SUPABASE_URL: getEnvVar("VITE_SUPABASE_URL"),
    VITE_SUPABASE_ANON_KEY: getEnvVar("VITE_SUPABASE_ANON_KEY"),
  });

  if (!env.success) {
    throw new SupabaseUnconfiguredError(env.error.issues.map((i) => i.message).join("; "));
  }

  return createClient(env.data.VITE_SUPABASE_URL, env.data.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks if Supabase is configured without throwing.
 * Use to render UnconfiguredState gracefully in server functions.
 */
export function isSupabaseConfigured(): boolean {
  try {
    getServerClient();
    return true;
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return false;
    // Re-throw unexpected errors (network, etc.)
    throw e;
  }
}
