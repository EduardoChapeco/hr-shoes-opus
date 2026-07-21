import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/_store.produto.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { getProductBySlug } from "@/services/product.functions";`nimport { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";', 'import { getProductBySlug } from "@/services/product.functions";\nimport { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";');

fs.writeFileSync(file, content, 'utf8');
console.log("fixed import in product route");
