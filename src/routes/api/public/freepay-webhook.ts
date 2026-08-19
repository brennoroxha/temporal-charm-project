import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/freepay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log("[freepay-webhook] received", JSON.stringify(body));

          const tx = body.data || body;
          const transactionId = tx.id || tx.transaction_id || tx.hash;
          const status = String(tx.status || "").toLowerCase();

          if (transactionId && status) {
            const { getServerSupabase } = await import("@/lib/supabase-server");
            const supabase = getServerSupabase();

            console.log(`[freepay-webhook] looking for order with transaction_id: ${transactionId}`);

            const { data: order } = await supabase
              .from("orders")
              .select("*")
              .eq("transaction_id", String(transactionId))
              .single();

            if (!order) {
              console.warn(`[freepay-webhook] order not found for transaction_id: ${transactionId}`);
              return Response.json({ ok: false, error: "order not found" });
            }

            console.log(`[freepay-webhook] updating order ${order.id} status to ${status}`);

            const isPaid = status === "paid" || status === "confirmed" || status === "completed";
            const isPending = status === "pending" || status === "waiting_payment";
            
            const updateFields: any = { status: status };
            
            if (isPaid && !(order as any).purchase_event_sent) {
              updateFields.purchase_event_sent = true;
              updateFields.purchase_event_sent_at = new Date().toISOString();
            }

            if (isPending && !(order as any).pending_event_sent) {
              updateFields.pending_event_sent = true;
              updateFields.pending_event_sent_at = new Date().toISOString();
            }

            const { error: updateError } = await supabase
              .from("orders")
              .update(updateFields)
              .eq("transaction_id", String(transactionId));

            if (updateError) {
              console.error("[freepay-webhook] update error", updateError);
              throw updateError;
            }

            // 3. Notificações
            if (isPaid && !(order as any).purchase_event_sent) {
              const { notifyUtmifySale } = await import("@/lib/utmify.server");
              const { notifyFacebookPurchase } = await import("@/lib/facebook-capi.server");
              
              console.log(`[freepay-webhook] Disparando notificações de purchase para pedido ${order.id}`);
              
              const updatedOrder = { ...order, ...updateFields };
              await Promise.allSettled([
                notifyUtmifySale(updatedOrder),
                notifyFacebookPurchase(updatedOrder)
              ]);
            } else if (isPending && !(order as any).pending_event_sent) {
              const { notifyUtmifySale } = await import("@/lib/utmify.server");
              console.log(`[freepay-webhook] Disparando notificação de pedido gerado (pending) para pedido ${order.id}`);
              
              // Para notificação de pendente, passamos explicitamente o status
              const pendingOrder = { ...order, ...updateFields, order_status: 'pending' };
              await notifyUtmifySale(pendingOrder);
            }
          }

          return Response.json({ ok: true });
        } catch (e) {
          console.error("[freepay-webhook] error", e);
          return new Response("bad request", { status: 400 });
        }
      },
      GET: async () => Response.json({ ok: true, service: "freepay-webhook" }),
    },
  },
});