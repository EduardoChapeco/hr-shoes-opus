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
import { getEnvVar } from "./env";

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
});

export function getSSRClient(request?: Request, responseHeaders?: Headers) {
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
        if (request) {
          const cookieHeader = request.headers.get("cookie");
          if (!cookieHeader) return [];
          return cookieHeader.split(";").map((c) => {
            const [name, ...rest] = c.split("=");
            return { name: name.trim(), value: rest.join("=").trim() };
          });
        }
        
        // Fallback to vinxi for places that don't pass request
        try {
          const cookies = parseCookies();
          return Object.keys(cookies).map((name) => ({
            name,
            value: cookies[name]!,
          }));
        } catch(e) {
          return [];
        }
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          if (responseHeaders) {
            let cookieStr = `${name}=${encodeURIComponent(value)}`;
            if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
            if (options.domain) cookieStr += `; Domain=${options.domain}`;
            if (options.path) cookieStr += `; Path=${options.path}`;
            if (options.expires) cookieStr += `; Expires=${options.expires.toUTCString()}`;
            if (options.httpOnly) cookieStr += `; HttpOnly`;
            if (process.env.NODE_ENV === "production" || options.secure) cookieStr += `; Secure`;
            if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;

            responseHeaders.append("Set-Cookie", cookieStr);
          } else {
            // Fallback to vinxi
            try {
              setCookie(name, value, {
                ...options,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              });
            } catch(e) {
              console.error("Failed to set cookie in fallback mode:", e);
            }
          }
        });
      },
    },
  });
}
