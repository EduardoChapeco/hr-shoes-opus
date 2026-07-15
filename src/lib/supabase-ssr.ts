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
import { getRequest, getResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { SupabaseUnconfiguredError } from "./supabase";
import { getEnvVar } from "./env";
import { appendResponseCookie, readAllCookiesFromRequest } from "./http-cookies";

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
});

export function getSSRClient(
  request: Request = getRequest(),
  responseHeaders: { append(name: "Set-Cookie", value: string): void } = getResponseHeaders(),
) {
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
        return readAllCookiesFromRequest(request);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          appendResponseCookie(responseHeaders, name, value, options);
        });
      },
    },
  });
}
