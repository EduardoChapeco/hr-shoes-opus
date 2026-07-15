import { getServerClient } from "../src/lib/supabase";

async function run() {
  console.log("Testing Supabase connection...");
  try {
    const db = getServerClient();
    
    // Test basic connection by fetching stores
    console.log("Fetching stores...");
    const { data: stores, error: storeErr } = await db.from("stores").select("*");
    if (storeErr) {
      console.error("Store error:", storeErr);
    } else {
      console.log(`Successfully fetched ${stores?.length || 0} stores:`, stores);
    }

    // Fetch profiles count
    console.log("Fetching profiles...");
    const { data: profiles, error: profileErr } = await db.from("profiles").select("*");
    if (profileErr) {
      console.error("Profile error:", profileErr);
    } else {
      console.log(`Successfully fetched ${profiles?.length || 0} profiles:`, profiles);
    }

    // Test signing up a new user using admin.createUser
    console.log("Testing auth.admin.createUser...");
    const testEmail = `test_admin_${Date.now()}@hrshoestest.com`;
    const { data: signUpData, error: signUpError } = await db.auth.admin.createUser({
      email: testEmail,
      password: "testpassword123",
      email_confirm: true,
      user_metadata: {
        full_name: "Test Admin User " + Date.now(),
      },
    });

    if (signUpError) {
      console.error("Admin Sign up error:", signUpError);
    } else {
      console.log("Admin Sign up succeeded! User details:", {
        id: signUpData.user?.id,
        email: signUpData.user?.email,
        confirmed: signUpData.user?.email_confirmed_at,
      });

      // Verify if profiles row was created by trigger
      if (signUpData.user) {
        console.log("Verifying profiles entry for user:", signUpData.user.id);
        const { data: profile, error: profileFetchErr } = await db
          .from("profiles")
          .select("*")
          .eq("id", signUpData.user.id)
          .maybeSingle();

        if (profileFetchErr) {
          console.error("Error fetching created profile:", profileFetchErr);
        } else {
          console.log("Created profile row:", profile);
        }
      }
    }

    // Fetch auth users
    console.log("Fetching auth users...");
    const { data: authUsers, error: authUsersErr } = await db.auth.admin.listUsers();
    if (authUsersErr) {
      console.error("Auth users error:", authUsersErr);
    } else {
      console.log(`Successfully fetched ${authUsers?.users?.length || 0} users from auth.users:`);
      authUsers?.users?.forEach((u: any) => {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Confirmed: ${u.email_confirmed_at}`);
      });
    }

  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
