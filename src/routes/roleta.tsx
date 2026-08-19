import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import bgRoleta from "@/assets/bg-roleta.webp";
import emojiStar from "@/assets/emoji-star.webp";
import emojiSweat from "@/assets/emoji-sweat.webp";
import winSound from "@/assets/ml.mp3";
import spinSound from "@/assets/roleta.mp3";

export const Route = createFileRoute("/roleta")({
  head: () => ({
    meta: [
      { title: "Roleta de Desconto" },
      { name: "description", content: "Gire a roleta e concorra a descontos exclusivos." },
      { name: "theme-color", content: "#3A3897" },
      { property: "og:title", content: "Roleta Mercado Livre" },
      { property: "og:description", content: "Gire a roleta e concorra a descontos exclusivos." },
    ],
    links: [
      { rel: "preload", as: "image", href: bgRoleta },
    ],
  }),
  component: RoletaPage,
});

const NOTIFICATIONS = [
  { name: "Amanda Santos", photo: "https://i.postimg.cc/tssLM1hF/1.jpg" },
  { name: "Carlos Oliveira", photo: "https://i.postimg.cc/DJx5rTxB/2.jpg" },
  { name: "Juliano Costa", photo: "https://i.postimg.cc/Bjr8kK1F/3.jpg" },
  { name: "Rafael Almeida", photo: "https://i.postimg.cc/qzf5BkCd/4.jpg" },
  { name: "Fernanda Lima", photo: "https://i.postimg.cc/tYqb2CSz/5.jpg" },
  { name: "Thiago Martins", photo: "https://i.postimg.cc/x8Wj92sv/11.jpg" },
  { name: "Gabriela Vieira", photo: "https://i.postimg.cc/njQDM1b0/6.jpg" },
  { name: "Pedro Henrique", photo: "https://i.postimg.cc/CR5h7LPq/7.jpg" },
  { name: "Lucas Ferreira", photo: "https://i.postimg.cc/GBXBX5rM/8.jpg" },
  { name: "Maria Silva", photo: "https://i.postimg.cc/QBgpqbnC/9.jpg" },
];
const DISCOUNTS = ["5%", "75%", "50%", "95%"];

type Confetti = { id: number; left: number; color: string; rotate: number; duration: number; delay: number };

// 8 segmentos, no sentido horário a partir do topo (0°) — cores da imagem de referência
type Segment =
  | { kind: "discount"; percent: string; bg: string; fg: string }
  | { kind: "retry"; bg: string; fg: string };

const SEGMENTS: Segment[] = [
  { kind: "discount", percent: "5%", bg: "#E63946", fg: "#fff" },      // 0°     topo
  { kind: "retry", bg: "#2E2E2E", fg: "#fff" },                         // 51.43° ← 1º giro
  { kind: "discount", percent: "95%", bg: "#F5C518", fg: "#fff" },      // 102.86° ← 2º giro (ganha)
  { kind: "discount", percent: "75%", bg: "#E63970", fg: "#fff" },      // 154.29°
  { kind: "discount", percent: "50%", bg: "#1FA69B", fg: "#fff" },      // 205.71°
  { kind: "retry", bg: "#2E2E2E", fg: "#fff" },                         // 257.14°
  { kind: "discount", percent: "25%", bg: "#20B7D6", fg: "#fff" },      // 308.57°
];

function sectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const round = (n: number) => Number(n.toFixed(4));
  const x1 = round(cx + r * Math.cos(toRad(startDeg)));
  const y1 = round(cy + r * Math.sin(toRad(startDeg)));
  const x2 = round(cx + r * Math.cos(toRad(endDeg)));
  const y2 = round(cy + r * Math.sin(toRad(endDeg)));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function RoletaSVG() {
  const cx = 200;
  const cy = 200;
  const r = 180;
  const step = 360 / SEGMENTS.length;
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: "block" }}>
      {/* aro externo preto com borda dourada */}
      <circle cx={cx} cy={cy} r={198} fill="#c9a84c" />
      <circle cx={cx} cy={cy} r={195} fill="#0a0a0a" />
      {SEGMENTS.map((seg, i) => {
        const mid = i * step;
        const start = mid - step / 2;
        const end = mid + step / 2;
        const tx = cx + r * 0.66 * Math.cos(((mid - 90) * Math.PI) / 180);
        const ty = cy + r * 0.66 * Math.sin(((mid - 90) * Math.PI) / 180);
        return (
          <g key={i}>
            <path d={sectorPath(cx, cy, r, start, end)} fill={seg.bg} stroke="#0a0a0a" strokeWidth={1} />
            <g transform={`translate(${tx} ${ty}) rotate(${mid})`}>
              {seg.kind === "discount" ? (
                <>
                  <text textAnchor="middle" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight={900} fontSize={48} fill={seg.fg} stroke="rgba(0,0,0,.55)" strokeWidth={1.2} paintOrder="stroke" y={2}>
                    {seg.percent}
                  </text>
                  <text textAnchor="middle" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight={700} fontSize={11} fill={seg.fg} stroke="rgba(0,0,0,.5)" strokeWidth={0.6} paintOrder="stroke" letterSpacing={1} y={18}>
                    DE DESCONTO
                  </text>
                </>
              ) : (
                <>
                  <text textAnchor="middle" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight={900} fontSize={32} fill={seg.fg} stroke="rgba(0,0,0,.55)" strokeWidth={1} paintOrder="stroke" y={-24}>↻</text>
                  <text textAnchor="middle" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight={800} fontSize={17} fill={seg.fg} stroke="rgba(0,0,0,.55)" strokeWidth={0.8} paintOrder="stroke" y={-2}>
                    Tente
                  </text>
                  <text textAnchor="middle" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight={800} fontSize={17} fill={seg.fg} stroke="rgba(0,0,0,.55)" strokeWidth={0.8} paintOrder="stroke" y={16}>
                    outra
                  </text>
                  <text textAnchor="middle" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight={800} fontSize={17} fill={seg.fg} stroke="rgba(0,0,0,.55)" strokeWidth={0.8} paintOrder="stroke" y={34}>
                    vez
                  </text>
                </>
              )}
            </g>
          </g>
        );
      })}
      {/* miolo branco para o botão GIRE */}
      <circle cx={cx} cy={cy} r={44} fill="#1e2ba8" stroke="#0a0a0a" strokeWidth={3} />
    </svg>
  );
}



