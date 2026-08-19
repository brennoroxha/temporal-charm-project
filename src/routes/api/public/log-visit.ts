import { createFileRoute } from "@tanstack/react-router";

const s = (v: unknown, max = 300) => {
  const out = String(v ?? "").slice(0, max);
  return out || null;
};

export const Route = createFileRoute("/api/public/log-visit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: any = await request.json().catch(() => ({}));
          const session_id = String(body?.session_id ?? "").slice(0, 80);
          if (!session_id) return new Response("bad", { status: 400 });

          const h = request.headers;
          const ip =
            h.get("cf-connecting-ip") ||
            (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
            h.get("x-real-ip") ||
            null;

          const { getServerSupabase } = await import("@/lib/supabase-server");
          const supabase = getServerSupabase();

          const { error } = await supabase.rpc("insert_visit_log", {
            p_session_id: session_id,
            p_path: s(body?.path) ?? "",
            p_referrer: s(body?.referrer) ?? "",
            p_ip: ip ?? "",
            p_user_agent: s(h.get("user-agent"), 400) ?? "",
            p_country: s(h.get("cf-ipcountry"), 8) ?? "",
            p_utm_source: s(body?.utm_source, 120) ?? "",
            p_utm_medium: s(body?.utm_medium, 120) ?? "",
            p_utm_campaign: s(body?.utm_campaign, 160) ?? "",
            p_utm_content: s(body?.utm_content, 160) ?? "",
            p_utm_term: s(body?.utm_term, 160) ?? "",
          });
          if (error) {
            console.error("log-visit backend error", error);
            return new Response("ok", { status: 202 });
          }
          return new Response("ok");
        } catch (e) {
          console.error("log-visit error", e);
          return new Response("ok", { status: 202 });
        }
      },
    },
  },
});
