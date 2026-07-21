import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/cms.functions.ts');
let content = fs.readFileSync(file, 'utf8');

// Add import if not exists
if (!content.includes('getSSRClient')) {
  content = content.replace(
    /import \{ getServerClient, SupabaseUnconfiguredError \} from "@\/lib\/supabase";/,
    'import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";\nimport { getSSRClient } from "@/lib/supabase-ssr.server";'
  );
}

// In the file, we can look for "await db.auth.getUser()" or "await ssrClient.auth.getUser()"
// And change their client initialization
// E.g. `const db = getServerClient();\n\n      const { data: { user }, error: authError } = await db.auth.getUser();`
content = content.replace(
  /const db = getServerClient\(\);\s*(.*?)\s*const \{ data: \{ user \}, error: authError \} = await db\.auth\.getUser\(\);/s,
  'const db = getSSRClient();\n      $1\n      const { data: { user }, error: authError } = await db.auth.getUser();'
);

content = content.replace(
  /const ssrClient = getServerClient\(\);\s*const \{ data: \{ user \} \} = await ssrClient\.auth\.getUser\(\);/g,
  'const ssrClient = getSSRClient();\n        const { data: { user } } = await ssrClient.auth.getUser();'
);

fs.writeFileSync(file, content, 'utf8');
console.log("cms.functions.ts fixed auth issues");
