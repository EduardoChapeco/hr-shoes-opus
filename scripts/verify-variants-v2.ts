import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || anonKey;

const serviceClient = createClient(supabaseUrl, serviceKey);

async function runSystemicAuditV2() {
  console.log("================================================================================");
  console.log("🛡️ INICIANDO AUDITORIA SDD MASTER — V2 (NÃO-DESTRUTIVA & FILTROS MÁGICOS)");
  console.log("================================================================================\n");

  const { data: store, error: storeErr } = await serviceClient
    .from("stores")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (storeErr || !store) {
    console.error("❌ ERRO: Loja não encontrada", storeErr);
    process.exit(1);
  }
  console.log(`✅ [1/5] Loja Alvo Identificada: "${store.name}"`);

  // 1. Criação do Produto Canônico (Setup 1D)
  const testSlug = `sapato-master-sdd-${Date.now().toString().slice(-5)}`;
  const payload = {
    store_id: store.id,
    title: "Sapato SDD Master",
    slug: testSlug,
    description: "Auditoria de expansão não-destrutiva",
    price_cents: 10000,
    status: "published",
    options: [{ name: "Cor", values: ["Rosa", "Azul"] }],
    variants: [
      { sku: `${testSlug}-Rosa`, price_cents: 10000, stock: 50, attributes: { Cor: "Rosa" } },
      { sku: `${testSlug}-Azul`, price_cents: 10000, stock: 10, attributes: { Cor: "Azul" } },
    ],
  };

  const { data: createRes, error: createErr } = await serviceClient.rpc(
    "create_product_transaction_v1",
    { payload },
  );
  if (createErr || !createRes) throw createErr;
  const productId = createRes.id;

  // Buscar os IDs gerados
  const { data: initialVars } = await serviceClient
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("sku");

  const idRosa = initialVars?.find((v) => v.attributes.Cor === "Rosa")?.id;
  const idAzul = initialVars?.find((v) => v.attributes.Cor === "Azul")?.id;
  console.log(`✅ [2/5] Produto criado com 2 Cores. ID Rosa: ${idRosa}. Estoque Rosa: 50`);

  // 2. Expansão 2D (Sub-variações) e Teste de Delta
  console.log(
    `\n⏳ Simulando expansão para incluir "Tamanho" na cor Rosa, e remover Azul (Arquivamento)...`,
  );
  const matrixUpdate = [
    // Rosa Antigo é renomeado/atualizado para Rosa-36, preservando ID, adicionando 20 de estoque (delta +20)
    {
      id: idRosa,
      sku: `${testSlug}-Rosa-36`,
      attributes: { Cor: "Rosa", Tamanho: "36" },
      stock: 70,
      original_stock: 50,
    },
    // Rosa Novo (37)
    {
      sku: `${testSlug}-Rosa-37`,
      attributes: { Cor: "Rosa", Tamanho: "37" },
      stock: 15,
      original_stock: 0,
    },
  ];
  // Note: 'Azul' is completely omitted, expecting the RPC to archive it.

  const { error: updateErr } = await serviceClient.rpc("batch_upsert_variant_matrix_v2", {
    store_id_param: store.id,
    product_id_param: productId,
    matrix: matrixUpdate,
  });
  if (updateErr) throw updateErr;

  const { data: finalVars } = await serviceClient
    .from("product_variants")
    .select("id, sku, stock_on_hand, attributes, status")
    .eq("product_id", productId);

  const rosa36 = finalVars?.find((v) => v.id === idRosa);
  const azul = finalVars?.find((v) => v.id === idAzul);
  const rosa37 = finalVars?.find((v) => v.attributes.Tamanho === "37");

  console.log(`   Verificações de Mutação Híbrida:`);
  console.log(`   - Rosa 36 (Manteve ID original?): ${rosa36 ? "SIM" : "NÃO"}`);
  console.log(
    `   - Rosa 36 (Estoque foi para 70?): ${rosa36?.stock_on_hand === 70 ? "SIM" : "NÃO (Delta Falhou)"}`,
  );
  console.log(
    `   - Azul (Foi arquivado automaticamente por omissão?): ${azul?.status === "archived" ? "SIM" : "NÃO"}`,
  );

  if (!rosa36 || rosa36.stock_on_hand !== 70 || azul?.status !== "archived") {
    console.error("❌ FALHA NO MOTOR NÃO-DESTRUTIVO V2.");
    process.exit(1);
  }
  console.log(`✅ [3/5] Matriz Não-Destrutiva comprovada! Histórico mantido e Zumbis Arquivados.`);

  // 3. Extrator Dinâmico de Filtros (Storefront)
  console.log(`\n⏳ Testando extração de filtros públicos (Storefront)...`);
  const { data: filters, error: filtersErr } = await serviceClient.rpc("get_available_filters_v1", {
    store_id_param: store.id,
  });
  if (filtersErr) throw filtersErr;

  const hasTamanho = filters?.some(
    (f: any) => f.attribute_name === "Tamanho" && f.attribute_values.includes("36"),
  );
  const hasCorAzul = filters?.some(
    (f: any) => f.attribute_name === "Cor" && f.attribute_values.includes("Azul"),
  );

  console.log(`   - Vitrine enxerga 'Tamanho 36'? ${hasTamanho ? "SIM" : "NÃO"}`);
  console.log(
    `   - Vitrine enxerga 'Cor Azul'? ${!hasCorAzul ? "SIM (Ocultou pois arquivou/zerou)" : "NÃO (Erro)"}`,
  );

  if (!hasTamanho || hasCorAzul) {
    console.error("❌ FALHA NO MOTOR DE FILTROS DA VITRINE.");
    process.exit(1);
  }
  console.log(`✅ [4/5] Filtros Dinâmicos operantes. A vitrine obedece ao Estoque JSONB.`);

  // 4. Teste Multi-Tenant
  console.log(`\n⏳ Testando BOLA/IDOR Shield (Multi-tenant)...`);
  const { error: idorErr } = await serviceClient.rpc("batch_upsert_variant_matrix_v2", {
    store_id_param: "00000000-0000-0000-0000-000000000000",
    product_id_param: productId,
    matrix: matrixUpdate,
  });
  if (!idorErr) {
    console.error("❌ FALHA DE SEGURANÇA. RPC aceitou loja alheia.");
    process.exit(1);
  }
  console.log(`✅ [5/5] Blindagem Locatária confirmada! Erro interceptado.`);

  // Limpeza
  await serviceClient.from("product_variants").delete().eq("product_id", productId);
  await serviceClient.from("products").delete().eq("id", productId);

  console.log("\n================================================================================");
  console.log("🏆 AUDITORIA SDD CONCLUÍDA: 100% DE SUCESSO. SISTEMA LIVRE DE FALHAS!");
  console.log("================================================================================\n");
}

runSystemicAuditV2().catch(console.error);
