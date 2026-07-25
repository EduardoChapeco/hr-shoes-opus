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
  const { data, error } = await supabase.from("product_variants").select("*").limit(1);
  console.log("product_variants columns:", Object.keys(data[0]));

  const { data: pData } = await supabase.from("products").select("*").limit(1);
  console.log("products columns:", Object.keys(pData[0]));
}

testFetchCart().catch(console.error);
