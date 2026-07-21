import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/lib/builder-registry.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace `type: "text"` with `type: "collection_select"` for collection_slug fields
content = content.replace(
  /\{\s*name:\s*"collection_slug",\s*label:\s*"Slug da Coleção \(opcional para botão Ver Tudo\)",\s*type:\s*"text"\s*\}/g,
  '{ name: "collection_slug", label: "Coleção (opcional)", type: "collection_select" }'
);

content = content.replace(
  /\{\s*name:\s*"collection_slug",\s*label:\s*"Slug da Coleção \(opcional\)",\s*type:\s*"text"\s*\}/g,
  '{ name: "collection_slug", label: "Coleção (opcional)", type: "collection_select" }'
);

fs.writeFileSync(file, content, 'utf8');
console.log("builder-registry updated");
