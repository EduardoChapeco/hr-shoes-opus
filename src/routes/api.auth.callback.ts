import { createFileRoute } from "@tanstack/react-router";
import { readCookieFromRequest } from "@/lib/http-cookies";
import { normalizeInternalReturnPath } from "@/lib/return-path";
import { getSSRClient } from "@/lib/supabase-ssr.server";
import { mergeGuestCartLogic } from "@/services/cart-helpers";


export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const next = normalizeInternalReturnPath(url.searchParams.get("next"), "/conta");

        // Extract guest session token from headers BEFORE async bounds
        const guestSessionToken = readCookieFromRequest(request, "hr_shoes_guest_session");

        if (code) {
          const supabase = getSSRClient();
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session) {
            try {
              await mergeGuestCartLogic(
                data.session.user.id,
                data.session.access_token,
                guestSessionToken,
              );
            } catch (err) {
              console.error("Falha ao mesclar carrinho após OAuth (ignorado):", err);
            }

            return new Response(null, {
              status: 302,
              headers: { Location: next },
            }) as any;
          }
        }

        // Return the user to an error page with instructions
        return new Response(null, {
          status: 302,
          headers: { Location: "/entrar?error=auth-callback-failed" },
        }) as any;
      },
    },
  },
});
