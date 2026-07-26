import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function healOrders() {
  console.log("=== SANEAMENTO RETROATIVO VIA API EM PRODUÇÃO ===");
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", "18bb7554-8636-4615-9f62-fb5b79315367");

  if (!items || items.length === 0) {
    console.log("Nenhum item encontrado no pedido 18bb7554-8636-4615-9f62-fb5b79315367");
    return;
  }

  let subtotalCents = 0;
  const updatedSnapshot = [];

  for (const item of items) {
    const { data: vInfo } = await supabase
      .from("product_variants")
      .select("price_override_cents, sku, attributes, products(price_cents, title)")
      .eq("id", item.variant_id)
      .single();
    
    const productData = Array.isArray(vInfo?.products) ? vInfo?.products[0] : vInfo?.products;
    let unitPrice = vInfo?.price_override_cents ?? productData?.price_cents ?? 0;
    
    if (item.unit_price_cents === 0 || item.total_cents === 0) {
      const totalItemCents = unitPrice * item.qty;
      console.log(`Corrigindo item ${item.id} (${item.product_title}): unit_price_cents de 0 para ${unitPrice}, total_cents para ${totalItemCents}`);
      await supabase.from("order_items").update({
        unit_price_cents: unitPrice,
        total_cents: totalItemCents
      }).eq("id", item.id);
    }

    const effectiveUnit = unitPrice;
    const effectiveTotal = effectiveUnit * item.qty;
    subtotalCents += effectiveTotal;

    updatedSnapshot.push({
      variant_id: item.variant_id,
      qty: item.qty,
      unit_price_cents: effectiveUnit,
      total_cents: effectiveTotal,
      product_title: item.product_title || productData?.title,
      variant_sku: item.variant_sku || vInfo?.sku,
      variant_attributes: item.variant_attributes || {},
      image_url: item.image_url
    });
  }

  console.log(`\nNovo subtotal do pedido: ${subtotalCents} centavos (R$ ${(subtotalCents/100).toFixed(2)})`);
  const shippingCents = 2500;
  const discountCents = 0;
  const newTotalCents = subtotalCents + shippingCents - discountCents;
  console.log(`Novo total do pedido: ${newTotalCents} centavos (R$ ${(newTotalCents/100).toFixed(2)})`);

  await supabase.from("orders").update({
    subtotal_cents: subtotalCents,
    total_cents: newTotalCents,
    items_snapshot: updatedSnapshot
  }).eq("id", "18bb7554-8636-4615-9f62-fb5b79315367");
  console.log("Pedido atualizado no banco!");

  const { data: payments } = await supabase.from("payments").select("*").eq("order_id", "18bb7554-8636-4615-9f62-fb5b79315367");
  for (const pay of payments || []) {
    if (pay.amount_cents !== newTotalCents) {
      await supabase.from("payments").update({ amount_cents: newTotalCents }).eq("id", pay.id);
      console.log(`Pagamento ${pay.id} atualizado de ${pay.amount_cents} para ${newTotalCents}`);
    }
  }

  console.log("\n=== VERIFICAÇÃO FINAL DO PEDIDO SANADO ===");
  const { data: checkOrder } = await supabase.from("orders").select("*").eq("id", "18bb7554-8636-4615-9f62-fb5b79315367").single();
  const { data: checkItems } = await supabase.from("order_items").select("*").eq("order_id", "18bb7554-8636-4615-9f62-fb5b79315367");
  console.log("Pedido Saneado:", JSON.stringify({
    id: checkOrder.id,
    token: checkOrder.public_token,
    subtotal_cents: checkOrder.subtotal_cents,
    total_cents: checkOrder.total_cents,
    status: checkOrder.status
  }, null, 2));
  console.log("Itens Saneados (preços):", checkItems.map(i => ({ title: i.product_title, qty: i.qty, unit: i.unit_price_cents, total: i.total_cents })));
}

healOrders().catch(console.error);
