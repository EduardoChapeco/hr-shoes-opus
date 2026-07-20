import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/storage.functions.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const \{ data: store \} = await supabase\.from\("stores"\)\.select\("id"\)\.limit\(1\)\.single\(\);/g,
  'const { getServerIdentity } = await import("@/lib/identity");\n        const { store_id } = await getServerIdentity();\n        const store = store_id ? { id: store_id } : null;'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Storage fixed!");
