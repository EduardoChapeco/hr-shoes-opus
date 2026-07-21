import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/builder.functions.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /async function hydrateStoreProfileForNode\(db: ReturnType<typeof getServerClient>\): Promise<Record<string, any> \| null> \{/,
  'async function hydrateStoreProfileForNode(db: ReturnType<typeof getServerClient>, store_id: string): Promise<Record<string, any> | null> {'
);

content = content.replace(
  /\.from\("stores"\)\s*\.select\("name, slug, description, address, city, state, phone, email, settings"\)\s*\.limit\(1\)\s*\.single\(\);/,
  '.from("stores").select("name, slug, description, address, city, state, phone, email, settings").eq("id", store_id).single();'
);

content = content.replace(
  /async function hydrateBindings\(\r?\n\s*nodes: ExperienceNode\[\],\r?\n\s*db: ReturnType<typeof getServerClient>\r?\n\s*\): Promise<ExperienceNode\[\]> \{/,
  'async function hydrateBindings(\r?\n  nodes: ExperienceNode[],\r?\n  db: ReturnType<typeof getServerClient>,\r?\n  store_id: string\r?\n): Promise<ExperienceNode[]> {'
);

content = content.replace(
  /const storeProfileData = needsStoreProfile\s*\?\s*await hydrateStoreProfileForNode\(db\)\s*:\s*null;/,
  'const storeProfileData = needsStoreProfile ? await hydrateStoreProfileForNode(db, store_id) : null;'
);

content = content.replace(
  /const res = await getProductsByCollection\(\{ data: \{ slug: bindings\.collection_slug \} \}\)\.catch\(\(\) => null\);/,
  '// Use the exact store_id, bypass public resolveTenantStoreId to avoid spoofing issues in admin\r?\n          const { data: col } = await db.from("product_collections").select("id").eq("slug", bindings.collection_slug).eq("store_id", store_id).single();\r?\n          let res = null;\r?\n          if (col) {\r?\n            const { data } = await db.from("products").select("id, title, slug, price_cents, compare_at_cents, media:product_media(url, alt, sort_order)").eq("status", "active").eq("store_id", store_id).eq("collection_id", col.id).order("created_at", { ascending: false }).limit(12);\r?\n            if (data) res = { status: "ok", data };\r?\n          }'
);

content = content.replace(
  /\.from\("products"\)\s*\.select\("id, title, slug, price_cents, compare_at_cents, media:product_media\(url, alt, sort_order\)"\)\s*\.eq\("status", "active"\)\s*\.order\("created_at", \{ ascending: false \}\)\s*\.limit\(limit\);/,
  '.from("products").select("id, title, slug, price_cents, compare_at_cents, media:product_media(url, alt, sort_order)").eq("status", "active").eq("store_id", store_id).order("created_at", { ascending: false }).limit(limit);'
);

content = content.replace(
  /nodes = await hydrateBindings\(rawNodes, db\);/,
  'const { getServerIdentity } = await import("@/lib/identity");\r?\n          const { store_id } = await getServerIdentity();\r?\n          if (!store_id) throw new Error("No store found");\r?\n          nodes = await hydrateBindings(rawNodes, db, store_id);'
);

content = content.replace(
  /const hydratedNodes = await hydrateBindings\(nodes, db\);/,
  'const { resolveTenantStoreId } = await import("@/lib/tenant");\r?\n        const storeId = await resolveTenantStoreId();\r?\n        if (!storeId) throw new Error("Loja não encontrada");\r?\n        const hydratedNodes = await hydrateBindings(nodes, db, storeId);'
);

fs.writeFileSync(file, content, 'utf8');
console.log("builder.functions.ts updated");
