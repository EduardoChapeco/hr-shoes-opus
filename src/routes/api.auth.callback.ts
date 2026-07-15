import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSSRClient } from "@/lib/supabase-ssr";
import { mergeGuestCart } from "@/services/cart.functions";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") ?? "/conta";

    // Extract guest session token from headers BEFORE async bounds
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/hr_shoes_guest_session=([^;]+)/);
    const guestSessionToken = match ? match[1] : null;

    if (code) {
      const supabase = getSSRClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.session) {
        try {
          await mergeGuestCart({
            data: {
              customerId: data.session.user.id,
              accessToken: data.session.access_token,
              guestSessionToken: guestSessionToken,
            },
          });
        } catch (err) {
          console.error("Falha ao mesclar carrinho após OAuth (ignorado):", err);
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: next,
          },
        });
      }
    }

    // Return the user to an error page with instructions
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/entrar?error=auth-callback-failed",
      },
    });
  },
});
