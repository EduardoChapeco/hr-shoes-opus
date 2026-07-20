import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/customer.functions.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const \{ data: store \} = await ssrClient\.from\("stores"\)\.select\("id"\)\.limit\(1\)\.single\(\);/g,
  'const { resolveTenantStoreId } = await import("@/lib/tenant");\n    const storeId = await resolveTenantStoreId();\n    const store = storeId ? { id: storeId } : null;'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Customer fixed!");
