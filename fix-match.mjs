import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/match-time.functions.ts');
let content = fs.readFileSync(file, 'utf8');

const adminLines = [342];
const publicLines = [19, 89, 148, 202, 239];

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  if (adminLines.includes(lineNum)) {
    lines[i] = `    const { getServerIdentity } = await import("@/lib/identity");\n    const { store_id } = await getServerIdentity();\n    if (!store_id) return { status: "error" as const, message: "Loja não encontrada." };\n    const store = { id: store_id };`;
  } else if (publicLines.includes(lineNum)) {
    const spaces = lines[i].match(/^\s*/)[0];
    lines[i] = `${spaces}const { resolveTenantStoreId } = await import("@/lib/tenant");\n${spaces}const storeId = await resolveTenantStoreId();\n${spaces}const store = storeId ? { id: storeId } : null;`;
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log("Match-time fixed!");
