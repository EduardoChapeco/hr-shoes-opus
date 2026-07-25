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

async function testFetch() {
  const { data, error } = await supabase.rpc("get_function_signatures", {
    func_name: "process_checkout_atomic",
  });
  if (error) {
    console.error("RPC failed:", error);
    // Let's run raw SQL if RPC doesn't exist
  } else {
    console.log(data);
  }
}

testFetch().catch(console.error);
