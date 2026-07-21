import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/catalog.functions.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /const \{ data, error \} = await db\s*\.from\("stores"\)\s*\.select\("id, name, settings"\)\s*\.order\("created_at", \{ ascending: true \}\)\s*\.limit\(1\)\s*\.single\(\);/m;

const replacement = `const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      if (!storeId) {
        return {
          status: "unconfigured",
          reason: "Nenhuma loja configurada.",
        };
      }

      const { data, error } = await db
        .from("stores")
        .select("id, name, settings")
        .eq("id", storeId)
        .single();`;

content = content.replace(regex, replacement);

const logoRegex = /logoUrl: typeof settings\.logoUrl === "string" \? settings\.logoUrl : null,/;
const logoReplacement = `logoUrl: typeof settings.logoUrl === "string" ? settings.logoUrl : null,
        faviconUrl: typeof settings.faviconUrl === "string" ? settings.faviconUrl : null,`;

content = content.replace(logoRegex, logoReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated catalog.functions.ts");
