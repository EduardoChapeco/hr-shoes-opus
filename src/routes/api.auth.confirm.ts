/**
 * Email Confirmation Handler — Hr Shoes Commerce
 *
 * Supabase sends users a confirmation email with a link like:
 *   https://hrshoes.pages.dev/api/auth/confirm?token_hash=XXX&type=signup&next=/conta
 *
 * This route exchanges the token_hash for a session, sets the cookie,
 * and redirects the user to their destination.
 *
 * Without this route, email confirmation links would land on the app
 * without being processed — leaving users permanently stuck.
 */
import { createFileRoute } from "@tanstack/react-router";
import { readCookieFromRequest } from "@/lib/http-cookies";
import { normalizeInternalReturnPath } from "@/lib/return-path";
import { getSSRClient } from "@/lib/supabase-ssr.server";
import { mergeGuestCartLogic } from "@/services/cart-helpers";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";

export const Route = createFileRoute("/api/auth/confirm")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token_hash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type") as "signup" | "recovery" | "email" | null;
        const next = normalizeInternalReturnPath(url.searchParams.get("next"), "/conta");

        // Extract guest session token from headers BEFORE async bounds
        const guestSessionToken = readCookieFromRequest(request, "hr_shoes_guest_session");

        if (!token_hash || !type) {
          setResponseHeader("Location", "/entrar?error=link-invalido");
          setResponseStatus(302);
          return "";
        }

        const supabase = getSSRClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });

        if (error) {
          console.error("[auth/confirm] verifyOtp error:", error.message);
          setResponseHeader("Location", `/entrar?error=${encodeURIComponent(error.message)}`);
          setResponseStatus(302);
          return "";
        }

        // Success — get the newly created session and merge guest cart
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          try {
            await mergeGuestCartLogic(
              sessionData.session.user.id,
              sessionData.session.access_token,
              guestSessionToken,
            );
          } catch (err) {
            console.error("[auth/confirm] mergeGuestCart failed (non-fatal):", err);
          }
        }

        // Redirect the user to their intended destination.
        setResponseHeader("Location", next);
        setResponseStatus(302);
        return "";
      },
    },
  },
});