function RoletaPage() {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [btnLabel, setBtnLabel] = useState("GIRE PARA GANHAR");
  const [showRetry, setShowRetry] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [notif, setNotif] = useState<{ name: string; photo: string; discount: string } | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);

  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const notifIndexRef = useRef(0);
  const hideNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notificações
  useEffect(() => {
    const showNotification = () => {
      const item = NOTIFICATIONS[notifIndexRef.current];
      const discount = DISCOUNTS[Math.floor(Math.random() * DISCOUNTS.length)];
      notifIndexRef.current = (notifIndexRef.current + 1) % NOTIFICATIONS.length;
      setNotif({ ...item, discount });
      setNotifVisible(true);
      if (hideNotifTimer.current) clearTimeout(hideNotifTimer.current);
      hideNotifTimer.current = setTimeout(() => setNotifVisible(false), 4000);
    };
    const start = setTimeout(() => {
      showNotification();
      const iv = setInterval(showNotification, 8000);
      (start as unknown as { _iv?: number })._iv = iv as unknown as number;
    }, 2000);
    return () => {
      clearTimeout(start);
      const iv = (start as unknown as { _iv?: number })._iv;
      if (iv) clearInterval(iv);
      if (hideNotifTimer.current) clearTimeout(hideNotifTimer.current);
    };
  }, []);

  const initAudio = () => {
    if (spinAudioRef.current) return;
    try {
      const s = new Audio(spinSound);
      s.loop = true;
      s.volume = 1;
      s.preload = "none";
      spinAudioRef.current = s;
      const w = new Audio(winSound);
      w.volume = 1;
      w.preload = "none";
      winAudioRef.current = w;
    } catch {
      // ignore
    }
  };

  const spawnConfetti = () => {
    const colors = ["#FFE600", "#3483FA", "#00a650", "#ff6b6b", "#ff9500", "#9b59b6", "#E91E8C", "#00BCD4"];
    const N = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches ? 40 : 80;
    const pieces: Confetti[] = Array.from({ length: N }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    }));
    setConfetti(pieces);
  };

  const spinWheel = () => {
    if (isSpinning || spinCount >= 2) return;
    initAudio();
    setIsSpinning(true);
    setBtnLabel("GIRANDO...");

    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch(() => {});
    }

    const currentSpin = spinCount + 1;
    setSpinCount(currentSpin);
    const step = 360 / SEGMENTS.length;
    // índice do segmento alvo: 1º giro cai no "tente outra vez" (idx 1), 2º giro cai no 95% (idx 2)
    const targetIndex = currentSpin === 1 ? 1 : 2;
    const targetRotation = 360 - step * targetIndex; // rotação absoluta (mod 360) que traz o alvo ao topo
    setRotation((r) => {
      const fullRotations = 8 * 360;
      const base = Math.ceil(r / 360) * 360; // próxima "volta cheia" a partir da posição atual
      return base + fullRotations + targetRotation;
    });

    setTimeout(() => {
      setIsSpinning(false);
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
      }
      if (currentSpin === 1) {
        setShowRetry(true);
      } else {
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          winAudioRef.current.play().catch(() => {});
        }
        spawnConfetti();
        setTimeout(() => setShowWin(true), 500);
        setBtnLabel("GIRAR");
      }
    }, 10000);
  };

  const closeRetry = () => {
    setShowRetry(false);
    setBtnLabel("GIRE PARA GANHAR");
  };

  const goToLoja = () => {
    navigate({ to: "/loja" });
  };

  const pulsing = !isSpinning && spinCount < 2;
  const disabled = isSpinning || spinCount >= 2;

  return (
    <div className="roleta-page">
      <style>{`
        .roleta-page{min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;position:relative;overflow-x:hidden}
        .roleta-page *,.roleta-page *::before,.roleta-page *::after{box-sizing:border-box;margin:0;padding:0}
        .bg-layer{position:fixed;inset:0;background-image:url('${bgRoleta}');background-size:cover;background-position:top center;z-index:0}
        .confetti-container{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}
        .confetti-piece{position:absolute;width:12px;height:12px;top:-5%;animation:confetti-fall linear forwards}
        @keyframes confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
        .main-content{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:180px 0 96px}
        .wheel-wrapper{position:relative;width:360px;height:360px;margin-bottom:16px;flex-shrink:0}
        .wheel-pointer{position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:38px;height:32px;z-index:30;pointer-events:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}
        .wheel-pointer::after{content:"";position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:26px solid #fff}
        .wheel-inner{position:relative;width:100%;height:100%}
        @keyframes wobble{0%,100%{transform:rotate(-2deg) scale(1.01)}50%{transform:rotate(2deg) scale(1.01)}}
        .wheel-inner.pulsing{animation:wobble 1.5s ease-in-out infinite}
        .wheel-img{width:100%;height:100%;display:block;transition:transform 10s cubic-bezier(.15,.85,.20,1);filter:drop-shadow(0 8px 20px rgba(0,0,0,.35))}
        .gire-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:22%;height:22%;border:4px solid #fff;border-radius:50%;background:#1e2ba8;cursor:pointer;padding:0;z-index:20;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 6px rgba(0,0,0,.4)}
        .gire-label{color:#fff;font-weight:800;font-size:16px;letter-spacing:1px}
        .gire-btn:disabled{cursor:not-allowed}
        @keyframes pulse-scale{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.08)}}
        .gire-btn.pulsing{animation:pulse-scale 1.2s ease-in-out infinite}
        .spin-btn-wrapper{width:100%;padding:0 16px}
        .btn-spin{display:block;width:100%;max-width:400px;margin:0 auto;padding:16px;border-radius:50px;border:none;background:#1e2ba8;color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px;cursor:pointer;box-shadow:0 6px 0 #141d7a,0 8px 15px rgba(0,0,0,.3);transition:background .2s,box-shadow .2s}
        .btn-spin:hover:not(:disabled){background:#2d2c75}
        .btn-spin:disabled{background:#9e9e9e;color:#ccc;cursor:not-allowed;box-shadow:none}
        @keyframes pulse-btn{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        .btn-spin.pulsing{animation:pulse-btn 1.2s ease-in-out infinite}
        @media (max-width:640px){.spin-btn-wrapper{margin-top:24px}}
        .notification-bar{position:fixed;bottom:0;left:0;right:0;background:#333;padding:12px 16px;display:flex;align-items:center;gap:12px;z-index:40;transform:translateY(100%);transition:transform .4s ease}
        .notification-bar.visible{transform:translateY(0)}
        .notif-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#555}
        .notif-text{color:#fff;font-size:14px}
        .notif-text strong{color:#FFE600}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal-box{background:#fff;border-radius:20px;width:100%;max-width:320px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.3);animation:modal-in .3s ease forwards}
        @keyframes modal-in{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
        .modal-inner{padding:24px;text-align:center}
        .modal-title{font-size:24px;font-weight:700;color:#333;margin-bottom:16px}
        .modal-emoji{width:112px;height:112px;object-fit:contain;margin:0 auto 16px;display:block}
        .modal-msg{color:#333;font-size:15px;line-height:1.6;margin-bottom:24px}
        .modal-msg .highlight-red{color:#E74C3C;font-weight:700}
        .modal-msg .highlight-green{color:#00a650;font-weight:700}
        .btn-modal{width:100%;padding:14px;border-radius:50px;border:none;background:#3A3897;color:#fff;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 0 #2a2870;transition:background .2s}
        .btn-modal:hover{background:#2d2c75}
      `}</style>

      <div className="bg-layer" />

      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}%`,
                backgroundColor: c.color,
                transform: `rotate(${c.rotate}deg)`,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="main-content">
        <div className="wheel-wrapper">
          <div className="wheel-pointer" aria-hidden="true" />
          <div className={`wheel-inner${pulsing ? " pulsing" : ""}`}>
            <div
              className="wheel-img"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <RoletaSVG />
            </div>
            
            <button
              className={`gire-btn${pulsing ? " pulsing" : ""}`}
              onClick={spinWheel}
              disabled={disabled}
              aria-label="Girar roleta"
              type="button"
            >
              <span className="gire-label">GIRE</span>
            </button>
          </div>
        </div>

        <div className="spin-btn-wrapper">
          <button
            className={`btn-spin${pulsing ? " pulsing" : ""}`}
            onClick={spinWheel}
            disabled={disabled}
            type="button"
          >
            {btnLabel}
          </button>
        </div>
      </div>

      <div className={`notification-bar${notifVisible ? " visible" : ""}`}>
        {notif?.photo ? (
          <img
            className="notif-avatar"
            src={notif.photo}
            alt=""
            loading="lazy"
            decoding="async"
            width={40}
            height={40}
          />
        ) : (
          <span className="notif-avatar" aria-hidden="true" />
        )}
        <p className="notif-text">
          {notif && (
            <>
              {notif.name} acabou de ganhar <strong>{notif.discount} de desconto!</strong>
            </>
          )}
        </p>
      </div>

      {showRetry && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-inner">
              <h2 className="modal-title">Uma pena!</h2>
              <img className="modal-emoji" src={emojiSweat} alt="Emoji triste" width={112} height={112} />
              <p className="modal-msg">
                Você foi o grande selecionado e<br />
                ganhou <span className="highlight-red">01</span> chance extra. Boa sorte!
              </p>
              <button className="btn-modal" onClick={closeRetry} type="button">
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {showWin && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-inner">
              <h2 className="modal-title">Parabéns!</h2>
              <img className="modal-emoji" src={emojiStar} alt="Emoji estrelas" width={112} height={112} />
              <p className="modal-msg">
                Você acaba de ganhar o<br />
                <span className="highlight-green">Mega Desconto de 95%</span>
              </p>
              <button className="btn-modal" onClick={goToLoja} type="button">
                Resgatar seu Prêmio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
