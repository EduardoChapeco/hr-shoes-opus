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
import { getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { SupabaseUnconfiguredError } from "./supabase";
import { getEnvVar } from "./env";

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
});

export function getSSRClient() {
  const env = EnvSchema.safeParse({
    VITE_SUPABASE_URL: getEnvVar("VITE_SUPABASE_URL"),
    VITE_SUPABASE_ANON_KEY: getEnvVar("VITE_SUPABASE_ANON_KEY"),
  });

  if (!env.success) {
    throw new SupabaseUnconfiguredError("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  return createServerClient(env.data.VITE_SUPABASE_URL, env.data.VITE_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const cookieHeader = getRequestHeader("cookie");
        if (!cookieHeader) return [];
        // Extract { name, value } from the raw cookie header string using regex/split or supabase's parser if imported.
        // Actually, we can use `getCookie` from @tanstack/react-start/server in a loop, but `getAll` expects all of them.
        // Let's implement a simple parser for getAll since it's just `name=value; ...`
        return cookieHeader.split(';').map(c => {
          const [name, ...rest] = c.split('=');
          return { name: name?.trim() || "", value: rest.join('=').trim() };
        }).filter(c => c.name);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, {
            ...options,
            // Ensure path defaults to / if not provided, just in case
            path: options?.path ?? "/",
          });
        });
      },
    },
  });
}
