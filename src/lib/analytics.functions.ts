import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
}

export const listPageViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("page_views")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { visits: data ?? [] };
  });

export const listVisitLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("visit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { logs: data ?? [] };
  });

export const listSessionEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { session_id: string }) => ({
    session_id: String(input?.session_id ?? "").slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (!data.session_id) return { events: [] };
    const { data: rows, error } = await context.supabase
      .from("page_view_events")
      .select("*")
      .eq("session_id", data.session_id)
      .order("created_at", { ascending: true })
      .limit(1000);
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });

