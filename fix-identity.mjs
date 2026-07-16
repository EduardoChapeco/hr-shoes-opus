import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim().replace(/^"|"$/g, '');
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim().replace(/^"|"$/g, '') 
                || envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim().replace(/^"|"$/g, '');

if (!supabaseUrl || !serviceKey) {
  console.error('Missing URL or Service Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixIdentity() {
  console.log('Running identity and bucket fix...');
  
  // 1. Get auth users
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Failed to list users. Are you using a SERVICE_ROLE key?', authErr);
    return;
  }
  
  const firstUser = authData.users[0];
  if (!firstUser) {
    console.error('No users found in auth.users. Please create a user in the UI first.');
    return;
  }
  
  console.log('Found user:', firstUser.email, firstUser.id);
  
  // 2. Check store
  let { data: storeData } = await supabase.from('stores').select('id').limit(1).single();
  let storeId = storeData?.id;
  
  if (!storeId) {
    console.log('No store found. Creating "Hr Shoes Oficial"...');
    const { data: newStore, error: storeErr } = await supabase.from('stores').insert({
      name: 'Hr Shoes Oficial',
      slug: 'hr-shoes'
    }).select().single();
    
    if (storeErr) {
      console.error('Failed to create store:', storeErr);
      return;
    }
    storeId = newStore.id;
  }
  console.log('Using Store ID:', storeId);
  
  // 3. Update profile
  const { error: profileErr } = await supabase.from('profiles').update({
    role: 'owner',
    store_id: storeId
  }).eq('id', firstUser.id);
  
  if (profileErr) {
    console.error('Failed to update profile:', profileErr);
  } else {
    console.log('Successfully updated user profile to owner of store.');
  }

  // 4. Create Buckets
  const buckets = ['cms-media', 'product-media'];
  for (const b of buckets) {
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(b, {
      public: true
    });
    if (bucketError) {
      if (bucketError.message.includes('already exists') || bucketError.message.includes('duplicate')) {
        console.log(`Bucket ${b} already exists. Updating to public...`);
        await supabase.storage.updateBucket(b, { public: true });
      } else {
        console.error(`Failed to create bucket ${b}:`, bucketError);
      }
    } else {
      console.log(`Created bucket ${b}`);
    }
  }

  console.log('Done!');
}

fixIdentity();
