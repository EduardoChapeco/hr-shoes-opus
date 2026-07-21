import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/routes/_store.produto.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the Product Title area to show active variant displayName if available
const targetHTML = `<h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1 font-heading leading-tight tracking-tight">
              {product.title}
            </h1>`;

const replaceHTML = `<h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1 font-heading leading-tight tracking-tight">
              {product.title}
            </h1>
            {activeVariant?.displayName && (
              <h2 className="text-lg font-medium text-muted-foreground mb-2">
                {activeVariant.displayName}
              </h2>
            )}`;

content = content.replace(targetHTML, replaceHTML);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Storefront UI updated with displayName!");
