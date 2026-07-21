import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/services/admin-catalog.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /export async function addProductMediaLinkHandler\(input: \{ product_id: string; url: string \}\) \{/,
  'export async function addProductMediaLinkHandler(input: { product_id: string; url: string; variant_id?: string | null }) {'
);

content = content.replace(
  /const \{ product_id, url \} = input;/,
  'const { product_id, url, variant_id } = input;'
);

content = content.replace(
  /product_id,\r?\n\s*url,\r?\n\s*sort_order: 99,/,
  'product_id,\n        url,\n        variant_id: variant_id || null,\n        sort_order: 99,'
);

content = content.replace(
  /z\.object\(\{ product_id: z\.string\(\)\.uuid\(\), url: z\.string\(\)\.url\(\) \}\)/,
  'z.object({ product_id: z.string().uuid(), url: z.string().url(), variant_id: z.string().uuid().optional().nullable() })'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("admin-catalog.functions.ts media link updated successfully!");
