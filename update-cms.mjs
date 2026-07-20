import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/cms.functions.ts');
let content = fs.readFileSync(file, 'utf8');

const adminLines = [82, 300, 357, 536, 562, 594];
const publicLines = [185, 252, 326, 492, 642];
// 668 has a slightly different pattern: `const { data: store }`

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  if (adminLines.includes(lineNum)) {
    lines[i] = `      const { getServerIdentity } = await import("@/lib/identity");\n      const { store_id } = await getServerIdentity();\n      if (!store_id) throw new Error("No store found");\n      const storeData = { id: store_id };`;
  } else if (publicLines.includes(lineNum)) {
    lines[i] = `      const { resolveTenantStoreId } = await import("@/lib/tenant");\n      const storeId = await resolveTenantStoreId();\n      const storeData = storeId ? { id: storeId } : null;`;
  } else if (lineNum === 668) {
    lines[i] = `      const { resolveTenantStoreId } = await import("@/lib/tenant");\n      const storeId = await resolveTenantStoreId();\n      const store = storeId ? { id: storeId } : null;`;
  }
}

// Fix missing imports or broken syntax if needed, but our dynamic imports are safe.
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log("Replaced successfully!");
