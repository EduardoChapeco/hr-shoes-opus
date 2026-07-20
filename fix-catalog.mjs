import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/catalog.functions.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace the bad return null
content = content.replace(/if \(!storeId\) return null;\s*const store = \{ id: storeId \};\s*if \(!store\) \{/g, 'const store = { id: storeId };\n      if (!storeId) {');

fs.writeFileSync(file, content, 'utf8');
console.log("Fixed catalog null returns!");
