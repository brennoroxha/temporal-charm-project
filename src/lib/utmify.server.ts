import { z } from "zod";

const UTMIFY_TOKEN = "WuqEO5z75AaeoUGZ5TCU1htKPDn3jlNyMZRe";

export async function notifyUtmifySale(order: any) {
  try {
    const items = Array.isArray(order.items) ? order.items : [];
    const firstItemTitle = (items[0] as any)?.title || "Kit Celimax - Tratamento";

    const metadata = order.metadata || {};
    
    const utm_source = order.utm_source || metadata.utm_source || "";
    const utm_campaign = order.utm_campaign || metadata.utm_campaign || "";
    const utm_medium = order.utm_medium || metadata.utm_medium || "";
    const utm_content = order.utm_content || metadata.utm_content || "";
    const utm_term = order.utm_term || metadata.utm_term || "";
    const gclid = order.gclid || metadata.gclid || "";
    const fbclid = order.fbclid || metadata.fbclid || "";

    const payload = {
      order_id: String(order.transaction_id || order.id),
      order_status: "paid",
      payment_method: "pix",
      total_amount: Number(order.amount) / 100,
      product_name: firstItemTitle,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        cpf: order.customer_document,
        phone: order.customer_phone,
      },
      // Espalhar utms mapeadas e garantir que campos principais não fiquem vazios se existirem
      utm_source,
      utm_campaign,
      utm_medium,
      utm_content,
      utm_term,
      gclid,
      fbclid,
      token: UTMIFY_TOKEN,
    };

    console.log("[utmify-api] sending sale notification", JSON.stringify(payload));

    const res = await fetch("https://api.utmify.com.br/v1/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[utmify-api] error response", res.status, errorText);
    } else {
      console.log("[utmify-api] sale notification sent successfully");
    }
  } catch (err) {
    console.error("[utmify-api] fatal error", err);
  }
}
