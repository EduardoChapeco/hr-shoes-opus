import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPriceQuery() {
  console.log("=== TESTANDO A CONSULTA DE ADICIONAR AO CARRINHO ===");
  const variantIds = [
    "0048a49f-d6e0-4e04-896f-0ef7b165d3d8", // Produto de teste
    "8ab9e320-6702-4e7f-b7b7-4883fa6fbcae", // Short Saia
    "786bb489-de1c-4899-9b1d-5e7dbd5adf07", // Saia Jeans cargo (este deu 6000)
    "348b8b34-c7e8-40b8-a9ce-18c611f07a98", // Short Saia 2
    "1acb681c-4169-4a29-a274-73cef23fad7a", // Tenis casual
  ];

  for (const vid of variantIds) {
    const { data: vInfo, error } = await supabase
      .from("product_variants")
      .select("price_override_cents, product_id, products(price_cents)")
      .eq("id", vid)
      .single();

    console.log(`\nVariante: ${vid}`);
    console.log("vInfo retornado:", JSON.stringify(vInfo));
    if (error) console.error("Error:", error);

    const productData = Array.isArray(vInfo?.products) ? vInfo?.products[0] : vInfo?.products;
    const priceCents = vInfo?.price_override_cents ?? vInfo?.products?.price_cents ?? 0;
    const arraySafePrice = vInfo?.price_override_cents ?? productData?.price_cents ?? 0;
    console.log(
      `Preço com products.price_cents: ${priceCents}, com arraySafePrice: ${arraySafePrice}`,
    );
  }
}

testPriceQuery().catch(console.error);
