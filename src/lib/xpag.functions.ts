import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const XPAG_BASE = 'https://api.xpag.global/v1';

const PayloadSchema = z.object({
  amount: z.number().positive(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    rfc: z.string(),
    phone: z.string(),
  }),
  items: z.array(z.object({
    title: z.string(),
    unitPrice: z.number().positive(),
    quantity: z.number().positive(),
  })).min(1),
  shipping: z.object({
    street: z.string(),
    streetNumber: z.string(),
    zipCode: z.string(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    complement: z.string().optional(),
  }),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const createXpagSpei = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PayloadSchema.parse(input))
  .handler(async ({ data }) => {
    const { getServerSupabase } = await import("@/lib/supabase-server");
    const supabase = getServerSupabase();

    const { data: dbGateway } = await (supabase as any)
      .from("gateways")
      .select("*")
      .eq("name", "xpag")
      .single();

    const clientId = (dbGateway?.public_key || process.env['XPAG_CLIENT_ID'] || "")?.trim();
    const clientSecret = (dbGateway?.secret_key || process.env['XPAG_CLIENT_SECRET'] || "")?.trim();

    if (!clientId || !clientSecret) {
      throw new Error("Credenciales de XPag no configuradas (Client ID / Client Secret)");
    }

    const appUrl = process.env['PUBLIC_APP_URL'] || 'https://temporal-charm-project.lovable.app';
    const webhookUrl = `${appUrl.replace(/\/+$/, "")}/api/public/xpag-webhook`;

    const externalId = `MX-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const payload = {
      currency: "MXN",
      amount: Number(data.amount.toFixed(2)),
      name: data.customer.name,
      document: data.customer.rfc,
      email: data.customer.email,
      phone: data.customer.phone,
      description: `Pedido ${data.customer.name}`,
      external_id: externalId,
      webhook_url: webhookUrl,
    };

    console.log("[xpag-api] creating SPEI cashin", JSON.stringify(payload));

    const res = await fetch(`${XPAG_BASE}/cashin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Client-Id": clientId,
        "X-Client-Secret": clientSecret,
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(raw);
    } catch {
      console.error("XPag non-JSON response", res.status, raw.slice(0, 300));
      throw new Error(
        `XPag respondió con un formato inválido (HTTP ${res.status}). Verifica la URL de la API y la clave configurada.`,
      );
    }


    if (!res.ok) {
      console.error("XPag API error", res.status, json);
      throw new Error(json?.message || `XPag API Error ${res.status}`);
    }


    const tx = json.data || json;
    const transactionId = tx.id;
    // SPEI suele devolver una CLABE o instrucciones
    const speiClabe = tx.spei?.clabe || tx.payment_instructions?.clabe;

    // Guardar el pedido en Supabase
    try {
      const tracking = data.metadata || {};
      const { error: orderError } = await supabase.from("orders").insert({
        transaction_id: transactionId,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_document: data.customer.rfc,
        customer_phone: data.customer.phone,
        amount: data.amount,
        status: "pending",
        items: data.items,
        shipping: data.shipping,
        metadata: { ...payload.metadata, gateway: "xpag_spei" },
        qrcode: speiClabe || "", // Reutilizamos qrcode para la CLABE
        utm_source: String(tracking.utm_source || ""),
        utm_medium: String(tracking.utm_medium || ""),
        utm_campaign: String(tracking.utm_campaign || ""),
      });
      if (orderError) console.error("[orders] XPag insert failed", orderError);
    } catch (e) {
      console.error("[orders] XPag Supabase error", e);
    }

    return {
      id: transactionId,
      clabe: speiClabe,
      instructions: tx.payment_instructions || tx.spei,
      amount: data.amount,
    };
  });