import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronDown, Check, Lock, ArrowLeft } from "lucide-react";
import { createFreepayPix } from "@/lib/freepay.functions";
import { lojaProducts } from "@/data/lojaProducts";
import { type LojaProduct } from "@/data/types";

import { lojaImageSrc } from "@/lib/lojaImage";
import { trackEvent, trackFieldOnce } from "@/lib/track";
import mlDesktopLogo from "@/assets/logomx2.png.asset.json";
import iconeFull from "@/assets/iconefull.png.asset.json";
import { OfferTimerBanner } from "@/components/OfferTimerBanner";




export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout - Pagamento" },
      { name: "description", content: "Finalize sua compra com segurança." },
    ],
  }),
  component: CheckoutPage,
});

type CartItem = LojaProduct & { qty: number };
const KEY = "loja_cart_v1";

function parsePrice(p: string): number {
  const cleaned = p.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
function formatMXN(v: number): string {
  return "$ " + v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function isValidCPF(v: string): boolean {
  const c = v.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let d1 = 11 - (s % 11); if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  let d2 = 11 - (s % 11); if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10]);
}
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}
function isValidPhone(v: string): boolean {
  const d = v.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}
function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
function maskCEP(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
}

type Step = 1 | 2 | 3;
type ShippingId = "standard" | "full";

