import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import banner25Anos from "@/assets/banner-25anos-v2-local.webp";
import mlLogo from "@/assets/ml-logo-local.webp";
import promo1 from "@/assets/ml-promo-1.webp";
import promo2 from "@/assets/ml-promo-2.webp";
import promo3 from "@/assets/ml-promo-3.webp";
import promo4 from "@/assets/ml-promo-4.webp";
import promo5 from "@/assets/ml-promo-5.webp";
import promo6 from "@/assets/ml-promo-6.webp";

const BANNER_25_ANOS = banner25Anos;

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Bienvenido" },
      { name: "description", content: "¡Responde y gana!" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#FFE600" },
      { property: "og:title", content: "Bienvenido" },
      { property: "og:description", content: "¡Responde y gana!" },
    ],
    links: [
      { rel: "apple-touch-icon", href: "data:," },
      { rel: "preload", as: "image", href: BANNER_25_ANOS, fetchPriority: "high" },
      { rel: "preload", as: "image", href: promo1, fetchPriority: "high" },
      { rel: "preload", as: "image", href: mlLogo },
      { rel: "prefetch", as: "image", href: promo2 },
      { rel: "prefetch", as: "image", href: promo3 },
      { rel: "prefetch", as: "image", href: promo4 },
      { rel: "prefetch", as: "image", href: promo5 },
      { rel: "prefetch", as: "image", href: promo6 },
    ],
  }),
  component: Index,
});

type Question = {
  text: string;
  image: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  {
    text: "¿Con qué frecuencia compras en Mercado Libre?",
    image: promo1,
    options: ["Cada semana", "Cada mes", "Pocas veces", "Primera vez"],
  },
  {
    text: "¿Qué categoría compras más?",
    image: promo2,
    options: ["Electrónicos", "Moda", "Hogar", "Belleza"],
  },
  {
    text: "¿Usas Mercado Pago?",
    image: promo3,
    options: ["Siempre", "A veces", "Raramente", "Nunca"],
  },
  {
    text: "¿Cómo evalúas la entrega?",
    image: promo4,
    options: ["Excelente", "Buena", "Regular", "Mala"],
  },
  {
    text: "¿Lo recomendarías a un amigo?",
    image: promo5,
    options: ["Con seguridad", "Probablemente", "Tal vez", "No"],
  },
];

