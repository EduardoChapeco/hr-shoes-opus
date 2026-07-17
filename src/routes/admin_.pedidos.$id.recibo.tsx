import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { getServerClient } from "@/lib/supabase";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin_/pedidos/$id/recibo")({
  head: () => ({ meta: [{ title: "Recibo — Hr Shoes" }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const db = await getServerClient();
    const { data, error } = await db
      .from("orders")
      .select(
        `
        id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents,
        customer_snapshot, created_at, shipping_method,
        order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_price_cents )
      `,
      )
      .eq("id", params.id)
      .single();
    if (error) throw new Error("Pedido não encontrado");
    return data;
  },
  component: ReceiptPrintPage,
});

function ReceiptPrintPage() {
  const order = Route.useLoaderData();

  useEffect(() => {
    // Automatically trigger print dialog after 500ms to allow rendering
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const date = new Date(order.created_at).toLocaleString("pt-BR");
  const customer = order.customer_snapshot as any;

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-2xl mx-auto font-sans">
      <div className="border-b-2 border-black pb-4 mb-6 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-widest">HR SHOES</h1>
        <p className="text-sm text-gray-600 mt-1">DOCUMENTO AUXILIAR DE VENDA - PEDIDO</p>
        <p className="text-sm font-medium mt-2">NÃO É DOCUMENTO FISCAL</p>
      </div>

      <div className="flex justify-between items-start mb-8 text-sm">
        <div>
          <p>
            <strong>Pedido:</strong> #{order.public_token}
          </p>
          <p>
            <strong>Data:</strong> {date}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
        </div>
        <div className="text-right">
          <p>
            <strong>Cliente:</strong> {customer?.name || "Consumidor Final"}
          </p>
          <p>{customer?.document || ""}</p>
          <p>
            <strong>Entrega:</strong>{" "}
            {order.shipping_method === "pickup" ? "Retirada na Loja" : "Envio"}
          </p>
        </div>
      </div>

      <table className="w-full text-sm mb-8 border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-2 font-bold">Qtd</th>
            <th className="text-left py-2 font-bold">Descrição</th>
            <th className="text-right py-2 font-bold">V. Unit</th>
            <th className="text-right py-2 font-bold">V. Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items?.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2">{item.qty}x</td>
              <td className="py-2">
                <div>{item.product_title}</div>
                <div className="text-xs text-gray-500">SKU: {item.variant_sku}</div>
              </td>
              <td className="text-right py-2">{formatMoney(item.unit_price_cents)}</td>
              <td className="text-right py-2">{formatMoney(item.total_price_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatMoney(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete:</span>
            <span>{formatMoney(order.shipping_cents)}</span>
          </div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Desconto:</span>
              <span>-{formatMoney(order.discount_cents)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-black pt-2">
            <span>TOTAL:</span>
            <span>{formatMoney(order.total_cents)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-12 pt-4 border-t border-dashed border-gray-400">
        <p>Agradecemos a preferência!</p>
        <p>Desenvolvido para Hr Shoes Commerce</p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body {
            background-color: white !important;
            margin: 0;
            padding: 0;
          }
          @page { margin: 0.5cm; }
        }
      `,
        }}
      />
    </div>
  );
}
