/**
 * Forensic Phase 2 — Complete flow simulation using admin API to confirm email
 * then testing profile reads with user's JWT to check RLS without email confirmation blockage
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

async function run() {
  console.log("=== Phase 2: Full flow simulation ===\n");

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `forensic_phase2_${randomSuffix}@gmail.com`;
  const password = "Password123!";

  // Step 1: Create user with email_confirm: true (simulates confirmed user)
  console.log("1. Creating user via admin (email_confirm: true)...");
  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Phase2 Forensic Test" },
  });

  if (createError || !createData.user) {
    console.error("❌ Admin createUser FAILED:", createError);
    process.exit(1);
  }

  const userId = createData.user.id;
  console.log("✅ User created:", userId, email);

  // Step 2: Check if profile was created by trigger
  console.log("\n2. Checking if trigger created the profile (via admin/service_role)...");
  const { data: profileAdmin, error: profileAdminError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileAdminError) {
    console.error(
      "❌ PROFILE NOT CREATED by trigger:",
      profileAdminError.code,
      profileAdminError.message,
    );
    console.error("   This means the trigger failed silently during user creation.");
  } else {
    console.log("✅ Profile created by trigger:", profileAdmin);
  }

  // Step 3: Sign in as this user to get JWT
  console.log("\n3. Signing in to get user JWT...");
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    console.error("❌ Sign in FAILED:", signInError);
    await adminClient.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  const accessToken = signInData.session.access_token;
  console.log("✅ Sign in success. Session:", {
    userId: signInData.user?.id,
    tokenPrefix: accessToken.substring(0, 20) + "...",
  });

  // Step 4: Read own profile with user JWT via anon key (simulates browser after login)
  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\n4. Reading own profile with user JWT (RLS test)...");
  const { data: ownProfile, error: ownProfileError } = await authedClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (ownProfileError) {
    console.error("❌ OWN PROFILE READ FAILED:", ownProfileError.code, ownProfileError.message);
    console.error("   This IS the 42P17 / RLS block that breaks the signup flow.");
  } else {
    console.log("✅ Own profile readable:", ownProfile);
  }

  // Step 5: Test system_flags read (needed by trigger)
  console.log("\n5. Reading system_flags (needed by trigger)...");
  const { data: flags, error: flagsError } = await authedClient
    .from("system_flags")
    .select("key, value")
    .limit(5);

  if (flagsError) {
    console.error("❌ system_flags READ FAILED:", flagsError.code, flagsError.message);
  } else {
    console.log("✅ system_flags:", flags);
  }

  // Step 6: Test organizations read
  console.log("\n6. Reading organizations (anon user)...");
  const { data: orgs, error: orgsError } = await authedClient
    .from("organizations")
    .select("id, name")
    .limit(3);

  if (orgsError) {
    console.error("❌ organizations READ FAILED:", orgsError.code, orgsError.message);
  } else {
    console.log("✅ organizations:", orgs);
  }

  // Step 7: Test stores read
  console.log("\n7. Reading stores (anon user)...");
  const { data: stores, error: storesError } = await authedClient
    .from("stores")
    .select("id, name")
    .limit(3);

  if (storesError) {
    console.error("❌ stores READ FAILED:", storesError.code, storesError.message);
  } else {
    console.log("✅ stores:", stores);
  }

  // Step 8: Test cross-user read (should be denied)
  const fakeId = "00000000-0000-0000-0000-000000000001";
  console.log("\n8. Cross-user profile read (should fail with RLS denial)...");
  const { data: crossProfile, error: crossError } = await authedClient
    .from("profiles")
    .select("id, role")
    .eq("id", fakeId)
    .single();

  if (crossError) {
    console.log("✅ (Expected) Cross-user read blocked:", crossError.code, crossError.message);
  } else {
    console.error("❌ SECURITY VIOLATION: Cross-user read succeeded:", crossProfile);
  }

  // Cleanup
  await adminClient.auth.admin.deleteUser(userId);
  console.log("\n🧹 Test user cleaned up.");
  console.log("\n=== SUMMARY ===");
}

run().catch(console.error);
