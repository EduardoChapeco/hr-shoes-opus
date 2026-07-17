/**
 * Forensic Phase 3 — Check Auth configuration: email confirmation settings,
 * and verify that login works correctly for a confirmed user.
 * Also check if the system_flags setup_status prevents owner assignment on new users.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log("=== Phase 3: Auth Config + Flow Verification ===\n");

  // 1. Check if setup_status is set correctly
  console.log("1. Checking system_flags...");
  const { data: flags } = await adminClient.from("system_flags").select("*");
  console.log("   system_flags:", JSON.stringify(flags, null, 2));

  // 2. Check how many profiles exist and their roles
  console.log("\n2. Checking profiles table (roles distribution)...");
  const { data: profiles, error: profErr } = await adminClient
    .from("profiles")
    .select("id, role, organization_id, store_id, created_at");
  if (profErr) {
    console.error("❌ profiles read failed:", profErr);
  } else {
    console.log(`   Total profiles: ${profiles?.length}`);
    const roleCounts: Record<string, number> = {};
    profiles?.forEach((p) => {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
    });
    console.log("   Role distribution:", roleCounts);
    const owners = profiles?.filter((p) => p.role === "owner");
    console.log("   Owners:", owners);
  }

  // 3. List recent auth users
  console.log("\n3. Checking recent auth.users...");
  const { data: users } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 10 });
  if (users?.users) {
    console.log(`   Total users: ${users.users.length}`);
    users.users.slice(0, 5).forEach((u) => {
      console.log(
        `   - ${u.email} | confirmed: ${!!u.email_confirmed_at} | created: ${u.created_at}`,
      );
    });
  }

  // 4. Simulate full flow: create confirmed user, login, fetch profile via getUserSession pattern
  console.log("\n4. Simulating: createUser(confirmed) → signInWithPassword → fetch profile...");
  const testEmail = `phase3_test_${Date.now()}@gmail.com`;

  const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { full_name: "Phase3 Test User" },
  });

  if (createErr || !newUser.user) {
    console.error("❌ createUser failed:", createErr);
    return;
  }
  console.log("   ✅ User created:", newUser.user.id);

  // 5. Login as this user
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: loginData, error: loginErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: "Password123!",
  });

  if (loginErr || !loginData.session) {
    console.error("❌ Login failed:", loginErr);
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return;
  }
  console.log("   ✅ Login success. Access token obtained.");

  // 6. Fetch profile using the SSR pattern (reading via anon key + JWT)
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${loginData.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileErr } = await userClient
    .from("profiles")
    .select("*")
    .eq("id", loginData.user?.id)
    .single();

  if (profileErr) {
    console.error("   ❌ Profile fetch FAILED:", profileErr.code, profileErr.message);
  } else {
    console.log("   ✅ Profile fetch SUCCESS:", profile);
  }

  // 7. Check if profile has correct role (should be 'customer' since setup_status is completed)
  const expectedRole = flags?.[0]?.value?.is_completed ? "customer" : "owner";
  console.log(`\n5. Role check: expected='${expectedRole}' actual='${profile?.role}'`);
  if (profile?.role === expectedRole) {
    console.log("   ✅ Role assignment is CORRECT.");
  } else {
    console.error(`   ❌ Role mismatch: expected '${expectedRole}' but got '${profile?.role}'`);
  }

  // Cleanup
  await adminClient.auth.admin.deleteUser(newUser.user.id);
  console.log("\n🧹 Test user cleaned up.");

  console.log("\n=== CONCLUSIONS ===");
  console.log("If all steps above passed, the DATABASE and RLS layer is WORKING CORRECTLY.");
  console.log(
    "The remaining question is: does the FRONTEND correctly handle the 'email confirmation required' flow?",
  );
  console.log("In Supabase, when email confirmation is required:");
  console.log("  - signUp returns user but NO session");
  console.log("  - User must confirm email to get a session");
  console.log("  - This is the current state of the project");
}

run().catch(console.error);