function CheckoutPage() {
  
  
  const navigate = useNavigate();
  const freepayPix = useServerFn(createFreepayPix);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [openSummary, setOpenSummary] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [openIdent, setOpenIdent] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");

  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [complemento, setComplemento] = useState("");
  const [salvarEndereco, setSalvarEndereco] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [activeGateway, setActiveGateway] = useState<string | null>("freepay");

  const [cepError, setCepError] = useState("");
  const [shipping, setShipping] = useState<ShippingId>("standard");
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    const d = cep.replace(/\D/g, "");
    if (d.length !== 8) { setCepError(""); return; }
    let cancelled = false;
    setCepLoading(true);
    setCepError("");
    fetch(`https://viacep.com.br/ws/${d}/json/`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.erro) return;
        setRua(j.logradouro || "");
        setBairro(j.bairro || "");
        setCidade(j.localidade || "");
        setEstado((j.uf || "").toUpperCase());
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCepLoading(false); });
    return () => { cancelled = true; };
  }, [cep]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { slug: string; qty: number }[];
      const items = parsed
        .map((r) => {
          const p = lojaProducts.find((x) => x.slug === r.slug);
          return p ? { ...p, qty: r.qty } : null;
        })
        .filter(Boolean) as CartItem[];
      setCart(items);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => { 
    trackEvent("checkout_view"); 
    
    // InitiateCheckout Event
    const totalAmount = cart.reduce((s, x) => s + parsePrice(x.price) * x.qty, 0);
    if (totalAmount > 0) {
      const first = cart[0];
      if ((window as any).fbInitiateCheckout && !(window as any).fbInitiateCheckoutSent()) {
        (window as any).fbInitiateCheckout(
          totalAmount,
          first ? { id: first.slug, name: first.title, qty: cart.reduce((s, x) => s + x.qty, 0) } : undefined
        );
      }
    }
  }, [cart]);
  
  useEffect(() => { trackEvent("checkout_step", { step }); }, [step]);

  const total = cart.reduce((s, x) => s + parsePrice(x.price) * x.qty, 0);

  const nomeOk = nome.trim().length > 2;
  const emailOk = isValidEmail(email);
  const cpfOk = isValidCPF(cpf);
  const telefoneOk = isValidPhone(telefone);
  const step1Ok = nomeOk && emailOk && cpfOk && telefoneOk;
  const step2Ok = cep.replace(/\D/g, "").length === 8 && rua && numero && bairro && cidade && estado;

  const goPay = async () => {
    trackEvent("checkout_pay_click", { amount: Math.round(total * 100), items: cart.length });
    try {
      localStorage.setItem("deliveryAddress", JSON.stringify({ cep, rua, numero, bairro, cidade, estado }));
      localStorage.setItem("checkoutCustomer", JSON.stringify({ nome, email, cpf, telefone }));
    } catch { /* noop */ }
    setPayLoading(true);

    try {
      const utms = {
        utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "",
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
        utm_content: new URLSearchParams(window.location.search).get("utm_content") || "",
        utm_term: new URLSearchParams(window.location.search).get("utm_term") || "",
        gclid: new URLSearchParams(window.location.search).get("gclid") || "",
        fbclid: new URLSearchParams(window.location.search).get("fbclid") || "",
      };

      const res = await freepayPix({
        data: {
          amount: Math.round(total * 100),
          customer: { name: nome, email, cpf, phone: telefone },
          items: cart.map((it) => ({ title: it.title, unitPrice: parsePrice(it.price) * 100, quantity: it.qty })),
          shipping: { street: rua, streetNumber: numero, zipCode: cep, neighborhood: bairro, city: cidade, state: estado, complement: complemento },
          metadata: { ...utms }
        }
      });
      
      sessionStorage.setItem("pixPayment", JSON.stringify(res));
      navigate({ to: "/pagamento" });
    } catch (err: any) {
      alert(err.message || "Error al procesar el pago.");
    } finally {
      setPayLoading(false);
    }
  };


  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: '-apple-system,"Segoe UI",Roboto,Arial,sans-serif', color: "#333" }}>
      {payLoading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "28px 32px", borderRadius: 10, textAlign: "center", maxWidth: 320, boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 14px", border: "4px solid #E3EEFD", borderTopColor: "#3483FA", borderRadius: "50%", animation: "co-spin 1s linear infinite" }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Aguarde enquanto geramos seu pagamento...</div>
          </div>
          <style>{`@keyframes co-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <style>{`
        .co-header{background:#fff058;box-shadow:0 1px 2px rgba(0,0,0,.08)}
        .co-header-inner{max-width:1200px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .co-logo img{height:33px;width:auto;display:block}
        .co-secure{display:flex;align-items:center;gap:8px;text-transform:uppercase;font-size:13px;color:#000;line-height:1.2;text-align:right;letter-spacing:.3px;font-weight:500}
        .co-secure .top{font-size:14px;font-weight:700}
        .co-secure .bot{font-weight:500}

        .co-wrap{max-width:720px;margin:20px auto;padding:0 12px}
        .co-card{background:#fff;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.08);margin-bottom:16px;overflow:hidden}
        .co-card-body{padding:20px}
        .co-card h2{font-size:18px;font-weight:600;margin:0 0 14px;color:#333}
        .co-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#555}
        .co-total{display:flex;justify-content:space-between;padding-top:10px;margin-top:6px;border-top:1px solid #eee;font-size:18px;font-weight:700;color:#000}
        .co-btn{width:100%;height:48px;background:#3483FA;color:#fff;border:0;border-radius:6px;font-weight:600;font-size:15px;cursor:pointer}
        .co-btn:hover{background:#2968c8}
        .co-btn:disabled{background:#c9c9c9;cursor:not-allowed}
        .co-btn-secondary{width:100%;height:44px;background:#fff;color:#3483FA;border:1px solid #3483FA;border-radius:6px;font-weight:600;font-size:14px;cursor:pointer;margin-top:8px}
        .co-input{width:100%;height:44px;border:1px solid #d5d5d5;border-radius:6px;padding:0 12px;font-size:14px;box-sizing:border-box;outline:none;margin-bottom:10px}
        .co-input:focus{border-color:#3483FA}
        .co-label{display:block;font-size:13px;font-weight:600;color:#16211D;margin:0 0 6px}
        .co-err{margin:0 0 10px;color:#d93025;font-size:12px}
        .co-section-title{font-size:16px;font-weight:700;color:#16211D;margin:0 0 12px}
        .co-field{display:flex;flex-direction:column;margin-bottom:10px}
        .co-field-small{max-width:110px}
        .co-cep-row{display:flex;align-items:flex-end;gap:12px}
        .co-row-flex{display:flex;gap:10px;align-items:flex-start}
        .co-row-flex .co-field{flex:1}
        .co-link-btn{background:none;border:0;color:#3483FA;font-size:13px;cursor:pointer;padding:0 0 12px;white-space:nowrap;text-decoration:none}
        .co-link-btn:hover{text-decoration:underline}
        @media (max-width:520px){.co-row-flex{flex-wrap:wrap}.co-row-flex .co-field{flex:1 1 100%}.co-field-small{max-width:none}}
        .co-ship{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d5d5d5;border-radius:6px;margin-bottom:10px;cursor:pointer}
        .co-ship.sel{border-color:#146356;background:#E6EFEC}
        .co-ship input[type=radio]{accent-color:#146356;width:18px;height:18px;margin:0}
        .co-ship-body{flex:1}
        .co-ship-title{font-size:14px;font-weight:600;color:#16211D}
        .co-ship-sub{font-size:12px;color:#6b7570;margin-top:2px}
        .co-ship-price{font-size:14px;font-weight:700;color:#16211D}
        .co-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .progress{--ink:#16211D;--paper:#fff;--line:#DADFDA;--teal:#3483FA;--teal-soft:#E3EEFD;--muted:#8B948F;display:flex;align-items:flex-start;margin:8px auto 16px;max-width:560px;padding:0 8px}
        .progress .step{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center}
        .progress .step__row{display:flex;align-items:center;width:100%}
        .progress .connector{flex:1;height:2px;margin-top:19px;position:relative;background-image:linear-gradient(to right,var(--line) 0 6px,transparent 6px 12px);background-size:12px 2px;background-repeat:repeat-x}
        .progress .connector::after{content:"";position:absolute;inset:0;background:var(--teal);transform-origin:left;transform:scaleX(var(--fill,0));transition:transform .5s cubic-bezier(.65,0,.35,1)}
        .progress .step:first-child .connector--lead{visibility:hidden}
        .progress .step:last-child .connector--trail{visibility:hidden}
        .progress .node{width:40px;height:40px;min-width:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:14px;font-weight:600;border:2px solid var(--line);background:var(--paper);color:var(--muted);flex-shrink:0;transition:border-color .35s,background-color .35s,color .35s,box-shadow .35s}
        .progress .step[data-state="active"] .node{border-color:var(--teal);color:var(--teal);box-shadow:0 0 0 4px var(--teal-soft)}
        .progress .step[data-state="done"] .node{border-color:var(--teal);background:var(--teal);color:#fff}
        .progress .node svg{width:16px;height:16px}
        .progress .step__label{margin-top:12px;font-size:14px;font-weight:600;color:var(--ink)}
        .progress .step[data-state="pending"] .step__label{color:var(--muted)}
        .progress .step__sub{margin-top:2px;font-size:12px;color:var(--muted)}
        @media (prefers-reduced-motion: reduce){.progress .connector::after,.progress .node{transition:none}}

        .co-summary-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;cursor:pointer;user-select:none}
        .co-summary-head h2{margin:0;font-size:14px;font-weight:600;color:#333}
        .co-summary-right{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:#333}
        .co-summary-right svg{transition:transform .2s}
        .co-summary-right.open svg{transform:rotate(180deg)}
        .co-summary-body{padding:0 18px 16px;border-top:1px solid #eee}

        .ml-footer{margin-top:40px;padding:24px 20px;background:#fff;border-top:1px solid #eee;font-size:12px;color:#666;line-height:1.6;text-align:center}
        .ml-footer-copy{margin:0 0 6px;color:#333;font-weight:600}
        .ml-footer-legal{margin:0 auto;color:#888;max-width:640px}

        .lbl-short{display:none}
        .lbl-full{display:inline}
        .co-back,.co-back:hover,.co-back:focus,.co-back *{text-decoration:none !important;border-bottom:0 !important;box-shadow:none !important}
        @media (max-width:768px){
          .co-header-inner{padding:12px 14px}
          .co-wrap{padding:0 8px}
          .co-card{box-shadow:none;border:1px solid #d5d5d5}
          .co-card-body{padding:14px 18px 16px}
          .progress .step__label{font-size:13px}
          .progress .step__sub{font-size:11px}
          .lbl-full{display:none}
          .lbl-short{display:inline}
        }



      `}</style>

      <div>
        <header className="co-header">
          <div className="co-header-inner">
            <a href="/loja" className="co-logo" aria-label="Mercado Livre">
              <img src={mlDesktopLogo.url} alt="Mercado Livre" />
            </a>
            <div className="co-secure">
              <Lock size={22} strokeWidth={2.2} color="#000" />
              <div>
                <div className="top">PAGAMENTO</div>
                <div className="bot">100% SEGURO</div>
              </div>
            </div>

          </div>
        </header>
        <OfferTimerBanner />
      </div>

      <div className="co-wrap">
        <div className="progress" role="list">
          {([
            { n: 1, label: "Identificación", sub: "Tus datos" },
            { n: 2, label: "Entrega", sub: "Dirección y envío" },
            { n: 3, label: "Pago", sub: "Revisar y pagar" },
          ] as const).map((s) => {
            const state = step === s.n ? "active" : step > s.n ? "done" : "pending";
            const leadFill = step > s.n ? 1 : step === s.n ? 1 : 0;
            const trailFill = step > s.n ? 1 : 0;
            return (
              <div key={s.n} className="step" data-state={state} role="listitem">
                <div className="step__row">
                  <div className="connector connector--lead" style={{ ["--fill" as string]: leadFill }} />
                  <div className="node">{state === "done" ? <Check /> : s.n}</div>
                  <div className="connector connector--trail" style={{ ["--fill" as string]: trailFill }} />
                </div>
                <div className="step__label">{s.label}</div>
                <div className="step__sub">{s.sub}</div>
              </div>
            );
          })}
        </div>

        <div className="co-card" style={{ boxShadow: "none", border: "1px solid #d5d5d5" }}>
          <div className="co-summary-head" onClick={() => setOpenSummary((v) => !v)}>
            <h2>Resumen del pedido</h2>
            <div className={`co-summary-right ${openSummary ? "open" : ""}`}>
              <span>{formatMXN(total)}</span>
              <ChevronDown size={16} />
            </div>
          </div>
          {openSummary && (
            <div className="co-summary-body">
              {cart.map((it) => (
                <div key={it.slug} className="co-row" style={{ alignItems: "center", gap: 10 }}>
                  <img
                    src={lojaImageSrc(it.img)}
                    alt={it.title}
                    style={{ width: 48, height: 48, objectFit: "contain", background: "#fff", border: "1px solid #eee", borderRadius: 4, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, paddingRight: 10 }}>{it.title} × {it.qty}</span>
                  <span style={{ whiteSpace: "nowrap" }}>{formatMXN(parsePrice(it.price) * it.qty)}</span>
                </div>
              ))}
              <div className="co-row"><span>Envios</span><span style={{ color: "#00a650", fontWeight: 600 }}>Grátis</span></div>
              <div className="co-total"><span>Total</span><span>{formatMXN(total)}</span></div>
            </div>
          )}
        </div>

        {step >= 2 && step1Ok && (
          <div className="co-card" style={{ boxShadow: "none", border: "1px solid #d5d5d5" }}>
            <div className="co-summary-head" onClick={() => setOpenIdent((v) => !v)}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 26, height: 26, background: "#000", color: "#fff", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>1</span>
                Identificação
              </h2>
              <div className={`co-summary-right ${openIdent ? "open" : ""}`}>
                <span style={{ fontWeight: 400, color: "#6b7570", fontSize: 13 }}>{nome}</span>
                <ChevronDown size={16} />
              </div>
            </div>
            {openIdent && (
              <div className="co-summary-body" style={{ fontSize: 14, color: "#555", paddingTop: 12 }}>
                <div>{nome}</div>
                <div>{email}</div>
                <div>CPF {cpf}</div>
                <div>{telefone}</div>
                <button type="button" className="co-btn-secondary" style={{ marginTop: 10 }} onClick={() => setStep(1)}>Alterar dados</button>
              </div>
            )}
          </div>
        )}

        {step === 3 && step2Ok && (
          <div className="co-card" style={{ boxShadow: "none", border: "1px solid #d5d5d5" }}>
            <div className="co-summary-head" onClick={() => setOpenAddress((v) => !v)}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 26, height: 26, background: "#000", color: "#fff", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>2</span>
                Endereço de entrega
              </h2>
              <div className={`co-summary-right ${openAddress ? "open" : ""}`}>
                <span style={{ fontWeight: 400, color: "#6b7570", fontSize: 13 }}>{rua}, {numero}</span>
                <ChevronDown size={16} />
              </div>
            </div>
            {openAddress && (
              <div className="co-summary-body" style={{ fontSize: 14, color: "#555", paddingTop: 12 }}>
                <div>{rua}, {numero}</div>
                <div>{bairro} - {cidade}/{estado}</div>
                <div>CEP {cep}</div>
                <button type="button" className="co-btn-secondary" style={{ marginTop: 10 }} onClick={() => setStep(2)}>Alterar endereço</button>
              </div>
            )}
          </div>
        )}



        {step === 1 && (
          <div className="co-card">
            <div className="co-card-body">
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#16211D", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, height: 28, background: "#000", color: "#fff", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>1</span>
                Identificação
              </h2>
              <p style={{ margin: "0 0 18px", color: "#6b7570", fontSize: 14 }}>Informe seus dados para continuar a compra.</p>

              <label className="co-label">Nome completo</label>
              <input className="co-input" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} onBlur={() => nomeOk && trackFieldOnce("nome")} style={{ marginBottom: nome && !nomeOk ? 4 : 10, borderColor: nome && !nomeOk ? "#d93025" : undefined }} />
              {nome && !nomeOk && <p className="co-err">Informe seu nome completo.</p>}

              <label className="co-label">CPF</label>
              <input className="co-input" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} onBlur={() => cpfOk && trackFieldOnce("cpf")} type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="off" style={{ marginBottom: cpf && !cpfOk ? 4 : 10, borderColor: cpf && !cpfOk ? "#d93025" : undefined }} />
              {cpf && !cpfOk && <p className="co-err">CPF inválido.</p>}

              <label className="co-label">Telefone <span style={{ color: "#6b7570", fontWeight: 400 }}>(WhatsApp)</span></label>
              <input className="co-input" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} onBlur={() => telefoneOk && trackFieldOnce("telefone")} type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="tel" style={{ marginBottom: telefone && !telefoneOk ? 4 : 10, borderColor: telefone && !telefoneOk ? "#d93025" : undefined }} />
              {telefone && !telefoneOk && <p className="co-err">Telefone inválido.</p>}

              <label className="co-label">E-mail</label>
              <input className="co-input" placeholder="voce@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => emailOk && trackFieldOnce("email")} style={{ marginBottom: 6, borderColor: email && !emailOk ? "#d93025" : undefined }} />
              {email && !emailOk
                ? <p className="co-err" style={{ marginBottom: 14 }}>E-mail inválido.</p>
                : <p style={{ margin: "0 0 14px", color: "#8B948F", fontSize: 12 }}>Enviaremos a confirmação do pedido para este e-mail.</p>}

              <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 18px", fontSize: 13, color: "#333", cursor: "pointer" }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: "#146356" }} />
                Quero receber ofertas e novidades por e-mail.
              </label>

              <button
                type="button"
                className="co-btn"
                disabled={!step1Ok}
                onClick={() => setStep(2)}
              >
                Continuar para entrega
              </button>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button onClick={() => navigate({ to: "/loja" })} className="co-back" style={{ color: "#8B948F", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: 0, padding: 0, cursor: "pointer" }}>
                  <ArrowLeft size={12} />
                  Voltar ao carrinho
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="co-card">
            <div className="co-card-body">
              <form noValidate onSubmit={(e) => { e.preventDefault(); if (step2Ok) setStep(3); }}>
                <p className="co-section-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 28, height: 28, background: "#000", color: "#fff", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>2</span>
                  Endereço de entrega
                </p>

                <div className="co-field">
                  <label className="co-label" htmlFor="cep">CEP</label>
                  <input
                    id="cep"
                    className="co-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="00000-000"
                    autoComplete="postal-code"
                    value={cep}
                    onChange={(e) => setCep(maskCEP(e.target.value))}
                    style={{ marginBottom: 0, borderColor: cepError ? "#d93025" : undefined }}
                  />
                </div>
                {cepLoading && <p style={{ margin: "6px 0 10px", color: "#6b7570", fontSize: 12 }}>Buscando CEP...</p>}
                {cepError && <p className="co-err" style={{ marginTop: 6 }}>{cepError}</p>}

                <>
                  <></>
                    <div className="co-field">
                      <label className="co-label" htmlFor="rua">Endereço</label>
                      <input id="rua" className="co-input" placeholder="Rua, avenida..." autoComplete="address-line1" value={rua} onChange={(e) => setRua(e.target.value)} />
                    </div>
                    <div className="co-field">
                      <label className="co-label" htmlFor="numero">Número</label>
                      <input id="numero" className="co-input" placeholder="123" value={numero} onChange={(e) => setNumero(e.target.value)} />
                    </div>
                    <div className="co-field">
                      <label className="co-label" htmlFor="complemento">Complemento <span style={{ color: "#8B948F", fontWeight: 400 }}>(opcional)</span></label>
                      <input id="complemento" className="co-input" placeholder="Apto, bloco, referência..." autoComplete="address-line2" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
                    </div>
                    <div className="co-field">
                      <label className="co-label" htmlFor="bairro">Bairro</label>
                      <input id="bairro" className="co-input" placeholder="Seu bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                    </div>
                    <div className="co-field">
                      <label className="co-label" htmlFor="cidade">Cidade</label>
                      <input id="cidade" className="co-input" placeholder="Sua cidade" autoComplete="address-level2" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                    </div>
                    <div className="co-field">
                      <label className="co-label" htmlFor="uf">UF</label>
                      <input id="uf" className="co-input" placeholder="SP" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 18px", fontSize: 13, color: "#333", cursor: "pointer" }}>
                      <input type="checkbox" checked={salvarEndereco} onChange={(e) => setSalvarEndereco(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#146356" }} />
                      Salvar este endereço para próximas compras.
                    </label>

                    <p className="co-section-title">Forma de envio</p>
                    <div role="radiogroup" aria-label="Forma de envio">
                      <label className={`co-ship ${shipping === "standard" ? "sel" : ""}`}>
                        <input type="radio" name="frete" value="standard" checked={shipping === "standard"} onChange={() => setShipping("standard")} />
                        <div className="co-ship-body">
                          <div className="co-ship-title">Frete Grátis</div>
                          <div className="co-ship-sub">Chega em 4 a 7 dias úteis</div>
                        </div>
                        <div className="co-ship-price" style={{ color: "#00a650" }}>Grátis</div>
                      </label>
                      <label className={`co-ship ${shipping === "full" ? "sel" : ""}`}>
                        <input type="radio" name="frete" value="full" checked={shipping === "full"} onChange={() => setShipping("full")} />
                        <div className="co-ship-body">
                          <div className="co-ship-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <img src={iconeFull.url} alt="Full" style={{ height: 22, width: "auto" }} />
                          </div>
                          <div className="co-ship-sub">Chegará amanhã</div>
                        </div>
                        <div className="co-ship-price">R$ 16,93</div>
                      </label>
                    </div>
                </>

                <button type="submit" className="co-btn" disabled={!step2Ok} style={{ marginTop: 14 }}>Continuar para pagamento</button>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button type="button" onClick={() => setStep(1)} className="co-back" style={{ background: "none", border: 0, color: "#8B948F", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <ArrowLeft size={12} />
                    Voltar para identificação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {step === 3 && (
          <div className="co-card">
            <div className="co-card-body">
              <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, height: 28, background: "#000", color: "#fff", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>3</span>
                Escolha como pagar
              </h2>
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                Nenhum método de pagamento disponível no momento.
              </div>
              <button type="button" className="co-btn" onClick={goPay} disabled={true}>Finalizar Compra</button>
            </div>
          </div>
        )}




      </div>


      <footer className="ml-footer">
        <p className="ml-footer-copy">© 1999-2026. Mercado Brasil Ltda.</p>
        <p className="ml-footer-legal">CNPJ n.º 03.007.771/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Brasil.</p>
      </footer>

    </div>

  );
}
