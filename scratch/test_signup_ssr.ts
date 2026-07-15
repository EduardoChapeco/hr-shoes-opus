import { signUpWithPassword, getProfile } from "../src/services/auth.functions";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  console.log("Testing SSR signup function directly...");
  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `forensic_ssr_test_${randomSuffix}@example.com`;

  try {
    const result = await signUpWithPassword({
      data: {
        email,
        password: "Password123!",
        fullName: "Forensic SSR Test",
      }
    });

    console.log("Signup Result:", result);

    if (result.status === "success") {
      console.log("Signup succeeded! sessionActive:", result.sessionActive);
      
      // Try to fetch profile using getProfile
      // Note: getProfile expects getSSRClient which relies on cookies.
      // Running it in a Node script might not work out of the box because there are no cookies in this context,
      // but let's just see if it crashes.
      try {
        const profile = await getProfile();
        console.log("Profile Result:", profile);
      } catch (err: any) {
        console.log("getProfile predictably failed because we are not in a browser context (no cookies):", err.message);
      }
    }
  } catch (err: any) {
    console.error("Signup crashed completely:", err.message);
  }
}

run();
