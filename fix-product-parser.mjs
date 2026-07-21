import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/services/product.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /export interface VariantDTO \{\r?\n\s*id: string;/,
  'export interface VariantDTO {\n  id: string;\n  displayName?: string | null;'
);

content = content.replace(
  /attributes: v\.attributes as Record<string, string>,/,
  'attributes: v.attributes as Record<string, string>,\n            displayName: (v.display_name as string | null) ?? null,'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("product.functions.ts parser updated successfully!");
