import { createFileRoute } from "@tanstack/react-router";
import { getServerClient } from "@/lib/supabase";
import crypto from "crypto";

export const Route = createFileRoute("/api/webhooks/pagarme")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const signature = request.headers.get("X-Hub-Signature");
          const rawBody = await request.text();

          // In a real environment, load this from env
          const pagarmeWebhookKey = process.env.PAGARME_WEBHOOK_KEY;

          if (!pagarmeWebhookKey) {
            console.error("[Webhook] Pagar.me webhook received but integration is not configured (missing PAGARME_WEBHOOK_KEY).");
            return new Response(JSON.stringify({ error: "Integration not configured" }), { status: 501 });
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

          // 3. Handle specific events (e.g., transaction_status_changed, order_paid)
          if (payload.transaction && payload.transaction.id) {
            const gatewayTransactionId = payload.transaction.id.toString();
            const currentStatus = payload.current_status; // 'paid', 'refused', 'refunded'

            // Find the internal order
            const { data: tx } = await supabase
              .from("payment_transactions")
              .select("order_id")
              .eq("gateway_transaction_id", gatewayTransactionId)
              .single();

            if (tx) {
              // Update transaction
              await supabase
                .from("payment_transactions")
                .update({ status: currentStatus, updated_at: new Date().toISOString() })
                .eq("gateway_transaction_id", gatewayTransactionId);

              // If paid, update the order
              if (currentStatus === "paid") {
                await supabase
                  .from("orders")
                  .update({ status: "paid", paid_at: new Date().toISOString() })
                  .eq("id", tx.order_id);

                // Here we would also call the Cash Register deduction, etc.
                // (Ideally delegated to a domain service to avoid duplicating confirmPayment)
              } else if (currentStatus === "refused") {
                await supabase
                  .from("orders")
                  .update({ status: "payment_failed" })
                  .eq("id", tx.order_id);
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
