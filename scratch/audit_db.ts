import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function auditDatabase() {
  const supabase = createClient(url, serviceKey);

  console.log("=== AUDITORIA DO BANCO DE DADOS ===\n");

  // 1. Verificar se organizations existe e tem dados
  const { data: orgs, error: orgErr } = await supabase.from("organizations").select("*");
  console.log(
    "ORGANIZATIONS:",
    orgs?.length ?? 0,
    "registros",
    orgErr ? `ERRO: ${orgErr.message}` : "OK",
  );
  if (orgs) orgs.forEach((o) => console.log("  -", o.id, o.name, o.slug));

  // 2. Verificar se stores existe e tem dados
  const { data: stores, error: storeErr } = await supabase.from("stores").select("*");
  console.log(
    "\nSTORES:",
    stores?.length ?? 0,
    "registros",
    storeErr ? `ERRO: ${storeErr.message}` : "OK",
  );
  if (stores) stores.forEach((s) => console.log("  -", s.id, s.name, s.slug));

  // 3. Verificar profiles
  const { data: profiles, error: profErr } = await supabase.from("profiles").select("*");
  console.log(
    "\nPROFILES:",
    profiles?.length ?? 0,
    "registros",
    profErr ? `ERRO: ${profErr.message}` : "OK",
  );
  if (profiles) profiles.forEach((p) => console.log("  -", p.id, p.role, p.full_name));

  // 4. Verificar auth.users
  const {
    data: { users },
    error: userErr,
  } = await supabase.auth.admin.listUsers();
  console.log(
    "\nAUTH.USERS:",
    users?.length ?? 0,
    "registros",
    userErr ? `ERRO: ${userErr.message}` : "OK",
  );
  if (users) users.forEach((u) => console.log("  -", u.id, u.email, u.created_at));

  // 5. Verificar tabelas existem
  const tables = [
    "products",
    "product_variants",
    "categories",
    "collections",
    "carts",
    "cart_items",
    "orders",
    "order_items",
    "coupons",
    "gift_cards",
    "cash_registers",
    "cash_shifts",
    "cash_entries",
    "stock_reservations",
    "pages",
    "page_versions",
    "stories",
    "chat_threads",
    "chat_messages",
    "reviews",
    "commissions",
    "seller_showcases",
  ];

  console.log("\n=== VERIFICAÇÃO DE TABELAS ===");
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ${table}: ERRO — ${error.message}`);
    } else {
      console.log(`  ${table}: OK (${count} registros)`);
    }
  }

  // 6. Verificar trigger
  const { data: triggerCheck, error: trigErr } = await supabase.rpc("handle_new_user" as any);
  // This will fail but tells us if the function exists
  console.log("\n=== TRIGGER handle_new_user ===");
  console.log(
    trigErr
      ? `Existe (erro esperado ao chamar sem NEW): ${trigErr.message}`
      : "Resultado inesperado",
  );
}

auditDatabase().catch(console.error);
