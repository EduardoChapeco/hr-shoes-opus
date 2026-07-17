import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  console.log("Listing auth.users...");
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error.message);
  } else {
    console.log("Total users in auth.users:", data.users.length);
    for (const u of data.users) {
      console.log(`- ID: ${u.id}, Email: ${u.email}, CreatedAt: ${u.created_at}`);
    }
  }
}

main().catch(console.error);
