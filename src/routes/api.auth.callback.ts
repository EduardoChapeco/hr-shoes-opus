import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getServerClient } from "@/lib/supabase";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") ?? "/conta";

    if (code) {
      const supabase = getServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
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