function Index() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const progress = useMemo(
    () => Math.round(((step + (selected !== null ? 1 : 0)) / QUESTIONS.length) * 100),
    [step, selected],
  );

  const handleNext = () => {
    
    if (step + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setStep(step + 1);
      setSelected(null);
    }
  };

  const q = QUESTIONS[step];

  return (
    <div className="ml-page">
      <style>{css}</style>
      <header>
        <img
          src={mlLogo}
          alt="Mercado Livre"
          width={168}
          height={56}
          decoding="async"
          fetchPriority="high"
        />


        <div className="menu-icon" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>

      <main>
        {!done ? (
          <>
            <div className="card">
            <img src={BANNER_25_ANOS} alt="Especial 25 Anos Mercado Livre" className="promo-banner-top" width={800} height={300} decoding="async" fetchPriority="high" />


            <div className="progress-row">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }}>
                  <div className="progress-dot"></div>
                </div>
              </div>
              <div className="progress-label">{progress} %</div>
            </div>

            <img
              src={q.image}
              alt=""
              className="question-img"
              width={800}
              height={500}
              decoding="async"
              fetchPriority="high"
            />

            <p className="question-text">{q.text}</p>

            <div className="options-grid">
              {q.options.map((opt, i) => (
                <button
                  type="button"
                  key={opt}
                  className={`option-btn ${selected === i ? "selected" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button type="button" className="btn-next" onClick={handleNext}>
              Próximo
            </button>
            </div>
            
          </>
        ) : (
          <CongratsScreen />
        )}
      </main>
    </div>
  );
}

function CongratsScreen() {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: ["#FFE600", "#3483FA", "#00a650", "#ff4d4d", "#ff9900"][i % 5],
    })),
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <div className="card">
        <h1 className="congrats-title">Parabéns!</h1>
        <div className="congrats-emojis">🎉 🎊 🎉</div>
        <img
          src={promo6}
          alt=""
          className="congrats-img"
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
        />
        <p className="congrats-msg">
          Como forma de agradecimento, você ganhou um acesso grátis à nossa promoção
          <strong> &quot;do Mercado Livre&quot;</strong> nele você pode escolher <strong>rodar 2 vezes a roleta</strong>, aproveite!
        </p>
        <p className="congrats-sub">
          Esperamos que você aproveite ao máximo cada produto e que eles tragam ainda mais diversão
          para você e sua família.
        </p>
        <Link to="/roleta" className="btn-claim">Resgatar Agora</Link>
      </div>

      <div className="confetti-container" aria-hidden="true">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

const css = `
.ml-page *, .ml-page *::before, .ml-page *::after { box-sizing: border-box; }
.ml-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; min-height: 100dvh; display: flex; flex-direction: column; overflow-x: hidden; -webkit-tap-highlight-color: transparent; -webkit-font-smoothing: antialiased; text-rendering: optimizeSpeed; touch-action: manipulation; overscroll-behavior: none; }
.ml-page header { background: #FFE600; padding: 6px 14px; display: grid; grid-template-columns: 24px 1fr 24px; align-items: center; flex-shrink: 0; padding-top: max(6px, env(safe-area-inset-top)); }
.ml-page header img { height: 56px; width: auto; display: block; }
.ml-page header > img { grid-column: 2; justify-self: center; }
.ml-page .menu-icon { grid-column: 3; width: 24px; height: 24px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.ml-page .menu-icon span { display: block; height: 2.5px; background: #333; border-radius: 2px; }
.ml-page main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 12px max(16px, env(safe-area-inset-bottom)); padding-top: 0; }
@media (max-width: 640px) { .ml-page main { justify-content: flex-start; padding-top: 8px; } }
.ml-page .promo-banner { width: 100vw; height: auto; display: block; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); }
.ml-page .card { background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,.10); width: 100%; max-width: 448px; display: flex; flex-direction: column; overflow: hidden; border-radius: 16px; }
.ml-page .card > *:not(.promo-banner-top) { padding-left: 14px; padding-right: 14px; }
.ml-page .promo-banner-top { width: 100%; height: auto; display: block; border-radius: 0; margin: 0 0 12px; flex-shrink: 0; }
.ml-page .banner-top { background: #FFE600; color: #333; font-weight: 700; padding: 10px; text-align: center; font-size: 16px; margin-bottom: 10px; }
.ml-page .progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-left: 10px; }
.ml-page .progress-track { flex: 1; height: 6px; background: #e0e0e0; border-radius: 99px; position: relative; overflow: visible; }
.ml-page .progress-fill { height: 100%; background: #FFE600; border-radius: 99px; transition: width .5s ease; position: relative; }
.ml-page .progress-dot { position: absolute; right: -10px; top: 50%; width: 20px; height: 20px; background: #FFE600; border-radius: 50%; transform: translateY(-50%); box-shadow: 0 1px 4px rgba(0,0,0,.15); }
.ml-page .progress-label { color: #3483FA; font-weight: 700; font-size: 12px; min-width: 38px; text-align: right; }
.ml-page .question-img { width: 100%; height: auto; border-radius: 12px; object-fit: contain; box-shadow: 0 2px 10px rgba(0,0,0,.10); margin-bottom: 14px; }
.ml-page .question-text { color: #333; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 14px; line-height: 1.35; padding: 0 6px; }
.ml-page .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.ml-page .option-btn { padding: 12px 10px; border-radius: 50px; border: 1.5px solid #ccc; background: #fff; color: #555; font-size: 14px; font-weight: 500; transition: border-color .15s, background .15s, color .15s; text-align: center; -webkit-appearance: none; appearance: none; }
.ml-page .option-btn.selected { border: 2px solid #3483FA; background: rgba(52,131,250,.05); color: #3483FA; }
.ml-page .option-btn:active { background: #f2f2f2; }
.ml-page .btn-next { display: block; width: calc(100% - 40px); margin: 0 auto 14px; padding: 14px; border-radius: 50px; border: none; background: #FFE600; color: #333; font-size: 19px; font-weight: 700; -webkit-appearance: none; appearance: none; }
.ml-page .btn-next:active { background: #f0d800; }
.ml-page .congrats-title { font-size: 32px; font-weight: 900; text-align: center; background: linear-gradient(to right, #3483FA, #00a650, #FFE600); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-top: 14px; margin-bottom: 6px; }
.ml-page .congrats-emojis { text-align: center; font-size: 22px; margin-bottom: 12px; letter-spacing: 4px; }
.ml-page .congrats-img { width: 100%; height: auto; border-radius: 12px; object-fit: contain; box-shadow: 0 2px 10px rgba(0,0,0,.10); margin-bottom: 14px; }
.ml-page .congrats-msg { color: #333; font-size: 14px; line-height: 1.55; text-align: center; margin-bottom: 8px; }
.ml-page .congrats-sub { color: #666; font-size: 13px; line-height: 1.55; text-align: center; margin-bottom: 14px; }
.ml-page .btn-claim { display: block; width: 100%; padding: 14px; border-radius: 50px; border: none; background: #3483FA; color: #fff; font-size: 17px; font-weight: 700; box-shadow: 0 4px 14px rgba(52,131,250,.35); -webkit-appearance: none; appearance: none; text-align: center; text-decoration: none; margin-bottom: 14px; }
.ml-page .btn-claim:active { background: #2968c8; }
.ml-page .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 50; overflow: hidden; contain: strict; }
.ml-page .confetti-piece { position: absolute; width: 10px; height: 10px; top: -5%; will-change: transform, opacity; animation: ml-confetti-fall linear forwards; }
@keyframes ml-confetti-fall { 0% { transform: translate3d(0,0,0) rotate(0deg); opacity: 1; } 100% { transform: translate3d(0,105vh,0) rotate(720deg); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ml-page * { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
`;

