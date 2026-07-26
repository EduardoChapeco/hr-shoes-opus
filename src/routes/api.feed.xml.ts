import { createFileRoute } from "@tanstack/react-router";
import { getServerClient } from "@/lib/supabase";

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
    return c;
  });
}

export const Route = createFileRoute("/api/feed/xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const db = getServerClient();
          const url = new URL(request.url);
          let storeId = url.searchParams.get("store");

          if (!storeId) {
            const { resolveTenantStoreId } = await import("@/lib/tenant");
            storeId = await resolveTenantStoreId();
          }

          if (!storeId) {
            return new Response("Missing store parameter", { status: 400 });
          }

          // Fetch store info for the feed title
          const { data: store } = await db
            .from("stores")
            .select("name")
            .eq("id", storeId)
            .single();
          const { data: products, error } = await db
            .from("products")
            .select(
              `
              id, slug, title, short_description, description, manufacturer, price_cents, compare_at_cents, status,
              product_variants(id, sku, price_cents, price_override_cents, attributes, stock_on_hand),
              product_media(url, is_thumbnail)
            `,
            )
            .eq("store_id", storeId)
            .eq("status", "published");

          if (error) {
            console.error("Feed XML Error:", error);
            return new Response("Error fetching catalog", { status: 500 });
          }

          const storeName = store?.name || "Hr Shoes Commerce";

          // Generate RSS XML (Google Merchant / Facebook Catalog compatible)
          let xml = `<?xml version="1.0"?>\n`;
          xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
          xml += `<channel>\n`;
          xml += `<title>${escapeXml(storeName)} — Catálogo</title>\n`;
          xml += `<link>${url.origin}</link>\n`;
          xml += `<description>Feed de Produtos — ${escapeXml(storeName)}</description>\n`;

          for (const p of products) {
            // For simple products or configurable ones, we export variants as items
            const variants = p.product_variants || [];
            const medias = p.product_media || [];

            const thumb = medias.find((m: any) => m.is_thumbnail)?.url || medias[0]?.url || "";
            const additionalImages = medias.filter((m: any) => m.url !== thumb).slice(0, 10);

            if (variants.length === 0) {
              // Fallback to parent product if no variants exist
              variants.push({
                id: p.id,
                sku: p.slug,
                price_cents: p.price_cents,
                price_override_cents: null,
                stock_on_hand: 1, // Assume available if published and no variant tracking
                attributes: {},
              });
            }

            for (const v of variants) {
              // Use variant price_override_cents if available, fallback to product price
              const effectivePriceCents = v.price_override_cents ?? v.price_cents ?? p.price_cents;
              const priceBrl = (effectivePriceCents / 100).toFixed(2);
              const salePriceBrl =
                p.compare_at_cents && p.compare_at_cents > effectivePriceCents ? priceBrl : undefined;
              const regularPriceBrl = salePriceBrl
                ? (p.compare_at_cents / 100).toFixed(2)
                : priceBrl;

              const link = `${url.origin}/produtos/${p.slug}?v=${v.sku || v.id}`;

              const titleExt = Object.values(v.attributes || {}).join(" - ");
              const itemTitle = titleExt ? `${p.title} - ${titleExt}` : p.title;
              const mpn = v.sku || `${p.slug}-${v.id.substring(0, 8)}`;

              xml += `<item>\n`;
              xml += `  <g:id>${escapeXml(v.sku || v.id)}</g:id>\n`;
              xml += `  <g:item_group_id>${escapeXml(p.id)}</g:item_group_id>\n`;
              xml += `  <g:title>${escapeXml(itemTitle)}</g:title>\n`;
              xml += `  <g:description>${escapeXml(p.short_description || p.description || itemTitle)}</g:description>\n`;
              xml += `  <g:link>${escapeXml(link)}</g:link>\n`;
              if (thumb) {
                xml += `  <g:image_link>${escapeXml(thumb)}</g:image_link>\n`;
              }
              for (const img of additionalImages) {
                xml += `  <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>\n`;
              }
              xml += `  <g:condition>new</g:condition>\n`;

              const availableQty = v.stock_on_hand || 0;
              xml += `  <g:availability>${availableQty > 0 ? "in stock" : "out of stock"}</g:availability>\n`;
              xml += `  <g:price>${regularPriceBrl} BRL</g:price>\n`;
              if (salePriceBrl) {
                xml += `  <g:sale_price>${salePriceBrl} BRL</g:sale_price>\n`;
              }
              xml += `  <g:brand>${escapeXml(p.manufacturer || "Hr Shoes")}</g:brand>\n`;
              xml += `  <g:mpn>${escapeXml(mpn)}</g:mpn>\n`;
              xml += `  <g:identifier_exists>false</g:identifier_exists>\n`;
              xml += `  <g:google_product_category>Apparel &amp; Accessories &gt; Shoes</g:google_product_category>\n`;
              xml += `  <g:product_type>Calçados</g:product_type>\n`;

              if (v.attributes && typeof v.attributes === "object") {
                const attrs = v.attributes as Record<string, string>;

                // Dynamic size detection — supports multiple naming conventions
                const sizeKeys = ["tamanho", "size", "taille", "numero", "número", "tam"];
                const sizeKey = Object.keys(attrs).find((k) =>
                  sizeKeys.includes(k.toLowerCase()),
                );
                if (sizeKey && attrs[sizeKey]) {
                  xml += `  <g:size>${escapeXml(attrs[sizeKey])}</g:size>\n`;
                  xml += `  <g:size_system>BR</g:size_system>\n`;
                }

                // Dynamic color detection
                const colorKeys = ["cor", "color", "colour", "couleur"];
                const colorKey = Object.keys(attrs).find((k) =>
                  colorKeys.includes(k.toLowerCase()),
                );
                if (colorKey && attrs[colorKey]) {
                  xml += `  <g:color>${escapeXml(attrs[colorKey])}</g:color>\n`;
                }

                // Dynamic material detection
                const materialKeys = ["material", "tecido", "fabric"];
                const materialKey = Object.keys(attrs).find((k) =>
                  materialKeys.includes(k.toLowerCase()),
                );
                if (materialKey && attrs[materialKey]) {
                  xml += `  <g:material>${escapeXml(attrs[materialKey])}</g:material>\n`;
                }
              }

              xml += `</item>\n`;
            }
          }

          xml += `</channel>\n`;
          xml += `</rss>`;

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (e: any) {
          console.error("Feed XML Exception:", e);
          return new Response("Internal Server Error", { status: 500 });
        }
      },
    },
  },
});
