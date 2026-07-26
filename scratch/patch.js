const fs = require('fs');
let content = fs.readFileSync('src/services/payment.functions.ts', 'utf8');

const target = `      const { data, error } = await db
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw new Error("Erro ao cancelar o pedido.");`;

const replacement = `      // 2. Chamar RPC atômica para estornar o estoque, cancelar comissões e falhar o pedido
      const { error: rpcError } = await db.rpc("fail_order_payment", {
        p_order_id: orderId,
        p_reason: reason || "Cancelado manualmente pela vendedora",
      });

      if (rpcError) {
        throw new Error("Erro sistêmico ao estornar estoque: " + rpcError.message);
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/services/payment.functions.ts', content);
