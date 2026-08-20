import { createHash } from "crypto";

const FB_PIXEL_ID = "3272377113150312";
// Nota: O token de acesso deve ser configurado via secret no Lovable Cloud se necessário, 
// mas usaremos um placeholder ou buscaremos de env se disponível.
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

function hash(value: string | null | undefined): string {
  if (!value) return "";
  const cleanValue = value.trim().toLowerCase();
  return createHash("sha256").update(cleanValue).digest("hex");
}

export async function notifyFacebookPurchase(order: any) {
  if (!FB_ACCESS_TOKEN) {
    console.warn("[fb-capi] FB_ACCESS_TOKEN not set, skipping server-side Purchase event");
    return;
  }

  try {
    const eventId = order.event_id || `purchase_${order.transaction_id || order.id}`;
    
    // Normalização básica de dados para o hashing SHA256 exigido pelo Facebook
    const userData = {
      em: [hash(order.customer_email)],
      ph: [hash(order.customer_phone)],
      fn: [hash(order.customer_name?.split(" ")[0])],
      fbp: order.fbp ? [order.fbp] : undefined,
      fbc: order.fbc ? [order.fbc] : undefined,
      client_ip_address: order.metadata?.ip || null,
      client_user_agent: order.metadata?.user_agent || null,
    };

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: eventId,
          event_source_url: order.metadata?.url || "https://escolher-rec.lovable.app/pagamento",
          user_data: userData,
          custom_data: {
            value: Number(order.amount) / 100,
            currency: "MXN",
            content_type: "product",
          },
        },
      ],
    };

    console.log("[fb-capi] sending purchase notification", JSON.stringify(payload));

    const res = await fetch(`https://graph.facebook.com/v17.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[fb-capi] error response", res.status, errorText);
    } else {
      console.log("[fb-capi] purchase notification sent successfully");
    }
  } catch (err) {
    console.error("[fb-capi] fatal error", err);
  }
}
