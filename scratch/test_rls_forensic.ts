import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

// This script uses the ANON KEY to simulate what the real browser/SSR client does.
// This tests if RLS is actually the source of the problem.

async function run() {
  console.log("=== Forensic RLS Test (using ANON KEY) ===\n");

  // 1. Test signup with anon client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `forensic_anon_test_${randomSuffix}@gmail.com`;

  console.log(`1. Testing auth.signUp with anon key...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: "Password123!",
    options: {
      data: { full_name: "Forensic Anon Test" },
    },
  });

  if (signUpError) {
    console.error("❌ SIGNUP FAILED:", signUpError);
    process.exit(1);
  }

  console.log("✅ signUp returned:", {
    userId: signUpData.user?.id,
    email: signUpData.user?.email,
    sessionActive: !!signUpData.session,
    identityData: signUpData.user?.identities,
  });

  if (!signUpData.session) {
    console.log("\n⚠️  No session returned — email confirmation is required in this environment.");
    console.log("This means users will NOT be logged in after signup.");
    console.log("The frontend should redirect to /entrar with a toast about email confirmation.");
    return;
  }

  // 2. Test reading own profile with the user's access token
  const userId = signUpData.user?.id!;
  const accessToken = signUpData.session.access_token;

  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\n2. Testing SELECT from profiles (own record) via anon+JWT...`);
  const { data: profileData, error: profileError } = await authedClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("❌ PROFILE READ FAILED:", profileError.code, profileError.message);
    console.error("   This is the source of the 42P17 error or RLS block.");
  } else {
    console.log("✅ PROFILE READ SUCCESS:", profileData);
  }

  // 3. Test reading another user's profile (should be denied)
  const fakeOtherUserId = "00000000-0000-0000-0000-000000000001";
  console.log(`\n3. Testing SELECT from profiles (another user) — should be denied...`);
  const { data: otherProfileData, error: otherProfileError } = await authedClient
    .from("profiles")
    .select("id, role")
    .eq("id", fakeOtherUserId)
    .single();

  if (otherProfileError) {
    console.log(
      "✅ (Expected) Cross-user read denied:",
      otherProfileError.code,
      otherProfileError.message,
    );
  } else {
    console.error("❌ SECURITY VIOLATION: Cross-user read succeeded:", otherProfileData);
  }

  // 4. Test organizations read
  console.log(`\n4. Testing SELECT from organizations...`);
  const { data: orgData, error: orgError } = await authedClient
    .from("organizations")
    .select("id, name")
    .limit(3);

  if (orgError) {
    console.error("❌ ORG READ FAILED:", orgError.code, orgError.message);
  } else {
    console.log("✅ ORG READ SUCCESS:", orgData);
  }

  // 5. Test stores read
  console.log(`\n5. Testing SELECT from stores...`);
  const { data: storeData, error: storeError } = await authedClient
    .from("stores")
    .select("id, name")
    .limit(3);

  if (storeError) {
    console.error("❌ STORE READ FAILED:", storeError.code, storeError.message);
  } else {
    console.log("✅ STORE READ SUCCESS:", storeData);
  }

  // 6. Clean up: delete the test user via admin
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (serviceKey && userId) {
    const adminClient = createClient(supabaseUrl, serviceKey);
    await adminClient.auth.admin.deleteUser(userId);
    console.log("\n🧹 Cleaned up test user.");
  }
}

run().catch(console.error);
