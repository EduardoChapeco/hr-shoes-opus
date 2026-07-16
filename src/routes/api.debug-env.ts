import { createFileRoute } from "@tanstack/react-router";
import { getEvent } from "vinxi/http";

export const Route = createFileRoute("/api/debug-env")({
  server: {
    handlers: {
      GET: async (args: any) => {
        const debug: any = {
          timestamp: new Date().toISOString(),
        };

        // 1. globalThis.__env__ (Nitro cloudflare-pages.mjs sets this per request)
        try {
          const gEnv = (globalThis as any).__env__;
          debug.globalEnv = {
            exists: !!gEnv,
            keys: gEnv ? Object.keys(gEnv) : [],
            hasSupabaseUrl: !!(gEnv?.VITE_SUPABASE_URL),
            hasAnonKey: !!(gEnv?.VITE_SUPABASE_ANON_KEY),
            hasServiceRole: !!(gEnv?.SUPABASE_SERVICE_ROLE_KEY),
            supabaseUrlPreview: gEnv?.VITE_SUPABASE_URL
              ? gEnv.VITE_SUPABASE_URL.slice(0, 30) + "..."
              : null,
          };
        } catch (e: any) {
          debug.globalEnvError = e.message;
        }

        // 2. Vinxi event context._platform.cloudflare.env
        try {
          const event = getEvent();
          const platform = (event?.context as any)?._platform;
          debug.platformEnv = {
            hasPlatform: !!platform,
            platformKeys: platform ? Object.keys(platform) : [],
            hasCfEnv: !!(platform?.cloudflare?.env),
            cfEnvKeys: platform?.cloudflare?.env
              ? Object.keys(platform.cloudflare.env)
              : [],
          };
        } catch (e: any) {
          debug.platformEnvError = e.message;
        }

        // 3. args.context._platform
        try {
          const ctxPlatform = args?.context?._platform;
          debug.argsContextPlatform = {
            exists: !!ctxPlatform,
            keys: ctxPlatform ? Object.keys(ctxPlatform) : [],
          };
        } catch (e: any) {
          debug.argsContextPlatformError = e.message;
        }

        // 4. process.env
        try {
          debug.processEnv = {
            keys: Object.keys(process.env ?? {}),
            hasSupabaseUrl: !!process.env?.VITE_SUPABASE_URL,
          };
        } catch (e: any) {
          debug.processEnvError = e.message;
        }

        return new Response(JSON.stringify(debug, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
