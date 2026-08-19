// Lightweight client-side event tracker. Non-blocking, keepalive.
function getSid(): string {
  try {
    let sid = localStorage.getItem("lv_sid");
    if (!sid) {
      sid =
        (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
        "_" +
        Date.now().toString(36);
      localStorage.setItem("lv_sid", sid);
    }
    return sid;
  } catch {
    return "anon_" + Date.now().toString(36);
  }
}

export function trackEvent(event: string, meta?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/public/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        session_id: getSid(),
        event,
        path: window.location.pathname + window.location.search,
        meta: meta ?? {},
      }),
    }).catch(() => {});
  } catch {
    /* noop */
  }
}

// Track a field only once per session (per key) to avoid noise.
const firedFields = new Set<string>();
export function trackFieldOnce(field: string, meta?: Record<string, unknown>): void {
  const key = `field:${field}`;
  if (firedFields.has(key)) return;
  firedFields.add(key);
  trackEvent("checkout_field_filled", { field, ...(meta ?? {}) });
}
