import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/routes/_store.produto.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const title = product\.seoTitle/g,
  'const title = product.metaTitle || product.seoTitle'
);

content = content.replace(
  /product\.seoDescription \|\|/g,
  'product.metaDescription || product.seoDescription ||'
);

content = content.replace(
  /\{review\.id\.slice\(0, 2\)\}/g,
  '{(review.reviewer_name || review.id).slice(0, 2)}'
);

content = content.replace(
  /<p className="font-semibold text-sm">UsuÃ¡rio Anonimo<\/p>/g,
  '<p className="font-semibold text-sm">{review.reviewer_name || "UsuÃ¡rio Anonimo"}</p>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Regex Replaced successfully!");
