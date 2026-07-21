import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runAudit() {
  console.log("=== INICIANDO AUDITORIA DE PRODUTOS E VARIANTES ===\n");

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

  let totalProducts = products.length;
  let totalVariants = 0;
  let productsWithIssues = 0;

  const issuesLog: any[] = [];

  for (const product of products) {
    const variants = product.product_variants || [];
    totalVariants += variants.length;

    const issues: string[] = [];

    // Keys tracking for this product
    const keySet = new Set<string>();
    const variantsCombinations = new Set<string>();

    for (const v of variants) {
      const attrs = v.attributes || {};
      const keys = Object.keys(attrs);

      // Issue: Empty attributes
      if (keys.length === 0 && variants.length > 1) {
        issues.push(`Variante [${v.sku}] não possui nenhum atributo, mas o produto tem múltiplas variantes.`);
      }

      // Check key names
      keys.forEach((key) => {
        keySet.add(key);
        // Issue: Keys with spaces at ends or "Chave: valor" inside the key
        if (key.trim() !== key) {
          issues.push(`Variante [${v.sku}] tem chave com espaços em branco invisíveis: "${key}"`);
        }
        if (key.includes(":")) {
          issues.push(`Variante [${v.sku}] tem chave suspeita com dois pontos (possível concatenação manual): "${key}"`);
        }
      });

      // Issue: Duplicate combinations
      // Sort keys to ensure deterministic combination strings
      const comboStr = keys.sort().map(k => `${k}=${attrs[k]}`).join("|");
      if (variantsCombinations.has(comboStr)) {
        issues.push(`Variante [${v.sku}] possui a mesma exata combinação de atributos que outra variante: "${comboStr}"`);
      } else {
        variantsCombinations.add(comboStr);
      }
    }

    // Check consistency of keys across variants
    const allKeysArr = Array.from(keySet);
    if (variants.length > 1) {
      for (const v of variants) {
        const keys = Object.keys(v.attributes || {});
        const missingKeys = allKeysArr.filter(k => !keys.includes(k));
        if (missingKeys.length > 0) {
          issues.push(`Variante [${v.sku}] não possui os atributos da matriz geral: faltando [${missingKeys.join(", ")}]`);
        }
      }
    }

    if (issues.length > 0) {
      productsWithIssues++;
      issuesLog.push({
        productId: product.id,
        title: product.title,
        status: product.status,
        issues: [...new Set(issues)] // dedupe
      });
    }
  }

  console.log(`Auditoria concluída em ${totalProducts} produtos e ${totalVariants} variantes.`);
  console.log(`Encontrados ${productsWithIssues} produtos com anomalias de dados na matriz de variação.\n`);
  
  if (productsWithIssues > 0) {
    console.log("=== RELATÓRIO DE INCONSISTÊNCIAS ===\n");
    issuesLog.forEach((log) => {
      console.log(`[PRODUTO]: ${log.title} (ID: ${log.productId}) [Status: ${log.status}]`);
      log.issues.forEach((iss: string) => console.log(`  - ${iss}`));
      console.log("");
    });
  } else {
    console.log("A matriz de atributos e variantes está limpa em todo o catálogo.");
  }
}

runAudit();
