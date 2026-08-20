import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Copy, Check, Upload, AlertCircle, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/track";
import mlDesktopLogo from "@/assets/logomx2.png.asset.json";
import { OfferTimerBanner } from "@/components/OfferTimerBanner";

export const Route = createFileRoute("/pagamento-spei")({
  head: () => ({
    meta: [
      { title: "Oferta 25 Años - Pago SPEI" },
      { name: "description", content: "Finalice su pago vía SPEI." },
    ],
  }),
  component: PagamentoSpeiPage,
});

type SpeiItem = { slug: string; title: string; image: string; qty: number; unitPrice: number };
type SpeiPayment = {
  transactionId: string;
  clabe: string;
  bankName: string;
  beneficiaryName: string;
  amount: number;
  customerName: string;
  items?: SpeiItem[];
};

function formatMXN(v: number): string {
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PagamentoSpeiPage() {
  const [pay, setPay] = useState<SpeiPayment | null>(null);
  const [remaining, setRemaining] = useState(29 * 60 + 53);
  const [copied, setCopied] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowUpload(true), 20000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pixPayment");
      if (!raw) { window.location.href = "/checkout"; return; }
      const parsed = JSON.parse(raw);
      setPay(parsed);
      trackEvent("pagamento_view", { transactionId: String(parsed?.transactionId ?? ""), method: "spei" });
    } catch { window.location.href = "/checkout"; }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!pay?.transactionId) return;
    let stopped = false;
    const firedKey = `purchaseFired:${pay.transactionId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(firedKey)) return;

    const check = async () => {
      try {
        const { getOrderStatus } = await import("@/lib/orders.functions");
        const r = await getOrderStatus({ data: { transactionId: String(pay.transactionId) } });
        if (stopped) return;
        if (r.status === "paid" || r.status === "receipt_uploaded") {
          // Add notification message
          const msgContainer = document.createElement("div");
          msgContainer.style.position = "fixed";
          msgContainer.style.top = "20px";
          msgContainer.style.left = "50%";
          msgContainer.style.transform = "translateX(-50%)";
          msgContainer.style.background = "#00a650";
          msgContainer.style.color = "white";
          msgContainer.style.padding = "16px 24px";
          msgContainer.style.borderRadius = "8px";
          msgContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          msgContainer.style.zIndex = "9999";
          msgContainer.style.fontWeight = "bold";
          msgContainer.style.textAlign = "center";
          msgContainer.innerHTML = "¡PAGO CONFIRMADO!<br/>Redirigiendo...";
          document.body.appendChild(msgContainer);

          const value = Number(r.amount ?? pay.amount ?? 0);
          const w = window as any;
          if (typeof w.gtag === "function") {
            w.gtag("event", "conversion", {
              send_to: "AW-18267532945/M09HCP3G8cwcEJHd0YZE",
              value,
              currency: "MXN",
              transaction_id: String(pay.transactionId),
            });
            w.gtag("event", "purchase", {
              transaction_id: String(pay.transactionId),
              value,
              currency: "MXN",
            });
          }
          if (typeof w.fbPurchase === "function") {
            w.fbPurchase(value, String(pay.transactionId));
          }
          if (typeof w.utmifyTrack === "function") {
            w.utmifyTrack("Purchase", {
              value: value,
              order_id: String(pay.transactionId),
              currency: "MXN"
            });
          }
          sessionStorage.setItem(firedKey, "1");
          stopped = true;
          
          // Redirect to a success page or store after a short delay
          setTimeout(() => {
            window.location.href = "/loja";
          }, 3000);
        }
      } catch { /* ignore */ }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { stopped = true; clearInterval(iv); };
  }, [pay?.transactionId, pay?.amount]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  const formattedAmount = formatMXN(pay?.amount || 0);
  const [intPart, decPart] = formattedAmount.split('.');

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: 'Proxima Nova,-apple-system,Helvetica,Arial,sans-serif', color: "#333" }}>
      <header style={{ background: "#FFE600", boxShadow: "0 1px 2px rgba(0,0,0,.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/loja" style={{ display: "block" }}>
            <img src={mlDesktopLogo.url} alt="Mercado Libre" style={{ height: 33, width: "auto" }} />
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
            <Lock size={20} strokeWidth={2.5} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>PAGO</div>
              <div>100% SEGURO</div>
            </div>
          </div>
        </div>
      </header>

      {/* OfferTimerBanner removido */}

      <div style={{ width: "95%", maxWidth: 520, margin: "20px auto", background: "#fff", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>Ya casi es tuyo...</h1>
        <p style={{ fontSize: 14, textAlign: "center", color: "#666", marginBottom: 20 }}>
          Realiza la transferencia en los próximos <b>{mm}:{ss}</b> para asegurar tu pedido.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, background: "#e3f2fd", color: "#1976d2", borderRadius: 6, fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
          <Loader2 className="animate-spin" size={18} />
          Esperando transferencia...
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Total a pagar:</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#00a650", display: "flex", alignItems: "flex-start", marginBottom: 20 }}>
            {intPart}
            <span style={{ fontSize: 14, marginTop: 4 }}>.{decPart || '00'}</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>CLABE Interbancaria</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f8f8", padding: "12px 16px", borderRadius: 6, border: "1px solid #ddd" }}>
              <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>{pay?.clabe || "Cargando..."}</span>
              <button 
                onClick={() => pay?.clabe && copyText(pay.clabe)}
                style={{ background: "none", border: 0, color: "#3483fa", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}
              >
                {copied ? <Check size={16} color="#00a650" /> : <Copy size={16} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Banco</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{pay?.bankName || "Cargando..."}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Beneficiario</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{pay?.beneficiaryName || "XPag Global"}</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", padding: 16, borderRadius: 8, marginBottom: 24, fontSize: 13, display: "flex", gap: 12 }}>
          <AlertCircle size={20} color="#faad14" style={{ flexShrink: 0 }} />
          <div>
            <strong>Importante:</strong> La transferencia debe ser por el monto exacto para que el sistema la detecte automáticamente.
          </div>
        </div>

        {/* Seção de upload de comprovante removida conforme solicitado */}

        <div style={{ borderTop: "1px solid #eee", paddingTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pasos a seguir:</h3>
          {[
            "Copia la CLABE interbancaria de 18 dígitos.",
            "Entra a la aplicación de tu banco.",
            "Selecciona Transferir / SPEI.",
            "Pega la CLABE, ingresa el monto exacto y confirma.",
            "¡Listo! Tu pedido se actualizará en unos minutos."
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 14, color: "#555", alignItems: "flex-start" }}>
              <div style={{ background: "#3483fa", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 600, fontSize: 12 }}>{i+1}</div>
              <div style={{ lineHeight: "24px" }}>{step}</div>
            </div>
          ))}
        </div>

        {pay?.items && pay.items.length > 0 && (
          <div style={{ borderTop: "1px solid #eee", marginTop: 20, paddingTop: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Resumen del pedido</h3>
            {pay.items.map((it) => (
              <div key={it.slug} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <img src={it.image} alt={it.title} style={{ width: 50, height: 50, objectFit: "contain", border: "1px solid #eee", borderRadius: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, lineHeight: "1.3", marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.title}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>Cant: {it.qty} · {formatMXN(it.unitPrice)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{formatMXN(it.unitPrice * it.qty)}</div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f5f5f5", fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: "#00a650" }}>{formatMXN(pay.amount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}