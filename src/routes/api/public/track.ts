import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const session_id = String(body?.session_id ?? "").slice(0, 80);
          if (!session_id) return new Response("bad", { status: 400 });

          const path = String(body?.path ?? "").slice(0, 300) || null;
          const title = String(body?.title ?? "").slice(0, 300) || null;
          const referrer = String(body?.referrer ?? "").slice(0, 300) || null;

          const h = request.headers;
          const ip =
            h.get("cf-connecting-ip") ||
            (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
            h.get("x-real-ip") ||
            null;
          const user_agent = (h.get("user-agent") || "").slice(0, 400) || null;
          const country = h.get("cf-ipcountry") || null;

          const { getServerSupabase } = await import("@/lib/supabase-server");
          const supabase = getServerSupabase();

          const { error } = await supabase.rpc("upsert_page_view", {
            p_session_id: session_id,
            p_path: path ?? "",
            p_title: title ?? "",
            p_referrer: referrer ?? "",
            p_ip: ip ?? "",
            p_user_agent: user_agent ?? "",
            p_country: country ?? "",
          });
          if (error) {
            console.error("track backend error", error);
            return new Response("ok", { status: 202 });
          }

          return new Response("ok");
        } catch (e) {
          console.error("track error", e);
          return new Response("ok", { status: 202 });
        }
      },
    },
  },
});
