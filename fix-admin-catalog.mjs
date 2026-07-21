import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/services/admin-catalog.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace 1: Handler arguments
content = content.replace(
  /length_cm\?: number \| null;\r?\n\s*attributes: Record<string, any>;/,
  'length_cm?: number | null;\n    display_name?: string | null;\n    attributes: Record<string, any>;'
);

// Replace 2: Zod validator
content = content.replace(
  /length_cm: z\.number\(\)\.min\(0\)\.optional\(\)\.nullable\(\),\r?\n\s*attributes: z\.record\(z\.any\(\)\)\.default\(\{\}\),/,
  'length_cm: z.number().min(0).optional().nullable(),\n        display_name: z.string().optional().nullable(),\n        attributes: z.record(z.any()).default({}),'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("admin-catalog.functions.ts updated successfully!");
