import * as fs from 'fs';
import * as path from 'path';

const filesToFix = [
  'src/routes/admin.fretes.index.tsx',
  'src/routes/admin.fretes.tabelas.tsx',
  'src/routes/admin.index.tsx',
  'src/routes/admin.marketing.cupons.tsx',
  'src/routes/admin.marketing.feed.tsx',
  'src/routes/admin.marketing.notificacoes.tsx',
  'src/routes/admin.marketing.ofertas-checkout.tsx',
  'src/routes/admin.midias.tsx',
  'src/routes/admin.pedidos.$id.tsx',
];

filesToFix.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Handle: if (res.status === "error") throw new Error(res.message); return res.data;
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.status\s*===\s*["']error["']\s*\)\s*throw\s*new\s*Error\([^)]+\);\s*return\s*\1\.data;/g, 'return $1;');
  
  // Handle: if (res.status === "error") throw new Error(res.message);
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.status\s*===\s*["']error["']\s*\)\s*throw\s*new\s*Error\([^)]+\);/g, '');

  // Handle: if (res.status === "success") { return res.data; }
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.status\s*===\s*["']success["']\s*\)\s*\{\s*return\s*\1\.data;\s*\}/g, 'return $1;');

  // res.data -> res (when it's array)
  content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*(?:Route\.)?useLoaderData\(\)/g, 'const $1_res = Route.useLoaderData()');
  // but wait, if I just replace `res.data` with `res` it might break other things. Let's specifically target the loader.
  content = content.replace(/loader:\s*async\s*\(\)\s*=>\s*\{\s*(?:const|let)\s+([a-zA-Z0-9_]+)\s*=\s*await\s+([a-zA-Z0-9_]+)\([^)]*\);\s*return\s+\1\.data;\s*\}/g, 'loader: async () => await $2()');

  // fallback for the common pattern:
  content = content.replace(/const\s+res\s*=\s*await\s+([a-zA-Z0-9_]+)\([^)]*\);\s*if\s*\(res\.status\s*===\s*["']error["']\)\s*throw\s+new\s+Error\(res\.message\);\s*return\s+res\.data;/g, 'return await $1();');

  content = content.replace(/res\.data/g, 'res');
  content = content.replace(/res\.status\s*===\s*["'](?:error|success)["']/g, 'false');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Fixed', relPath);
});
