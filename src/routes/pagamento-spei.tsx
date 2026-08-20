import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { trackEvent } from "@/lib/track";
import mlDesktopLogo from "@/assets/logomx2.png.asset.json";
import { OfferTimerBanner } from "@/components/OfferTimerBanner";

export const Route = createFileRoute("/pagamento-spei")({
  head: () => ({
    meta: [
      { title: "Pago SPEI - Mercado Livre" },
      { name: "description", content: "Finalice su pago vía SPEI." },
    ],
  }),
  component: PagamentoSpeiPage,
});

type SpeiItem = { slug: string; title: string; image: string; qty: number; unitPrice: number };
type SpeiPayment = {
  id: string;
  clabe: string;
  instructions: any;
  amount: number;
  items?: SpeiItem[];
};

function formatMXN(v: number): string {
  return "$ " + v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PagamentoSpeiPage() {
  const [pay, setPay] = useState<SpeiPayment | null>(null);
  const [remaining, setRemaining] = useState(29 * 60 + 53);
  const [copied, setCopied] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setShowUpload(true), 20000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("speiPayment");
      if (!raw) { window.location.href = "/checkout"; return; }
      const parsed = JSON.parse(raw);
      setPay(parsed);
      trackEvent("pagamento_spei_view", { transactionId: String(parsed?.id ?? "") });
    } catch { window.location.href = "/checkout"; }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!pay?.id) return;
    let stopped = false;
    const firedKey = `purchaseFired:${pay.id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(firedKey)) return;

    const check = async () => {
      try {
        const { getOrderStatus } = await import("@/lib/orders.functions");
        const r = await getOrderStatus({ data: { transactionId: String(pay.id) } });
        if (stopped) return;
        if (r.status === "paid" || r.status === "receipt_uploaded") {
          const value = Number(r.amount ?? pay.amount ?? 0);
          const w = window as any;
          if (typeof w.gtag === "function") {
            w.gtag("event", "conversion", {
              send_to: "AW-18267532945/M09HCP3G8cwcEJHd0YZE",
              value,
              currency: "MXN",
              transaction_id: String(pay.id),
            });
            w.gtag("event", "purchase", {
              transaction_id: String(pay.id),
              value,
              currency: "MXN",
            });
          }
          if (typeof w.fbPurchase === "function") {
            w.fbPurchase(value, String(pay.id));
          }
          if (typeof w.utmifyTrack === "function") {
            w.utmifyTrack("Purchase", {
              value: value,
              order_id: String(pay.id),
              currency: "MXN"
            });
          }
          sessionStorage.setItem(firedKey, "1");
          stopped = true;
        }
      } catch { /* ignore */ }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { stopped = true; clearInterval(iv); };
  }, [pay?.id, pay?.amount]);

  const copyClabe = async () => {
    if (!pay?.clabe) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pay.clabe);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = pay.clabe;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      trackEvent("spei_clabe_copied", { transactionId: String(pay.id) });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      window.prompt("Copie la CLABE:", pay.clabe);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pay) return;
    setUploadMsg("");
    if (file.size > 8 * 1024 * 1024) {
      setUploadState("error");
      setUploadMsg("Archivo mayor a 8MB");
      return;
    }
    setUploadState("uploading");
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1] ?? "");
        r.onerror = () => rej(new Error("read fail"));
        r.readAsDataURL(file);
      });
      const { uploadReceipt } = await import("@/lib/orders.functions");
      await uploadReceipt({
        data: {
          transactionId: String(pay.id),
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          dataBase64: b64,
        },
      });
      setUploadState("done");
      setUploadMsg("¡Comprobante recibido! Estamos validando.");
      trackEvent("receipt_uploaded_spei", { transactionId: String(pay.id) });
    } catch (err: any) {
      setUploadState("error");
      setUploadMsg(err?.message || "Error al enviar");
    }
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: '-apple-system,"Segoe UI",Roboto,Arial,sans-serif', color: "#333" }}>
      <style>{`
        .pg-header{background:#fff058;box-shadow:0 1px 2px rgba(0,0,0,.08)}
        .pg-header-inner{max-width:1200px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .pg-logo img{height:33px;width:auto;display:block}
        .pg-secure{display:flex;align-items:center;gap:8px;text-transform:uppercase;font-size:13px;color:#000;text-align:right;font-weight:500}
        .pg-secure .top{font-size:14px;font-weight:700}
        .pg-wrap{width:95%;max-width:520px;margin:20px auto;background:#fff;border-radius:10px;padding:24px 22px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
        .pg-title{font-size:22px;font-weight:700;color:#333;margin:0 0 8px;text-align:center}
        .pg-sub{font-size:14px;color:#555;margin:0 0 8px;text-align:center;line-height:1.5}
        .pg-sub b{color:#3483FA}
        .pg-wait{display:flex;align-items:center;justify-content:center;gap:8px;margin:18px 0 14px;padding:10px;background:#e3f2fd;color:#1976d2;border-radius:6px;font-size:14px;font-weight:500}
        .pg-clabe-box{background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:16px;margin:20px 0;text-align:center}
        .pg-clabe-label{font-size:12px;color:#777;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
        .pg-clabe-value{font-size:24px;font-weight:700;color:#333;letter-spacing:2px;margin-bottom:12px}
        .pg-copy{width:100%;background:#3483FA;color:#fff;border:0;padding:14px;border-radius:6px;font-weight:600;font-size:15px;cursor:pointer}
        .pg-copy.copied{background:#00a650}
        .pg-value{text-align:center;margin:18px 0 8px;font-weight:600;font-size:18px;color:#333}
        .pg-value span{color:#00a650;font-size:22px}
        .pg-steps{margin-top:24px;padding-top:20px;border-top:1px solid #eee}
        .pg-step{display:flex;gap:12px;margin-bottom:14px;font-size:14px;color:#555;align-items:flex-start}
        .pg-num{background:#3483FA;color:#fff;width:26px;height:26px;min-width:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px}
        .pg-proof{margin-top:20px;padding:18px;background:#f5f5f5;border-radius:8px;text-align:center}
        .pg-proof-t{font-weight:600;font-size:15px;color:#333;margin:0 0 4px}
        .pg-proof-sub{font-size:12px;color:#777;margin:0 0 14px}
        .pg-file-input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none}
        .pg-file-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#fff;color:#3483FA;border:1.5px solid #3483FA;padding:11px 20px;border-radius:6px;font-weight:600;font-size:14px;cursor:pointer;transition:background .15s}
        .pg-file-btn:hover{background:#eef4ff}
        .pg-file-btn.disabled{opacity:.6;cursor:not-allowed}
        .pg-upload-msg{margin-top:10px;font-size:13px}
      `}</style>

      <header className="pg-header">
        <div className="pg-header-inner">
          <a href="/loja" className="pg-logo"><img src={mlDesktopLogo.url} alt="Logo" /></a>
          <div className="pg-secure"><Lock size={20} /><div><div className="top">PAGO</div><div>100% SEGURO</div></div></div>
        </div>
      </header>
      <OfferTimerBanner />

      <div className="pg-wrap">
        <h1 className="pg-title">Finaliza tu pago SPEI</h1>
        <p className="pg-sub">Realiza la transferencia dentro de <b>{mm}:{ss}</b></p>

        <div className="pg-wait">Esperando confirmación...</div>

        <div className="pg-clabe-box">
          <div className="pg-clabe-label">CLABE Interbancaria</div>
          <div className="pg-clabe-value">{pay?.clabe || "Generando..."}</div>
          <button className={`pg-copy ${copied ? "copied" : ""}`} onClick={copyClabe}>
            {copied ? "¡CLABE Copiada!" : "Copiar CLABE"}
          </button>
        </div>

        <div className="pg-value">Monto a pagar: <span>{formatMXN(pay?.amount || 0)}</span></div>

        {showUpload && (
          <div className="pg-proof">
            <div className="pg-proof-t">¿Ya pagaste y no se ha confirmado?</div>
            <div className="pg-proof-sub">Adjunta tu comprobante para agilizar el proceso.</div>
            <label className={`pg-file-btn ${uploadState === "uploading" || uploadState === "done" ? "disabled" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {uploadState === "uploading" ? "Enviando..." : uploadState === "done" ? "¡Enviado!" : "Adjuntar Comprobante"}
              <input type="file" className="pg-file-input" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploadState === "uploading" || uploadState === "done"} />
            </label>
            {uploadMsg && <div className="pg-upload-msg" style={{ color: uploadState === "error" ? "#d93025" : "#00a650" }}>{uploadMsg}</div>}
          </div>
        )}

        <div className="pg-steps">
          <h3>Instrucciones:</h3>
          <div className="pg-step"><div className="pg-num">1</div><div>Copia la CLABE de arriba</div></div>
          <div className="pg-step"><div className="pg-num">2</div><div>Entra a tu app bancaria</div></div>
          <div className="pg-step"><div className="pg-num">3</div><div>Realiza una transferencia SPEI</div></div>
          <div className="pg-step"><div className="pg-num">4</div><div>Usa la CLABE y el monto exacto</div></div>
        </div>
      </div>
    </div>
  );
}