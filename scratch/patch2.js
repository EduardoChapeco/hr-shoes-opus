const fs = require('fs');
let content = fs.readFileSync('src/routes/api.webhooks.pagarme.ts', 'utf8');

const target = `                await supabase
                  .from("orders")
                  .update({ status: "payment_failed" })
                  .eq("id", tx.order_id);`;

const replacement = `                // Chamar RPC atômica para devolver estoque e comissão
                const { error: rpcError } = await supabase.rpc("fail_order_payment", {
                  p_order_id: tx.order_id,
                  p_reason: "Pagamento rejeitado pelo gateway Pagar.me",
                });
                
                if (rpcError) {
                  console.error("Erro ao estornar estoque no webhook:", rpcError);
                }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/routes/api.webhooks.pagarme.ts', content);
