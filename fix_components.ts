import * as fs from 'fs';
import * as path from 'path';

const filesToFix = [
  'src/routes/admin.fretes.cotacoes.tsx',
  'src/routes/admin.fretes.index.tsx',
  'src/routes/admin.fretes.tabelas.tsx',
  'src/routes/admin.index.tsx',
  'src/routes/admin.marketing.feed.tsx',
  'src/routes/admin.marketing.notificacoes.tsx',
  'src/routes/admin.pedidos.$id.tsx',
];

filesToFix.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Handle: loader: async () => { const res = await fn(); if(res.status==="error") throw new Error(res.message); return res.data; }
  content = content.replace(/loader:\s*async\s*\(\)\s*=>\s*\{\s*const\s+([a-zA-Z0-9_]+)\s*=\s*await\s+([a-zA-Z0-9_]+)\([^)]*\);\s*if\s*\(\1\.status\s*===\s*["']error["']\)\s*throw\s*new\s*Error\(\1\.message\);\s*(?:if\s*\(\1\.status\s*===\s*["']unconfigured["']\)\s*return\s*\[\];\s*)?return\s+\1\.data(?:\s*\|\|\s*\[\])?;\s*\}/g, 'loader: async () => await $2() || []');

  // fallback for simpler loader:
  content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*await\s+([a-zA-Z0-9_]+)\([^)]*\);\s*if\s*\(\1\.status\s*===\s*["']error["']\)\s*throw\s*new\s*Error\(\1\.message\);\s*return\s+\1\.data;/g, 'return await $2();');

  // Replace component useLoaderData calls: const res = Route.useLoaderData(); if (res.status==="error") ... -> const data = Route.useLoaderData();
  // Wait, loaders don't have .data anymore, so Route.useLoaderData() returns the raw data.
  // The error is `Property 'status' does not exist on type 'any[]'` which happens in component body.
  
  // Example: if (res.status === "error") throw new Error(res.message);
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.status\s*===\s*["']error["']\s*\)\s*throw\s*new\s*Error\([^)]+\);?/g, '');
  
  // Example: if (res.status === "error") { return <div>Error</div> }
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.status\s*===\s*["']error["']\s*\)\s*\{[^}]*\}/g, '');
  
  // Replace references to res.data with res where res is the loader data
  // Only target lines like: return res.data.map(...) -> return res.map(...)
  content = content.replace(/([a-zA-Z0-9_]+)\.data\.map/g, '$1.map');
  content = content.replace(/([a-zA-Z0-9_]+)\.data\.length/g, '$1.length');

  // Fix admin.index.tsx specific: res.data -> res
  content = content.replace(/result\.data\.salesTodayCents/g, 'result.salesTodayCents');
  content = content.replace(/result\.data\.salesMonthCents/g, 'result.salesMonthCents');
  content = content.replace(/result\.data\.ordersTodayCount/g, 'result.ordersTodayCount');
  content = content.replace(/result\.data\.ordersMonthCount/g, 'result.ordersMonthCount');
  content = content.replace(/result\.data\.setupProgressPercentage/g, 'result.setupProgressPercentage');

  // Fix admin.pedidos.$id.tsx specific:
  content = content.replace(/const\s+order\s*=\s*orderData\.data;/g, 'const order = orderData;');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Fixed component references', relPath);
});
