import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBuilderRuntimeCore() {
  console.log("====================================================================");
  console.log("  VERIFICAÇÃO FORENSE DO BANCO REMOTO — MOTOR CANÔNICO DO BUILDER");
  console.log("====================================================================\n");

  console.log("1 [INVENTÁRIO DE DOCUMENTOS] Consultando tabela 'experience_documents' no Supabase...");
  const { data: docs, error: docErr } = await supabase
    .from("experience_documents")
    .select("id, store_id, title, slug, document_type, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (docErr) {
    console.error("❌ Erro ao consultar experience_documents:", docErr);
    return;
  }

  console.log(` -> Encontrados ${docs.length} documentos no motor canônico.`);
  docs.forEach((d) => {
    console.log(`   * [${d.document_type.toUpperCase()}] Slug: '${d.slug}' | Título: "${d.title}" | ID: ${d.id} | Ativo: ${d.is_active}`);
  });

  if (docs.length === 0) {
    console.log("⚠️ Nenhum documento experience_documents encontrado na base!");
  }

  console.log("\n2 [INVENTÁRIO DO CMS LEGADO] Consultando tabela legada 'pages' e 'page_sections'...");
  const { data: legacyPages, error: legErr } = await supabase
    .from("pages")
    .select("id, slug, title, status");

  if (legErr) {
    console.log(" -> Tabela 'pages' inexistente ou sem permissão (ou erro):", legErr.message);
  } else {
    console.log(` -> Encontrados ${legacyPages.length} registros no CMS legado ('pages'):`);
    legacyPages.forEach((lp) => {
      console.log(`   * [LEGADO] Slug: '${lp.slug}' | Título: "${lp.title}" | Status: ${lp.status}`);
    });
  }

  // 3. Avaliar ciclo de vida de Versões e Árvores de Nós para Documentos Principais (Home & Institucional)
  for (const doc of docs) {
    console.log(`\n--------------------------------------------------------------------`);
    console.log(`3 [AUDITORIA PROFUNDA] Analisando Documento: "${doc.title}" (${doc.document_type} -> /${doc.slug})`);
    
    const { data: versions, error: vErr } = await supabase
      .from("experience_versions")
      .select("id, version_number, status, created_at")
      .eq("document_id", doc.id)
      .order("version_number", { ascending: false });

    if (vErr) {
      console.error(`❌ Erro ao buscar versões para doc ${doc.id}:`, vErr);
      continue;
    }

    console.log(` -> Versões Registradas: ${versions.length}`);
    const publishedVersion = versions.find((v) => v.status === "published");
    const draftVersion = versions.find((v) => v.status === "draft");

    console.log(`    * Publicada: ${publishedVersion ? `Versão #${publishedVersion.version_number} (${publishedVersion.id})` : "⚠️ NENHUMA VERSÃO PUBLICADA"}`);
    console.log(`    * Rascunho atual: ${draftVersion ? `Versão #${draftVersion.version_number} (${draftVersion.id})` : "Nenhum rascunho independente"}`);

    const targetVersionId = publishedVersion?.id || draftVersion?.id || versions[0]?.id;
    if (!targetVersionId) {
      console.log("    -> Sem versões disponíveis para análise de nós.");
      continue;
    }

    const { data: nodes, error: nErr } = await supabase
      .from("experience_nodes")
      .select("id, parent_id, node_type, block_type, sort_order, content, data_bindings, layout_rules, design_tokens")
      .eq("version_id", targetVersionId)
      .order("sort_order", { ascending: true });

    if (nErr) {
      console.error("❌ Erro ao buscar nós (experience_nodes):", nErr);
      continue;
    }

    console.log(` -> Árvore DOM da Versão ${targetVersionId} contendo ${nodes.length} nós:`);
    const rootNodes = nodes.filter((n) => !n.parent_id);
    console.log(`    * Nós Raiz (Sections/Containers): ${rootNodes.length}`);

    nodes.forEach((n) => {
      const bindings = n.data_bindings && Object.keys(n.data_bindings).length > 0 ? `| Bindings: ${JSON.stringify(n.data_bindings)}` : "";
      console.log(`      -[${n.node_type}] Bloco: '${n.block_type}' (ID: ${n.id} | Pai: ${n.parent_id || 'RAIZ'}) ${bindings}`);
    });
  }

  console.log("\n====================================================================");
  console.log("  DIAGNÓSTICO CONCLUÍDO COM EXERCÍCIO COM BASE EM FATOS REAIS DO BANCO");
  console.log("====================================================================");
}

verifyBuilderRuntimeCore();
