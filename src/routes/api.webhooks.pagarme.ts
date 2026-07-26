import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { getEnvVar } from "@/lib/env";
import { getServerClient } from "@/lib/supabase";

export const Route = createFileRoute("/api/webhooks/pagarme")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const signature = request.headers.get("X-Hub-Signature");
          const rawBody = await request.text();

          // In a real environment, load this from env
          const pagarmeWebhookKey = getEnvVar("PAGARME_WEBHOOK_KEY");

          if (!pagarmeWebhookKey) {
            console.error(
              "[Webhook] Pagar.me webhook received but integration is not configured (missing PAGARME_WEBHOOK_KEY).",
            );
            return new Response(JSON.stringify({ error: "Integration not configured" }), {
              status: 501,
            });
          }

          // 1. Validate signature for security (Prevent spoofing)
          // Pagar.me sends a signature like: sha1=hash
          if (signature) {
            const expectedHash = crypto
              .createHmac("sha1", pagarmeWebhookKey)
              .update(rawBody)
              .digest("hex");
            if (`sha1=${expectedHash}` !== signature) {
              return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
            }
          }

          const payload = JSON.parse(rawBody);
          const eventId = payload.id;
          const eventType = payload.type;

          const supabase = getServerClient();

          // 2. Register Webhook Event (Idempotency)
          const { error: webhookError } = await supabase.from("webhook_events").insert({
            provider: "pagarme",
            event_id: eventId,
            event_type: eventType,
            payload: payload,
          });

          if (webhookError && webhookError.code === "23505") {
            // Unique violation
            // Already processed
            return new Response(JSON.stringify({ received: true, ignored: "already_processed" }), {
              status: 200,
            });
          }

          // 3. Handle specific events (e.g., order.paid, order.canceled, charge.paid)
          // Pagar.me V5 uses payload.data.id as the main reference
          if (payload.data && payload.data.id) {
            let gatewayOrderId = payload.data.id.toString();

            // If the event is from a charge, the provider_ref we saved is the order id,
            // so we should look at payload.data.order.id
            if (payload.type.startsWith("charge.") && payload.data.order && payload.data.order.id) {
              gatewayOrderId = payload.data.order.id.toString();
            }

            const eventTypeStatus = payload.type; // e.g. order.paid, charge.paid, order.canceled

            // Find the internal order
            const { data: tx } = await supabase
              .from("payments")
              .select("order_id")
              .eq("provider_ref", gatewayOrderId)
              .single();

            if (tx) {
              // If paid, update the order
              if (eventTypeStatus.endsWith(".paid")) {
                await supabase
                  .from("payments")
                  .update({ status: "paid", updated_at: new Date().toISOString() })
                  .eq("provider_ref", gatewayOrderId);

                await supabase
                  .from("orders")
                  .update({ status: "processing", paid_at: new Date().toISOString() })
                  .eq("id", tx.order_id);
              } else if (
                eventTypeStatus.endsWith(".canceled") ||
                eventTypeStatus.endsWith(".failed")
              ) {
                await supabase
                  .from("payments")
                  .update({ status: "failed", updated_at: new Date().toISOString() })
                  .eq("provider_ref", gatewayOrderId);

                // Chamar RPC atômica para devolver estoque e comissão
                const { error: rpcError } = await supabase.rpc("fail_order_payment", {
                  p_order_id: tx.order_id,
                  p_reason: "Pagamento rejeitado pelo gateway Pagar.me",
                });

                if (rpcError) {
                  console.error("Erro ao estornar estoque no webhook:", rpcError);
                }
              }
            }
          }

          // Mark as processed
          await supabase
            .from("webhook_events")
            .update({ processed_at: new Date().toISOString() })
            .eq("event_id", eventId);

          return new Response(JSON.stringify({ received: true }), { status: 200 });
        } catch (err: any) {
          console.error("Webhook processing error", err);
          return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
        }
      },
    },
  },
});
