/**
 * Reset Owner Setup — Hr Shoes Commerce
 *
 * This script:
 * 1. Lists all current users and profiles
 * 2. Deletes test/fake users (non-real emails)
 * 3. Resets system_flags.setup_status to false
 *    so the next real signup via the form becomes the owner
 *
 * SAFE: Does not delete organizations or stores.
 * SAFE: Does not modify real user accounts (with real emails).
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log("=== Owner Setup Reset ===\n");

  // 1. List all current users
  console.log("1. Current auth.users:");
  const { data: users } = await adminClient.auth.admin.listUsers();
  users?.users.forEach((u) => {
    console.log(`   [${u.id}] ${u.email} | confirmed: ${!!u.email_confirmed_at} | created: ${u.created_at}`);
  });

  // 2. List all profiles
  console.log("\n2. Current profiles:");
  const { data: profiles } = await adminClient.from("profiles").select("*");
  profiles?.forEach((p) => {
    console.log(`   [${p.id}] role: ${p.role} | org: ${p.organization_id} | store: ${p.store_id}`);
  });

  // 3. List system_flags
  console.log("\n3. Current system_flags:");
  const { data: flags } = await adminClient.from("system_flags").select("*");
  console.log(JSON.stringify(flags, null, 2));

  // 4. Identify test users to delete (fake emails used during forensic testing)
  const testEmailPatterns = ["forensic_", "phase", "test_"];
  const testUsers = users?.users.filter((u) =>
    testEmailPatterns.some((pattern) => u.email?.includes(pattern))
  ) || [];

  console.log(`\n4. Test users to delete (${testUsers.length}):`);
  testUsers.forEach((u) => console.log(`   - ${u.email}`));

  if (testUsers.length === 0) {
    console.log("   No test users found.");
  } else {
    const readline = await import("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    await new Promise<void>((resolve) => {
      rl.question("\nDelete these test users and reset setup_status? (yes/no): ", async (answer) => {
        if (answer.toLowerCase() === "yes") {
          // Delete test users
          for (const u of testUsers) {
            const { error } = await adminClient.auth.admin.deleteUser(u.id);
            if (error) {
              console.error(`   ❌ Failed to delete ${u.email}:`, error.message);
            } else {
              console.log(`   ✅ Deleted: ${u.email}`);
            }
          }

          // Reset setup_status to false
          const { error: flagError } = await adminClient
            .from("system_flags")
            .update({ value: { is_completed: false }, updated_at: new Date().toISOString() })
            .eq("key", "setup_status");

          if (flagError) {
            console.error("   ❌ Failed to reset setup_status:", flagError.message);
          } else {
            console.log("\n   ✅ system_flags.setup_status reset to { is_completed: false }");
            console.log("   The next user to sign up via the form will become the owner.");
          }
        } else {
          console.log("   Aborted. No changes made.");
        }
        rl.close();
        resolve();
      });
    });
  }

  // 5. Final state
  console.log("\n5. Final state:");
  const { data: finalFlags } = await adminClient.from("system_flags").select("*");
  console.log("   system_flags:", JSON.stringify(finalFlags, null, 2));
  const { data: finalProfiles } = await adminClient.from("profiles").select("id, role");
  console.log("   profiles:", finalProfiles);
}

run().catch(console.error);
