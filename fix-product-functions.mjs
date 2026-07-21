import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/services/product.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /id, sku, status, price_override_cents,\r?\n\s*stock_on_hand, stock_reserved, attributes,/,
  'id, sku, status, price_override_cents,\n             stock_on_hand, stock_reserved, attributes, display_name,'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("product.functions.ts updated successfully!");
