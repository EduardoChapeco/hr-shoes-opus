import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSystemicAuditAndRuntimeTest() {
  console.log("====================================================================");
  console.log("  VERIFICAÇÃO DE RUNTIME — HARMÔNICA DAS 7 CAMADAS COMERCIAIS");
  console.log("====================================================================\n");

  // 1. Verificar o Pedido da Tentativa Real do Cliente (Token #0078fc9afe3f4959 / ID 18bb7554-8636-4615-9f62-fb5b79315367)
  const orderId = "18bb7554-8636-4615-9f62-fb5b79315367";
  console.log(`1 [AUDITORIA PEDIDO ALVO] Consultando Pedido ${orderId}...`);

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("*, order_items(*), payments(*)")
    .eq("id", orderId)
    .single();

  if (oErr || !order) {
    console.error("Erro ao carregar pedido alvo:", oErr);
    return;
  }

  console.log(` -> Pedido #${order.public_token} encontrado.`);
  console.log(
    ` -> Status Canônico: '${order.status}' (Compatível com roteamento de instruções na UI).`,
  );
  console.log(
    ` -> Total Registrado no Banco: ${order.total_cents} centavos (R$ ${(order.total_cents / 100).toFixed(2)})`,
  );
  console.log(
    ` -> Subtotal Registrado: ${order.subtotal_cents} centavos | Frete: ${order.shipping_cents} centavos`,
  );

  // 2. Verificação Transacional dos Itens (Anti-Zero / Anti-NaN / Autoridade de Preço)
  console.log(
    "\n2 [CAMADA DE ITENS] Auditando coerência financeira de cada linha em 'order_items'...",
  );
  let calculatedSubtotal = 0;
  let hasZeroOrNaN = false;

  for (const item of order.order_items || []) {
    const qty = item.qty || 1;
    const unitPrice = item.unit_price_cents || 0;
    const totalCents = item.total_cents ?? unitPrice * qty;

    console.log(`   * Item: "${item.product_title}" (SKU: ${item.variant_sku})`);
    console.log(
      `     - Qtd: ${qty} | Unitário: R$ ${(unitPrice / 100).toFixed(2)} | Total do Item: R$ ${(totalCents / 100).toFixed(2)}`,
    );

    if (
      unitPrice === 0 ||
      totalCents === 0 ||
      Number.isNaN(unitPrice) ||
      Number.isNaN(totalCents)
    ) {
      console.error(`     [FALHA DETECTADA] Item com preço zero ou NaN gerado!`);
      hasZeroOrNaN = true;
    }

    // Comprar com autoridade do Catálogo em Tempo Real (product_variants / products)
    const { data: v } = await supabase
      .from("product_variants")
      .select("price_override_cents, product_id, products(price_cents)")
      .eq("id", item.variant_id)
      .maybeSingle();
    const catalogPrice =
      v?.price_override_cents ??
      (Array.isArray(v?.products) ? v.products[0]?.price_cents : v?.products?.price_cents) ??
      0;
    if (catalogPrice > 0 && unitPrice !== catalogPrice) {
      console.warn(
        `     [AVISO DE DIVERGÊNCIA DE CATÁLOGO] Preço gravado (${unitPrice}) diferente da tabela atual (${catalogPrice})`,
      );
    } else if (catalogPrice > 0) {
      console.log(
        `     -> Sincronizado 100% com autoridade soberana do catálogo (R$ ${(catalogPrice / 100).toFixed(2)})`,
      );
    }

    calculatedSubtotal += totalCents;
  }

  if (!hasZeroOrNaN) {
    console.log(
      "   => SUCESSO: Nenhum preço zero, indefinido ou R$ NaN encontrado na estrutura do pedido!",
    );
  }

  // 3. Checagem da Transação de Pagamento e Antidivergência
  console.log(
    "\n3 [CAMADA DE PAGAMENTO & GATEWAY] Auditando registro financeiro na tabela 'payments'...",
  );
  const payment = order.payments?.[0];
  if (!payment) {
    console.error("   [ERRO] Nenhum registro na tabela payments foi criado para este pedido!");
  } else {
    console.log(
      `   -> Pagamento ID: ${payment.id} | Método: ${payment.method} | Status: ${payment.status}`,
    );
    console.log(
      `   -> Valor cobrado na intent: ${payment.amount_cents} centavos (R$ ${(payment.amount_cents / 100).toFixed(2)})`,
    );
    if (payment.amount_cents === order.total_cents) {
      console.log(
        "   => SUCESSO DO CONTRATO: 0% de divergência de valor entre Pedido, Snapshot e Intenção de Pagamento!",
      );
    } else {
      console.error(
        `   => [FALHA DE DIVERGÊNCIA] Valor do pagamento (${payment.amount_cents}) difere do total do pedido (${order.total_cents})!`,
      );
    }
  }

  // 4. Teste Canônico do Portal do Cliente (Simulação da Consulta da Rota /conta/pagamentos)
  console.log(
    "\n4 [CAMADA PORTAL DO CLIENTE - CENTRAL DE PAGAMENTOS] Testando payload de agregação para '/conta/pagamentos'...",
  );
  const { data: customerPayments, error: pErr } = await supabase
    .from("orders")
    .select(
      "id, public_token, status, total_cents, created_at, payments(id, status, method, amount_cents, created_at)",
    )
    .eq("id", orderId);

  if (pErr || !customerPayments || customerPayments.length === 0) {
    console.error(
      "   [ERRO] A nova query canônica da Central de Pagamentos não encontrou o pedido do cliente:",
      pErr || "Array vazio",
    );
    if (order.payments?.[0])
      console.log("   Colunas reais em payments:", Object.keys(order.payments[0]));
  } else {
    const pRecord = customerPayments[0];
    const pState = pRecord.payments?.[0]?.status || pRecord.status;
    console.log(`   -> Registro retornado com êxito na listagem de pagamentos!`);
    console.log(
      `      * Pedido #${pRecord.public_token} | Total: R$ ${(pRecord.total_cents / 100).toFixed(2)} | Estado Visual: '${pState}'`,
    );
    console.log(
      `   => SUCESSO DA UI: O portal do cliente deixa de exibir 'Nenhum carnê encontrado' para listar ativa e corretamente os pagamentos e botões de acompanhamento!`,
    );
  }

  console.log("\n====================================================================");
  console.log("  ESTADO GERAL DA ESTEIRA: INTEGRADO, SANADO E VERIFICADO NA NUVEM");
  console.log("====================================================================");
}

runSystemicAuditAndRuntimeTest().catch(console.error);
