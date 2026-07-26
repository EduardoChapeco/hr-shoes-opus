import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVariants() {
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", "18bb7554-8636-4615-9f62-fb5b79315367");

  console.log("=== ITENS DO PEDIDO 18bb7554-8636-4615-9f62-fb5b79315367 ===");
  for (const item of orderItems || []) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("*, products(*)")
      .eq("id", item.variant_id)
      .single();

    console.log(`\nItem: ${item.product_title} (${item.variant_sku}) - Qty: ${item.qty}`);
    console.log(
      `Preço gravado em order_items: unit_price_cents=${item.unit_price_cents}, total_cents=${item.total_cents}`,
    );
    if (variant) {
      console.log(
        `No DB product_variants: price_cents=${variant.price_cents}, base_price_cents=${variant.base_price_cents}`,
      );
      console.log(
        `No DB products: base_price_cents=${variant.products?.base_price_cents}, price_cents=${variant.products?.price_cents}`,
      );
    } else {
      console.log(`Variante não encontrada no banco! ID: ${item.variant_id}`);
    }
  }

  console.log("\n=== ONDE NA TABELA PAYMENT_TRANSACTIONS ESTÁ TENTATIVA DE PAGAMENTO? ===");
  const { data: allTrans } = await supabase
    .from("payment_transactions")
    .select("*")
    .limit(5)
    .order("created_at", { ascending: false });
  console.log("Últimas 5 payment_transactions:", JSON.stringify(allTrans, null, 2));

  const { data: allPay } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", "18bb7554-8636-4615-9f62-fb5b79315367");
  console.log("Payments para o pedido:", JSON.stringify(allPay, null, 2));
}

checkVariants().catch(console.error);
