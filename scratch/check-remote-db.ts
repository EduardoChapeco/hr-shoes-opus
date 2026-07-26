import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: docs, error: docError } = await supabase
    .from("experience_documents")
    .select("*, experience_versions(*, experience_nodes(*))");

  console.log("Documents:", JSON.stringify(docs, null, 2));
  console.error("Doc Error:", docError);

  const { data: stores, error: storeError } = await supabase
    .from("stores")
    .select("id, slug");

  console.log("Stores:", JSON.stringify(stores, null, 2));
}

check();
