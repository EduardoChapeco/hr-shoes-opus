import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/services/admin-catalog.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove weight_grams from handler type signatures and zod validators (both products + variants)
content = content.replace(/\s*weight_grams\?: number \| null;\r?\n/g, '\n');
content = content.replace(/\s*weight_grams: z\.number\(\)\.int\(\)\.min\(0\)\.optional\(\)\.nullable\(\),\r?\n/g, '\n');
// Remove weight_grams from any update payload spreads
content = content.replace(/\s*weight_grams: .*\r?\n/g, '\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Removed weight_grams from admin-catalog.functions.ts successfully!");
