import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testSignup() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }
  
  const supabase = createClient(url, key);
  
  const rand = Math.random().toString(36).substring(7);
  const email = `test_${rand}@example.com`;
  
  console.log("Signing up with:", email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  });
  
  if (error) {
    console.error("Signup error:", error.message, error.name, error.status);
  } else {
    console.log("Signup success:", data);
  }
}

testSignup();
