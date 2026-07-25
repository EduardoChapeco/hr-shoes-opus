import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetchCart() {
  // Try to find ANY active cart to see what fetchCartDTO does
  const { data: cartTest } = await supabase
    .from("carts")
    .select("id, session_token")
    .eq("status", "active")
    .limit(1)
    .single();

  if (!cartTest) {
    console.log("No active carts found.");
    return;
  }

  const identity = { customer_id: null, session_token: cartTest.session_token };

  let query = supabase
    .from("carts")
    .select(
      `
      id,
      status,
      coupon_code,
      discount_cents,
      shipping_cents,
      shipping_method,
      cart_items (
        id,
        variant_id,
        qty,
        product_variants (
          id,
          price_override_cents,
          compare_at_cents,
          stock_on_hand,
          stock_reserved,
          sku,
          attributes,
          product:products (
            id,
            title,
            slug,
            price_cents,
            product_media ( url )
          )
        )
      )
    `,
    )
    .eq("status", "active");

  query = query.eq("session_token", identity.session_token);

  const { data: cart, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Query Error:", error);
    return;
  }

  if (!cart) {
    console.log("Cart returned null from maybeSingle!");
    return;
  }

  console.log("Cart fetched successfully:", cart.id);

  try {
    const items = cart.cart_items.map((item) => {
      if (!item.product_variants) throw new Error("Missing variant for cart item " + item.id);
      if (!item.product_variants.product)
        throw new Error("Missing product for variant " + item.variant_id);
      return item;
    });
    console.log("Cart items mapped successfully. Count:", items.length);
  } catch (e) {
    console.error("Mapping Error:", e.message);
  }
}

testFetchCart().catch(console.error);
