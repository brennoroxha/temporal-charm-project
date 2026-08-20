import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/xpag-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log("[xpag-webhook] received event", body);

          const { getServerSupabaseAdmin } = await import("@/lib/supabase-server");
          const supabaseAdmin = getServerSupabaseAdmin();

          const transactionId = body.id || body.payment_id;
          const status = body.status; // e.g., 'paid', 'completed'

          if (transactionId && (status === 'paid' || status === 'completed')) {
             const { error } = await supabaseAdmin
              .from("orders")
              .update({ status: "paid", paid_at: new Date().toISOString() })
              .eq("transaction_id", transactionId);
            
            if (error) console.error("[xpag-webhook] update error", error);
          }

          return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.error("[xpag-webhook] handler error", err);
          return new Response('Internal Error', { status: 500 });
        }
      }
    }
  }
});