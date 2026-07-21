import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/types/catalog.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /export interface VariantDTO \{\r?\n\s*id: string;/,
  'export interface VariantDTO {\n  id: string;\n  displayName?: string | null;'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("catalog.ts updated successfully!");
