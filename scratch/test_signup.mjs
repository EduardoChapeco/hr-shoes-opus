import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing signup...");
  const { data, error } = await supabase.auth.signUp({
    email: "test.signup@example.com",
    password: "Password123!",
    options: {
      data: { full_name: "Test User", is_consent_lgpd: true }
    }
  });

  if (error) {
    console.error("Signup ERROR:", error.message);
  } else {
    console.log("Signup SUCCESS:", data.user?.id);
    
    // Check if profile was created
    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user?.id)
      .single();
      
    if (profError) {
      console.error("Profile fetch ERROR:", profError.message);
    } else {
      console.log("Profile created:", profile);
    }
  }
}

test();
