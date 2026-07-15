/**
 * Cart helpers — shared identity + guest-cart merge logic.
 *
 * Kept OUTSIDE cart.functions.ts because TanStack's server-fn splitter
 * (?tss-serverfn-split) strips sibling declarations from `.functions.ts`
 * modules, breaking any other file that imports them.
 */

import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";
import { getOrCreateGuestSession } from "@/lib/session";

export async function getCurrentIdentity() {
  const ssrClient = getSSRClient();
  // Fetch or create guest session synchronously BEFORE any await
  // to keep the vinxi/http unctx context alive.
  const token = getOrCreateGuestSession();

  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (user) {
    return { customer_id: user.id, session_token: null };
  }

  return { customer_id: null, session_token: token };
}

export async function mergeGuestCartLogic(
  customerId: string,
  accessToken?: string,
  explicitGuestToken?: string | null,
) {
  let supabase;
  if (accessToken) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing env vars for Supabase");

    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  } else {
    supabase = getSSRClient();
  }

  let session_token = explicitGuestToken;
  if (session_token === undefined) {
    const identity = await getCurrentIdentity();
    session_token = identity.session_token;
  }

  if (!session_token) return { status: "success" as const };

  const { data: guestCart } = await supabase
    .from("carts")
    .select("id")
    .eq("session_token", session_token)
    .eq("status", "active")
    .maybeSingle();

  if (!guestCart) return { status: "success" as const };

  const { data: userCart } = await supabase
    .from("carts")
    .select("id")
    .eq("customer_id", customerId)
    .eq("status", "active")
    .maybeSingle();

  if (!userCart) {
    await supabase
      .from("carts")
      .update({ customer_id: customerId, session_token: null })
      .eq("id", guestCart.id);
  } else {
    const { data: guestItems } = await supabase
      .from("cart_items")
      .select("id, variant_id, qty")
      .eq("cart_id", guestCart.id);

    if (guestItems && guestItems.length > 0) {
      for (const item of guestItems) {
        const { data: existingUserItem } = await supabase
          .from("cart_items")
          .select("id, qty")
          .eq("cart_id", userCart.id)
          .eq("variant_id", item.variant_id)
          .maybeSingle();

        if (existingUserItem) {
          await supabase
            .from("cart_items")
            .update({ qty: existingUserItem.qty + item.qty })
            .eq("id", existingUserItem.id);
          await supabase.from("cart_items").delete().eq("id", item.id);
        } else {
          await supabase.from("cart_items").update({ cart_id: userCart.id }).eq("id", item.id);
        }

        await supabase
          .from("stock_reservations")
          .update({ cart_id: userCart.id })
          .eq("cart_id", guestCart.id)
          .eq("variant_id", item.variant_id);
      }
    }

    await supabase.from("carts").delete().eq("id", guestCart.id);
  }

  // Ensure getServerClient stays imported (used by callers via cart.functions).
  void getServerClient;

  return { status: "success" as const };
}
