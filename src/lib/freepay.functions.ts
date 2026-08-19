import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Docs: https://freepaybrasil.readme.io/reference/createpaymenttransaction
const FREEPAY_BASE = 'https://api.freepaybrasil.com/v1';

const PayloadSchema = z.object({
  amount: z.number().int().positive(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    cpf: z.string(),
    phone: z.string(),
  }),
  items: z.array(z.object({
    title: z.string(),
    unitPrice: z.number().int().positive(),
    quantity: z.number().int().positive(),
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

export const createFreepayPix = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PayloadSchema.parse(input))
  .handler(async ({ data }) => {
    const { getServerSupabase } = await import("@/lib/supabase-server");
    const supabase = getServerSupabase();

    // Get keys from DB if available, fallback to env
    const { data: dbGateway } = await (supabase as any).from("gateways").select("*").eq("name", "freepay").single();
    
    const secretKey = (dbGateway?.secret_key || process.env.FREEPAY_SECRET_KEY || "sk_live_xxxx")?.trim();

    if (!secretKey) {
      throw new Error("Chave secreta da FreePay não configurada");
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const maskedProductName = `Kit Celimax - Tratamento #${randomCode}`;

    const appUrl = process.env.PUBLIC_APP_URL || 'https://escolher-rec.lovable.app';
    const webhookUrl = `${appUrl.replace(/\/+$/, "")}/api/public/freepay-webhook`;

    // FreePay expects document without dots/dashes
    const digits = data.customer.cpf.replace(/\D/g, "");

    const payload = {
      amount: data.amount,
      payment_method: "pix",
      postback_url: webhookUrl,
      metadata: { 
        product: maskedProductName,
        utms: data.metadata?.utms || {}
      },
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        document: { number: digits, type: digits.length > 11 ? 'cnpj' : 'cpf' },
        phone: data.customer.phone.replace(/\D/g, "").startsWith('55') ? `+${data.customer.phone.replace(/\D/g, "")}` : `+55${data.customer.phone.replace(/\D/g, "")}`,
      },
      items: [
        {
          title: maskedProductName,
          unit_price: Math.round(data.amount),
          quantity: 1,
          tangible: true,
        },
      ],
    };

    console.log("[freepay-api] creating transaction", JSON.stringify(payload));

    const res = await fetch(`${FREEPAY_BASE}/payment-transaction/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${Buffer.from(`${dbGateway?.public_key || process.env.FREEPAY_PUBLIC_KEY}:${secretKey}`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    const json: any = await res.json();

    if (!res.ok) {
      console.error("FreePay API error", res.status, json);
      throw new Error(json.message || json.errors?.[0]?.message || `FreePay API Error ${res.status}`);
    }

    const tx = json.data || json;
    const id = tx.transaction_id || tx.id || tx.hash;
    const pixCode = tx.pix?.qr_code || tx.pix_code || tx.pix?.pix_qr_code;

    if (!id || !pixCode) {
      throw new Error("Resposta da FreePay incompleta (faltando ID ou PIX copia e cola)");
    }

    // Persistir no Supabase
    try {
      const tracking = data.metadata || {};
      const { error: orderError } = await supabase.from("orders").insert({
        transaction_id: id,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_document: data.customer.cpf,
        customer_phone: data.customer.phone,
        amount: data.amount,
        status: "pending",
        items: data.items,
        shipping: data.shipping,
        metadata: { ...payload.metadata, ...tracking },
        qrcode: pixCode,
        // Novos campos de rastreamento
        utm_source: String(tracking.utm_source || ""),
        utm_medium: String(tracking.utm_medium || ""),
        utm_campaign: String(tracking.utm_campaign || ""),
        utm_content: String(tracking.utm_content || ""),
        utm_term: String(tracking.utm_term || ""),
        gclid: String(tracking.gclid || ""),
        fbclid: String(tracking.fbclid || ""),
        fbp: String(tracking.fbp || ""),
        fbc: String(tracking.fbc || ""),
        event_id: `purchase_${id}`,
      });
      if (orderError) console.error("[orders] FreePay insert failed", orderError);
    } catch (e) {
      console.error("[orders] FreePay Supabase error", e);
    }

    return {
      id,
      qrcode: pixCode,
      qrcodeImage: tx.pix?.qr_code_base64 || tx.pix_qrcode_base64 || "",
      amount: data.amount,
    };
  });
