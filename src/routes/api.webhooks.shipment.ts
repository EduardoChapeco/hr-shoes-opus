import { createFileRoute } from "@tanstack/react-router";
import { getServerClient } from "@/lib/supabase";

export const Route = createFileRoute("/api/webhooks/shipment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const { order_id, tracking_code, carrier_name, status, tracking_url, provider = "webhook" } = body;

          if (!order_id && !tracking_code) {
            return new Response(JSON.stringify({ error: "Missing order_id or tracking_code" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabase = getServerClient();

          // 1. Locate order by ID or tracking_code
          let query = supabase.from("orders").select("id, store_id, status");
          if (order_id) {
            query = query.eq("id", order_id);
          } else if (tracking_code) {
            query = query.eq("tracking_code", tracking_code);
          }

          const { data: order, error: findError } = await query.maybeSingle();

          if (findError || !order) {
            return new Response(JSON.stringify({ error: "Order not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 2. Map status transition
          let newOrderStatus = order.status;
          const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          if (tracking_code) updatePayload.tracking_code = tracking_code;
          if (carrier_name) updatePayload.carrier_name = carrier_name;
          if (tracking_url) updatePayload.tracking_url = tracking_url;

          if (status === "shipped" || status === "in_transit") {
            newOrderStatus = "shipped";
            updatePayload.shipped_at = new Date().toISOString();
          } else if (status === "delivered" || status === "completed") {
            newOrderStatus = "delivered";
            updatePayload.delivered_at = new Date().toISOString();
          }

          updatePayload.status = newOrderStatus;

          // 3. Update order idempotently
          const { error: updateError } = await supabase
            .from("orders")
            .update(updatePayload)
            .eq("id", order.id);

          if (updateError) {
            console.error("[shipment-webhook] Error updating order:", updateError);
            return new Response(JSON.stringify({ error: "Failed to update order" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 4. Log webhook event
          await supabase.from("shipment_webhook_logs").insert({
            store_id: order.store_id,
            order_id: order.id,
            provider,
            event_type: status || "tracking_update",
            payload: body,
          });

          return new Response(JSON.stringify({ success: true, order_id: order.id, new_status: newOrderStatus }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("[shipment-webhook] Exception:", e);
          return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
