import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getOrderStatusByTransactionId, getServerSupabase } from "@/lib/supabase-server";

// Public: upload receipt (base64) linked to a transaction id
export const uploadReceipt = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      transactionId: z.string().min(1),
      filename: z.string().min(1),
      contentType: z.string().min(1),
      dataBase64: z.string().min(1),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();

    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.length > 8 * 1024 * 1024) throw new Error("Arquivo muito grande (máx 8MB)");

    const ext = (data.filename.split(".").pop() || "bin").toLowerCase().slice(0, 8);
    const path = `${data.transactionId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("receipts")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { error: updErr } = await supabase
      .from("orders")
      .update({
        receipt_url: path,
        receipt_uploaded_at: new Date().toISOString(),
        status: "receipt_uploaded",
      })
      .eq("transaction_id", data.transactionId);
    if (updErr) throw new Error(updErr.message);

    // Notificar Utmify imediatamente após o upload do comprovante
    const { data: order } = await supabase.from("orders").select("*").eq("transaction_id", data.transactionId).single();
    if (order) {
      const { notifyUtmifySale } = await import("@/lib/utmify.server");
      await notifyUtmifySale(order);
    }

    return { ok: true };
  });

// Public: get status/amount by transactionId for polling on payment page
export const getOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ transactionId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await getOrderStatusByTransactionId(data.transactionId);
    if (error) throw new Error(error.message);
    return {
      status: (row?.status as string | undefined) ?? null,
      amount: (row?.amount as number | undefined) ?? null,
    };
  });

// Admin: list orders with signed URLs for receipts
export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional().parse(input)
  )
  .handler(async ({ data: input, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc(
      "has_role",
      { _user_id: context.userId, _role: "admin" }
    );
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");

    let query = context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (input?.startDate) {
      query = query.gte("created_at", input.startDate);
    }
    if (input?.endDate) {
      query = query.lte("created_at", input.endDate);
    }

    const { data: orders, error } = await query.limit(1000);
    if (error) throw new Error(error.message);

    const withUrls = await Promise.all(
      (orders ?? []).map(async (o: any) => {
        let signed: string | null = null;
        if (o.receipt_url) {
          const { data: s } = await context.supabase.storage
            .from("receipts")
            .createSignedUrl(o.receipt_url, 60 * 60);
          signed = s?.signedUrl ?? null;
        }
        return { ...o, receipt_signed_url: signed };
      })
    );

    return { orders: withUrls };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), status: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    // 1. Verificar se é admin
    const { data: isAdmin, error: roleError } = await context.supabase.rpc(
      "has_role",
      { _user_id: context.userId, _role: "admin" }
    );
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");

    console.log(`[admin] Manual status update for order ${data.id} to ${data.status}`);

    // 2. Buscar o pedido para checar status anterior e tracking
    const { data: order } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .single();

    if (!order) throw new Error("Pedido não encontrado");

    // 3. Atualizar o pedido (com RLS via context.supabase)
    const isPaid = data.status === "paid";
    const updateFields: any = { status: data.status };
    
    if (isPaid && !order.purchase_event_sent) {
      updateFields.purchase_event_sent = true;
      updateFields.purchase_event_sent_at = new Date().toISOString();
    }

    const { error: updateError } = await context.supabase
      .from("orders")
      .update(updateFields)
      .eq("id", data.id);
    
    if (updateError) {
      console.error("[admin] Manual status update failed", updateError);
      throw new Error(updateError.message);
    }

    // 4. Se o admin marcou como pago e evento ainda não enviado, notificar APIs
    if (isPaid && !order.purchase_event_sent) {
      console.log(`[admin] Disparando notificações de purchase para pedido ${order.id}`);
      const { notifyUtmifySale } = await import("@/lib/utmify.server");
      const { notifyFacebookPurchase } = await import("@/lib/facebook-capi.server");
      
      await Promise.allSettled([
        notifyUtmifySale(order),
        notifyFacebookPurchase(order)
      ]);
    }

    return { ok: true };
  });
