import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { trackEvent } from "@/lib/track";
import mlDesktopLogo from "@/assets/logomx2.png.asset.json";
import pixHand from "@/assets/pix-hand.png.asset.json";
import { OfferTimerBanner } from "@/components/OfferTimerBanner";

export const Route = createFileRoute("/pagamento")({
  head: () => ({
    meta: [
      { title: "Pagamento PIX - Mercado Livre" },
      { name: "description", content: "Finalize seu pagamento via PIX." },
    ],
  }),
  component: PagamentoPage,
});

type PixItem = { slug: string; title: string; image: string; qty: number; unitPrice: number };
type PixPayment = {
  transactionId: string;
  qrcode: string;
  amount: number;
  expirationDate: string;
  customerName: string;
  items?: PixItem[];
};

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PagamentoPage() {
  const [pay, setPay] = useState<PixPayment | null>(null);
  const [remaining, setRemaining] = useState(29 * 60 + 53);
  const [copied, setCopied] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    // A opção de anexar comprovante deve ser exibida após 20 segundos
    const t = setTimeout(() => setShowUpload(true), 20000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pixPayment") || localStorage.getItem("pixPayment");
      if (!raw) { window.location.href = "/checkout"; return; }
      const parsed = JSON.parse(raw);
      setPay(parsed);
      trackEvent("pagamento_view", { transactionId: String(parsed?.transactionId ?? "") });
    } catch { window.location.href = "/checkout"; }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll order status; fire Google Ads + GA4 Purchase when paid
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
          const value = Number(r.amount ?? pay.amount ?? 0);
          const w = window as any;
          if (typeof w.gtag === "function") {
            w.gtag("event", "conversion", {
              send_to: "AW-18267532945/M09HCP3G8cwcEJHd0YZE",
              value,
              currency: "BRL",
              transaction_id: String(pay.transactionId),
            });
            w.gtag("event", "purchase", {
              transaction_id: String(pay.transactionId),
              value,
              currency: "BRL",
            });
          }
          if (typeof w.fbPurchase === "function") {
            w.fbPurchase(value, String(pay.transactionId));
          }
          if (typeof w.utmifyTrack === "function") {
            w.utmifyTrack("Purchase", {
              value: value,
              order_id: String(pay.transactionId),
              currency: "BRL"
            });
          }
          sessionStorage.setItem(firedKey, "1");
          stopped = true;
        }
      } catch { /* ignore transient errors */ }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { stopped = true; clearInterval(iv); };
  }, [pay?.transactionId, pay?.amount]);


  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const copyCode = async () => {
    if (!pay) return;
    try {
      // Tenta usar a Clipboard API moderna
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pay.qrcode);
      } else {
        // Fallback para navegadores mobile mais antigos ou contextos não seguros
        const textArea = document.createElement("textarea");
        textArea.value = pay.qrcode;
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
      trackEvent("pix_copied", { transactionId: String(pay.transactionId) });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Erro ao copiar PIX:", err);
      // Fallback final via prompt para garantir que o usuário consiga o código
      window.prompt("Pressione Ctrl+C ou mantenha pressionado para copiar o código PIX:", pay.qrcode);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: '-apple-system,"Segoe UI",Roboto,Arial,sans-serif', color: "#333" }}>
      <style>{`
        .pg-header{background:#fff058;box-shadow:0 1px 2px rgba(0,0,0,.08)}
        .pg-header-inner{max-width:1200px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .pg-logo img{height:33px;width:auto;display:block}
        .pg-secure{display:flex;align-items:center;gap:8px;text-transform:uppercase;font-size:13px;color:#000;text-align:right;font-weight:500}
        .pg-secure .top{font-size:14px;font-weight:700}
        .pg-wrap{width:95%;max-width:520px;margin:20px auto;background:#fff;border-radius:10px;padding:24px 22px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
        .pg-hand{width:92px;height:92px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border-radius:50%;background:#e3f2fd;color:#3483FA}
        .pg-title{font-size:22px;font-weight:700;color:#333;margin:0 0 8px;text-align:center}
        .pg-sub{font-size:14px;color:#555;margin:0 0 8px;text-align:center;line-height:1.5}
        .pg-sub b{color:#3483FA}
        .pg-wait{display:flex;align-items:center;justify-content:center;gap:8px;margin:18px 0 14px;padding:10px;background:#e3f2fd;color:#1976d2;border-radius:6px;font-size:14px;font-weight:500}
        .pg-wait-dot{width:10px;height:10px;border-radius:50%;background:#1976d2;animation:pg-pulse 1.2s ease-in-out infinite}
        @keyframes pg-pulse{50%{opacity:.3}}
        .pg-code-label{font-size:14px;font-weight:600;color:#333;margin:16px 0 8px}
        .pg-code{background:#f5f5f5;border:1px dashed #ccc;border-radius:6px;padding:12px;font-family:'Courier New',monospace;font-size:12px;color:#333;word-break:break-all;max-height:110px;overflow-y:auto}
        .pg-copy{width:100%;background:#3483FA;color:#fff;border:0;padding:14px;border-radius:6px;font-weight:600;font-size:15px;cursor:pointer;margin-top:12px}
        .pg-copy:hover{background:#2968c8}
        .pg-copy.copied{background:#00a650}
        .pg-value{text-align:center;margin:18px 0 8px;font-weight:600;font-size:18px;color:#333}
        .pg-value span{color:#00a650;font-size:22px}
        .pg-proof{margin-top:20px;padding:18px;background:#f5f5f5;border-radius:8px;text-align:center}
        .pg-proof-t{font-weight:600;font-size:15px;color:#333;margin:0 0 4px}
        .pg-proof-sub{font-size:12px;color:#777;margin:0 0 14px}
        .pg-file-input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none}
        .pg-file-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#fff;color:#3483FA;border:1.5px solid #3483FA;padding:11px 20px;border-radius:6px;font-weight:600;font-size:14px;cursor:pointer;transition:background .15s}
        .pg-file-btn:hover{background:#eef4ff}
        .pg-file-btn.disabled{opacity:.6;cursor:not-allowed}
        .pg-file-name{margin-top:10px;font-size:13px;color:#555;word-break:break-all}
        .pg-upload-msg{margin-top:10px;font-size:13px}
        .pg-steps{margin-top:24px;padding-top:20px;border-top:1px solid #eee}
        .pg-steps h3{font-size:16px;font-weight:700;color:#333;margin:0 0 14px}
        .pg-step{display:flex;gap:12px;margin-bottom:14px;font-size:14px;color:#555;line-height:1.5;align-items:flex-start}
        .pg-num{background:#3483FA;color:#fff;width:26px;height:26px;min-width:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px}
        .pg-hand-img{display:block;width:180px;height:auto;margin:0 auto 8px}
        .pg-summary{margin-top:24px;padding-top:20px;border-top:1px solid #eee}
        .pg-summary h3{font-size:16px;font-weight:700;color:#333;margin:0 0 14px}
        .pg-item{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0}
        .pg-item:last-child{border-bottom:0}
        .pg-item img{width:56px;height:56px;object-fit:contain;background:#fafafa;border-radius:6px;flex-shrink:0}
        .pg-item-info{flex:1;min-width:0}
        .pg-item-title{font-size:13px;color:#333;line-height:1.4;margin:0 0 4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .pg-item-meta{font-size:12px;color:#777}
        .pg-item-price{font-size:14px;font-weight:600;color:#333;white-space:nowrap;align-self:center}
        .pg-total{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid #eee;font-size:16px;font-weight:700;color:#333}
        .pg-total span{color:#00a650;font-size:18px}
      `}</style>

      <div>
        <header className="pg-header">
          <div className="pg-header-inner">
            <a href="/loja" className="pg-logo" aria-label="Mercado Livre">
              <img src={mlDesktopLogo.url} alt="Mercado Livre" />
            </a>
            <div className="pg-secure">
              <Lock size={22} strokeWidth={2.2} color="#000" />
              <div>
                <div className="top">PAGAMENTO</div>
                <div>100% SEGURO</div>
              </div>
            </div>
          </div>
        </header>
        <OfferTimerBanner />
      </div>

      <div className="pg-wrap">
        <h1 className="pg-title">Já é quase seu...</h1>
        <p className="pg-sub">Pague seu pix dentro de <b>{mm}:{ss}</b> para garantir sua compra.</p>

        <div className="pg-wait">
          <span className="pg-wait-dot" />
          Aguardando pagamento ...
        </div>

        {pay?.qrcode && (
          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pay.qrcode)}`} 
              alt="QR Code PIX"
              style={{ width: 180, height: 180, border: "1px solid #eee", borderRadius: "8px", padding: "8px" }}
            />
          </div>
        )}

        <div className="pg-code-label">Código PIX Copia e Cola</div>
        <div className="pg-code">{pay?.qrcode || "Carregando..."}</div>
        <button type="button" className={`pg-copy ${copied ? "copied" : ""}`} onClick={copyCode}>
          {copied ? "Código copiado!" : "Copiar código pix"}
        </button>

        <div className="pg-value">Valor do Pix: <span>{formatBRL(pay?.amount || 0)}</span></div>

        {showUpload && (
          <div className="pg-proof">
            <div className="pg-proof-t">Pagou seu pedido e ainda não foi confirmado?</div>
            <div className="pg-proof-sub">Anexe o comprovante agora para agilizarmos a sua entrega.</div>
            {(() => {
              const disabled = uploadState === "uploading" || uploadState === "done" || !pay;
              return (
                <label className={`pg-file-btn ${disabled ? "disabled" : ""}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {uploadState === "uploading" ? "Enviando..." : uploadState === "done" ? "Enviado com sucesso!" : "Anexar Comprovante"}
                  <input
                    type="file"
                    className="pg-file-input"
                    accept="image/*,application/pdf"
                    disabled={disabled}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !pay) return;
                      setFileName(file.name);
                      trackEvent("receipt_selected", { name: file.name, size: file.size, type: file.type });
                      if (file.size > 8 * 1024 * 1024) { setUploadState("error"); setUploadMsg("Arquivo maior que 8MB"); return; }
                      setUploadState("uploading"); setUploadMsg("Enviando comprovante...");
                      try {
                        const b64 = await new Promise<string>((res, rej) => {
                          const r = new FileReader();
                          r.onload = () => res(String(r.result).split(",")[1] ?? "");
                          r.onerror = () => rej(new Error("read fail"));
                          r.readAsDataURL(file);
                        });
                        const { uploadReceipt } = await import("@/lib/orders.functions");
                        await uploadReceipt({ data: {
                          transactionId: String(pay.transactionId),
                          filename: file.name,
                          contentType: file.type || "application/octet-stream",
                          dataBase64: b64,
                        }});
                        setUploadState("done"); setUploadMsg("Comprovante recebido! Estamos validando.");
                        trackEvent("receipt_uploaded", { transactionId: String(pay.transactionId) });
                      } catch (err: any) {
                        setUploadState("error"); setUploadMsg(err?.message || "Falha no envio");
                        trackEvent("receipt_upload_error", { message: String(err?.message ?? err) });
                      }
                    }}
                  />
                </label>
              );
            })()}
            {fileName && uploadState !== "done" && (
              <div className="pg-file-name">{fileName}</div>
            )}
            {uploadMsg && (
              <div className="pg-upload-msg" style={{ color: uploadState === "error" ? "#c00" : uploadState === "done" ? "#00a650" : "#555" }}>
                {uploadMsg}
              </div>
            )}
          </div>
        )}


        <div className="pg-steps">
          <h3>Como pagar o pix:</h3>
          <div className="pg-step"><div className="pg-num">1</div><div>Clique em copiar o código PIX, logo acima</div></div>
          <div className="pg-step"><div className="pg-num">2</div><div>Acesse o app do seu banco</div></div>
          <div className="pg-step"><div className="pg-num">3</div><div>Vá até a opção PIX</div></div>
          <div className="pg-step"><div className="pg-num">4</div><div>Escolha a opção "COPIA E COLA"</div></div>
          <div className="pg-step"><div className="pg-num">5</div><div>Insira o código copiado e finalize seu pagamento</div></div>
        </div>

        {pay?.items && pay.items.length > 0 && (
          <div className="pg-summary">
            <h3>Resumo do pedido</h3>
            {pay.items.map((it) => (
              <div className="pg-item" key={it.slug}>
                <img src={it.image} alt={it.title} loading="lazy" decoding="async" />
                <div className="pg-item-info">
                  <div className="pg-item-title">{it.title}</div>
                  <div className="pg-item-meta">Qtd: {it.qty} · {formatBRL(it.unitPrice)}</div>
                </div>
                <div className="pg-item-price">{formatBRL(it.unitPrice * it.qty)}</div>
              </div>
            ))}
            <div className="pg-total">Total <span>{formatBRL(pay.amount || 0)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
