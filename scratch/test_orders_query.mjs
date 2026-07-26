import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id, public_token, status, total_cents, created_at,
      order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents )
    `
    )
    .limit(1);

  if (error) {
    console.error("ERROR:", error.message);
    console.error(error.details, error.hint);
  } else {
    console.log("SUCCESS:", data);
  }
}

test();
