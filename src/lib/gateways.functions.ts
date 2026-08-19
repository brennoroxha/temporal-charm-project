import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listGateways = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: gateways, error } = await (context.supabase as any)
      .from("gateways")
      .select("*")
      .eq("name", "freepay")
      .single();

    if (error) throw error;
    
    return { gateways: [gateways], settings: { enabled: false } };
  });

export const updateGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      publicKey: z.string().optional(),
      secretKey: z.string().optional(),
      isActive: z.boolean().optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const update: any = { updated_at: new Date().toISOString() };
    if (data.publicKey !== undefined) update.public_key = data.publicKey;
    if (data.secretKey !== undefined) update.secret_key = data.secretKey;
    if (data.isActive !== undefined) update.is_active = data.isActive;

    const { error } = await (context.supabase as any)
      .from("gateways")
      .update(update)
      .eq("id", data.id);

    if (error) throw error;

    // If activating a gateway, deactivate others (only one active at a time for simplicity)
    // and also disable split gateways if it was enabled
    if (data.isActive) {
      const { error: deactivateError } = await (context.supabase as any)
        .from("gateways")
        .update({ is_active: false })
        .neq("id", data.id);
      if (deactivateError) console.error("Error deactivating other gateways", deactivateError);

      await (context.supabase as any)
        .from("settings")
        .update({ value: { enabled: false, last_gateway: "" } })
        .eq("id", "split_gateways");
    }

    return { ok: true };
  });

export const updateSplitGateways = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: current } = await (context.supabase as any)
      .from("settings")
      .select("*")
      .eq("id", "split_gateways")
      .single();
    
    const newValue = {
      ...(current?.value || {}),
      enabled: data.enabled,
    };

    const { error } = await (context.supabase as any)
      .from("settings")
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq("id", "split_gateways");

    if (error) throw error;

    // If enabling split, we might want to deactivate specific fixed gateways
    if (data.enabled) {
      await (context.supabase as any)
        .from("gateways")
        .update({ is_active: false });
    }

    return { ok: true };
  });
