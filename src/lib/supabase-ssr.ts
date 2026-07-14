/**
 * Supabase SSR Client — Hr Shoes Commerce
 *
 * This client is strictly for server-side auth and user session management.
 * It uses the @supabase/ssr package to manage Auth cookies via vinxi/http.
 *
 * It uses the ANON KEY, not the service role key, because it represents
 * the current user visiting the store.
 */

import { createServerClient } from "@supabase/ssr";
import { getCookie, setCookie, parseCookies } from "vinxi/http";
import { z } from "zod";
import { SupabaseUnconfiguredError } from "./supabase";

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
});

export function getSSRClient() {
  const env = EnvSchema.safeParse({
    VITE_SUPABASE_URL: process.env["VITE_SUPABASE_URL"],
    VITE_SUPABASE_ANON_KEY: process.env["VITE_SUPABASE_ANON_KEY"],
  });

  if (!env.success) {
    throw new SupabaseUnconfiguredError("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  return createServerClient(env.data.VITE_SUPABASE_URL, env.data.VITE_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const cookies = parseCookies();
        return Object.keys(cookies).map((name) => ({
          name,
          value: cookies[name]!,
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, {
            ...options,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        });
      },
    },
  });
}
