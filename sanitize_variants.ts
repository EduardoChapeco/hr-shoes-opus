import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runSanitization() {
  console.log("=== INICIANDO SANITIZAÇÃO DE VARIANTES ===\n");

  const { data: products, error: pError } = await supabase
    .from("products")
    .select(`
      id, title, status,
      product_variants (
        id, sku, attributes
      )
    `);

  if (pError) {
    console.error("Erro ao buscar produtos:", pError);
    return;
  }

  for (const product of products) {
    const variants = product.product_variants || [];
    if (variants.length === 0) continue;

    // Filter variants to keep
    const combinationsSeen = new Set<string>();
    const variantsToUpdate = [];
    const variantsToDelete = [];

    // First pass: identify empty variants if there are multiple
    const hasAttributes = variants.some(v => Object.keys(v.attributes || {}).length > 0);

    for (const v of variants) {
      const attrs = v.attributes || {};
      const keys = Object.keys(attrs);

      // If the product has structured variants, but this one is completely empty and there are others, delete it
      if (hasAttributes && keys.length === 0 && variants.length > 1) {
        console.log(`Marcando para deletar variante vazia [${v.sku}] do produto [${product.title}]`);
        variantsToDelete.push(v.id);
        continue;
      }

      // Sanitize keys (trim and fix capitalization if possible)
      // For now, just trim trailing/leading spaces.
      const cleanAttrs: Record<string, string> = {};
      keys.forEach(k => {
        const cleanKey = k.trim();
        cleanAttrs[cleanKey] = attrs[k];
      });

      // Check duplicates
      const comboStr = Object.keys(cleanAttrs).sort().map(k => `${k}=${cleanAttrs[k]}`).join("|");
      
      // If we already saw this combination, delete the duplicate
      if (combinationsSeen.has(comboStr)) {
        console.log(`Marcando para deletar variante duplicada [${v.sku}] (Combo: ${comboStr}) do produto [${product.title}]`);
        variantsToDelete.push(v.id);
      } else {
        combinationsSeen.add(comboStr);
        // Only update if attributes actually changed
        if (JSON.stringify(attrs) !== JSON.stringify(cleanAttrs)) {
          console.log(`Marcando para atualizar chaves da variante [${v.sku}] do produto [${product.title}]`);
          variantsToUpdate.push({ id: v.id, attributes: cleanAttrs });
        }
      }
    }

    // Execution
    for (const id of variantsToDelete) {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) console.error(`Erro ao deletar variante ${id}:`, error.message);
      else console.log(`Deletada variante ${id}`);
    }

    for (const v of variantsToUpdate) {
      const { error } = await supabase.from("product_variants").update({ attributes: v.attributes }).eq("id", v.id);
      if (error) console.error(`Erro ao atualizar variante ${v.id}:`, error.message);
      else console.log(`Atualizada variante ${v.id}`);
    }
  }

  console.log("\n=== SANITIZAÇÃO CONCLUÍDA ===");
}

runSanitization();
