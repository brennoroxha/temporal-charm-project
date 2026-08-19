import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const session_id = String(body?.session_id ?? "").slice(0, 80);
          const event = String(body?.event ?? "").slice(0, 80);
          if (!session_id || !event) return new Response("bad", { status: 400 });

          const path = String(body?.path ?? "").slice(0, 300) || null;
          const meta =
            body?.meta && typeof body.meta === "object" ? body.meta : {};

          const h = request.headers;
          const ip =
            h.get("cf-connecting-ip") ||
            (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
            h.get("x-real-ip") ||
            null;
          const user_agent = (h.get("user-agent") || "").slice(0, 400) || null;

          const { getServerSupabase } = await import("@/lib/supabase-server");
          const supabase = getServerSupabase();
          const { error } = await supabase.rpc("insert_page_view_event", {
            p_session_id: session_id,
            p_event: event,
            p_path: path,
            p_meta: meta,
            p_ip: ip,
            p_user_agent: user_agent,
          });
          if (error) {
            console.error("track-event error", error);
            return new Response("ok", { status: 202 });
          }
          return new Response("ok");
        } catch (e) {
          console.error("track-event exception", e);
          return new Response("ok", { status: 202 });
        }
      },
    },
  },
});
