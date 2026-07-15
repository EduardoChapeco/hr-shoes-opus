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
// @ts-ignore
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSSRClient } from "@/lib/supabase-ssr";
import { mergeGuestCartLogic } from "@/services/cart.functions";

export const APIRoute = createAPIFileRoute("/api/auth/confirm")({
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const token_hash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as "signup" | "recovery" | "email" | null;
    const next = url.searchParams.get("next") ?? "/conta";

    if (!token_hash || !type) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/entrar?error=link-invalido",
        },
      });
    }

    const supabase = getSSRClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      console.error("[auth/confirm] verifyOtp error:", error.message);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/entrar?error=${encodeURIComponent(error.message)}`,
        },
      });
    }

    // Success — get the newly created session and merge guest cart
    const supabaseAfter = getSSRClient();
    const { data: sessionData } = await supabaseAfter.auth.getSession();
    if (sessionData.session) {
      try {
        await mergeGuestCartLogic(sessionData.session.user.id, sessionData.session.access_token);
      } catch (err) {
        console.error("[auth/confirm] mergeGuestCart failed (non-fatal):", err);
      }
    }

    // Redirect the user to their intended destination.
    return new Response(null, {
      status: 302,
      headers: {
        Location: next,
      },
    });

  },
});
