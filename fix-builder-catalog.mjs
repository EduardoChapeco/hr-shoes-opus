import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/builder.functions.ts');
let content = fs.readFileSync(file, 'utf8');

// Fix "active" to "published"
content = content.replace(/eq\("status", "active"\)/g, 'eq("status", "published")');

// Replace the product_collection mapping
const oldCollectionMapping = `            const { data } = await db.from("products").select("id, title, slug, price_cents, compare_at_cents, media:product_media(url, alt, sort_order)").eq("status", "published").eq("store_id", store_id).eq("collection_id", col.id).order("created_at", { ascending: false }).limit(12);
            if (data) res = { status: "ok", data };`;

const newCollectionMapping = `            const { data } = await db.from("products").select("id, title, slug, price_cents, compare_at_cents, media:product_media(url, alt, sort_order)").eq("status", "published").eq("store_id", store_id).eq("collection_id", col.id).order("created_at", { ascending: false }).limit(12);
            if (data) {
              const formatted = data.map((p: any) => {
                const sortedMedia = p.media ? [...p.media].sort((a: any, b: any) => a.sort_order - b.sort_order) : [];
                return {
                  id: p.id, title: p.title, slug: p.slug,
                  priceCents: p.price_cents, compareAtCents: p.compare_at_cents,
                  coverUrl: sortedMedia[0]?.url || null,
                  hoverUrl: sortedMedia[1]?.url || null,
                  isOutOfStock: false,
                };
              });
              res = { status: "ok", data: formatted };
            }`;

content = content.replace(oldCollectionMapping, newCollectionMapping);

fs.writeFileSync(file, content, 'utf8');
console.log("builder.functions.ts updated");
