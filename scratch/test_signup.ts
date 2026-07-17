import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Testing user creation via admin API to capture trigger errors...");
  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `forensic_admin_test_${randomSuffix}@example.com`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "Password123!",
    email_confirm: true,
    user_metadata: {
      full_name: "Forensic Admin Test",
    },
  });

  if (error) {
    console.error("\n❌ CREATE USER FAILED:");
    console.error("Error Message:", error.message);
    console.error("Error Details:", error);
  } else {
    console.log("\n✅ CREATE USER SUCCESS:");
    console.log(data.user?.id, data.user?.email);

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user?.id)
      .single();

    if (profileError) {
      console.error("\n❌ PROFILE QUERY FAILED:");
      console.error(profileError);
    } else {
      console.log("\n✅ PROFILE CREATED SUCCESSFULLY:");
      console.log(profile);
    }
  }
}

run();
