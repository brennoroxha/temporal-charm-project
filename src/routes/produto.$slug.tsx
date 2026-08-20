import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { lojaProducts } from "@/data/lojaProducts";
import { type LojaProduct } from "@/data/types";
import { lojaGallery } from "@/data/lojaGallery";
import { lojaReviews } from "@/data/lojaReviews";
import { ShoppingCart, Truck, ShieldCheck, RotateCcw, Star, ThumbsUp, ThumbsDown, Award, Heart, Share2, BadgeCheck, Loader2, ArrowLeft } from "lucide-react";
import { LojaHeader } from "@/components/LojaHeader";
import { OfferTimerBanner } from "@/components/OfferTimerBanner";
const AddedToCartModal = lazy(() =>
  import("@/components/AddedToCartModal").then((m) => ({ default: m.AddedToCartModal })),
);
import { lojaImageSrc } from "@/lib/lojaImage";
import { addCartItem, countCartItems } from "@/lib/lojaCart";
import fullIcon from "@/assets/iconefull.png.asset.json";
import mlMobileLogo from "@/assets/ml-mobile-v2.png.asset.json";


export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => {
    const p = lojaProducts.find((x) => x.slug === params.slug);
    return {
      meta: [
        { title: p ? `${p.title} - Mercado Livre` : "Produto - Mercado Livre" },
        { name: "description", content: p ? `${p.title} por ${p.price} com frete grátis e 95% OFF.` : "Produto" },
      ],
    };
  },
  loader: ({ params }) => {
    const p = lojaProducts.find((x) => x.slug === params.slug);
    if (!p) throw notFound();
    return p;
  },
  component: ProdutoPage,
  errorComponent: ({ error }) => (
    <div style={{ padding: 40, fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif" }}>
      <h1>Error al cargar producto</h1>
      <p>{error.message}</p>
      <Link to="/loja">Volver a la tienda</Link>
    </div>
  ),
  notFoundComponent: () => {
    const { slug } = Route.useParams();
    return (
      <div style={{ padding: 40, fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif" }}>
        <h1>Producto no encontrado</h1>
        <p>Slug: {slug}</p>
        <Link to="/loja">Volver a la tienda</Link>
      </div>
    );
  },
});

function parsePrice(p: string): number {
  const cleaned = p.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
function formatMXN(v: number): string {
  return "$ " + v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function soldCount(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return 379 + (h % (5000 - 379 + 1));
}
function ratingFor(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 33 + slug.charCodeAt(i) + 7) >>> 0;
  return 4.5 + (h % 5) / 10; // 4.5..4.9
}
function reviewCount(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 37 + slug.charCodeAt(i) + 13) >>> 0;
  return 320 + (h % (4800 - 320 + 1));
}
function pickBadge(slug: string, title: string): { kind: "best" | "official" | "deal"; label: string } {
  const brands = ["Apple", "Samsung", "Xiaomi", "JBL", "Electrolux", "Brastemp", "Motorola", "LG", "Sony", "Philips"];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const t = title.toLowerCase();
  let brand = brands.find((b) => t.includes(b.toLowerCase()));
  if (!brand && (t.includes("iphone") || t.includes("ipad") || t.includes("macbook") || t.includes("airpods"))) brand = "Apple";
  if (slug === "iphone17-pro") return { kind: "official", label: "LOJA OFICIAL APPLE" };
  const opts: Array<{ kind: "best" | "official" | "deal"; label: string }> = [
    { kind: "best", label: "MÁS VENDIDO" },
    { kind: "deal", label: "OFERTA DEL DÍA" },
  ];
  if (brand) opts.push({ kind: "official", label: `TIENDA OFICIAL ${brand.toUpperCase()}` });
  return opts[h % opts.length];
}


function ProdutoPage() {
  const product = Route.useLoaderData() as LojaProduct;
  const navigate = useNavigate();
  

  const images = useMemo(() => {
    const gallery = lojaGallery[product.slug] ?? [];
    const main = product.img;
    const isJunk = (p: string) => {
      const name = p.split("/").pop()?.toLowerCase() ?? "";
      const path = p.toLowerCase();
      return (
        name.includes("logo") ||
        name.includes("rating") ||
        name.includes("banner") ||
        name.includes("icon") ||
        name.includes("ref") ||
        name.includes("prova") ||
        name.includes("prov-") ||
        path.includes("/reviews/") ||
        name === "es.jpg"
      );
    };
    const rest = gallery.filter((g) => g !== main && !isJunk(g));
    const unique = Array.from(new Set([main, ...rest]));
    return unique;
  }, [product]);


  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [voltagem, setVoltagem] = useState("Bivolt");
  const isGeladeira = product.title.toLowerCase().includes("geladeira");
  const { tomorrowLabel, nextBusinessLabel } = useMemo(() => {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const nb = new Date(now); nb.setDate(now.getDate() + 1);
    while (nb.getDay() === 0 || nb.getDay() === 6) nb.setDate(nb.getDate() + 1);
    return {
      tomorrowLabel: days[tomorrow.getDay()],
      nextBusinessLabel: days[nb.getDay()],
    };
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);

  // reset ao trocar de produto
  useEffect(() => {
    setActive(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [product.slug]);


  const price = parsePrice(product.price);
  const priceOld = product.oldPrice ? parsePrice(product.oldPrice) : price * 20;
  

  const [adding, setAdding] = useState<null | "buy" | "cart">(null);
  const [addedOpen, setAddedOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    (window as any).__lojaReactReady = true;
    const refresh = () => {
      setCartCount(countCartItems());
    };
    refresh();
    window.addEventListener("cart:update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("cart:update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);


  const addToCartAndGo = (event: React.MouseEvent<HTMLButtonElement>, which: "buy" | "cart") => {
    event.preventDefault();
    if (adding) return;
    setAdding(which);
    setTimeout(() => {
      const items = addCartItem(product.slug, qty);
      setCartCount(countCartItems(items));
      setAdding(null);
      if (which === "buy") navigate({ to: "/checkout" });
      else setAddedOpen(true);
    }, 500);
  };






  return (
    <div className="produto-page">
      <style>{`
        .produto-page{min-height:100vh;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333}
        .produto-page *,.produto-page *::before,.produto-page *::after{box-sizing:border-box}
        .produto-topbar{background:#fff159;padding:10px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #e6e6e6}
        .produto-topbar a{color:#333;text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:14px}
        .produto-topbar a:hover{color:#3483fa}
        .produto-container{max-width:none;margin:0;background:#fff;border-radius:0;box-shadow:none;padding:24px}
        .prod-header{padding:0 3px !important}
        .produto-breadcrumb{font-size:12px;color:#666;margin-bottom:16px}
        .produto-breadcrumb a{color:#666;text-decoration:none}
        .produto-breadcrumb a:hover{color:#3483fa}
        .produto-grid{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start}
        .main-wrap{display:flex;flex-direction:column;gap:12px}
        .slider{position:relative;width:100%;height:480px;background:#fff;border-radius:0;overflow:hidden}
        .slider-counter{position:absolute;top:10px;left:3px;background:#ededed;color:#000;font-size:12px;font-weight:500;padding:1px 6px;border-radius:0;z-index:2;line-height:1.2}
        .slider-track{display:flex;width:100%;height:100%;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .slider-track::-webkit-scrollbar{display:none}
        .slide{flex:0 0 100%;width:100%;height:100%;scroll-snap-align:center;scroll-snap-stop:always;display:flex;align-items:center;justify-content:center;padding:20px;background:#fff}
        .slide img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;pointer-events:none;user-select:none}
        .dots{display:flex;justify-content:center;align-items:center;gap:8px;padding:4px 0}
        .dot{width:8px;height:8px;border-radius:50%;background:#c9c9c9;border:none;padding:0;cursor:pointer;transition:background .15s,transform .15s}
        .dot:hover{background:#8a8a8a}
        .dot.active{background:#3483fa;transform:scale(1.2)}
        .prod-header{display:flex;flex-direction:column;gap:5px;padding:0}
        .official-note{display:flex;flex-direction:column;gap:1px;margin-top:-12px;padding-bottom:8px;border-bottom:1px solid #e6e6e6;margin-bottom:4px}
        .official-note-title{font-size:13px;font-weight:500;color:#000;line-height:1.2}
        .official-note-sub{font-size:11px;font-weight:400;color:#666;line-height:1.2}
        .prod-header-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:#666}
        .prod-header-row .sold{font-weight:400;color:#333;margin-left:2px}

        .prod-header-row .rating{display:inline-flex;align-items:center;gap:6px}
        .prod-header-row .rating-num{color:#333;font-weight:400}
        .prod-header-row .stars{color:#3483fa;display:inline-flex;gap:2px}
        .prod-header-title{font-size:23px;font-weight:600;color:#333;line-height:1.25}



        .info-col{padding:0 8px}
        .info-meta{font-size:12px;color:#666;margin-bottom:6px}
        .info-title{font-size:22px;font-weight:600;color:#333;line-height:1.25;margin-bottom:10px}
        .info-rating{display:flex;align-items:center;gap:6px;margin-bottom:14px;font-size:13px;color:#666}
        .info-rating .stars{color:#3483fa;display:inline-flex;gap:1px}
        .info-price-old{font-size:16px;color:#666;margin-bottom:2px;display:flex;align-items:center;gap:8px}
        .info-price-old .old-value{text-decoration:line-through}
        .stock-info{margin-top:14px;font-size:15px;font-weight:600;color:#000}
        .stock-info.out{color:#fff;background:#ff0000;padding:4px 10px;border-radius:0;display:inline-block;font-weight:700;text-transform:uppercase}
        .stock-info.low{color:#ff2e2e;background:#ffdcdc;padding:2px 6px;border-radius:0;display:inline-block;font-size:12px;font-weight:400}
        .stock-info + .stock-sub{font-size:13px;color:#555;margin-top:0;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
        .full-badge{display:inline-flex;align-items:center;background:#00a650;color:#fff;font-size:11px;font-weight:700;padding:2px 6px 2px 4px;border-radius:0;letter-spacing:.3px}
        .full-badge::before{content:"⚡";margin-right:2px;font-size:11px}
        .info-price{font-size:36px;font-weight:700;color:#000;line-height:1;margin-bottom:4px;display:flex;align-items:baseline;gap:8px}
        .info-price .cents{font-size:13px;font-weight:500;display:inline-block;vertical-align:top;line-height:1;margin-left:0;position:relative;top:2px}
        .info-price-off{background:#00a650;color:#fff;font-size:14px;font-weight:700;padding:2px 6px;border-radius:0;text-decoration:none;line-height:1.2;display:inline-flex;align-items:center;justify-content:center;text-align:center;white-space:nowrap}
        .product-badge{display:inline-block;font-size:10.4px;font-weight:400;padding:2px 5px;border-radius:0;margin-top:0;line-height:1.2}
        .product-badge.best{background:#ff7733;color:#fff}
        .product-badge.official{background:#000;color:#fff}
        .product-badge.deal{background:#3483fa;color:#fff}
        .delivery-info b{font-weight:600}
        .info-installments{color:#00a650;font-size:15px;margin-bottom:16px}
        .info-shipping{background:#f5f5f5;border-radius:0;padding:12px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start}
        .info-shipping .txt{font-size:13px;color:#333}
        .info-shipping .txt b{color:#00a650}
        .info-perks{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
        .info-perks div{display:flex;gap:8px;align-items:center;font-size:13px;color:#555}
        .buy-col{background:#fff;border:1px solid #e6e6e6;border-radius:0;padding:16px;position:sticky;top:16px}
        .buy-title{font-size:14px;color:#666;margin-bottom:6px}
        .buy-price{font-size:28px;font-weight:400;color:#333;margin-bottom:4px}
        .buy-installments{color:#00a650;font-size:13px;margin-bottom:14px}
        .qty-row{display:flex;align-items:center;gap:12px;margin-bottom:14px}
        .qty-row label{font-size:14px;color:#333}
        .qty-select{padding:6px 8px;border:1px solid #d1d1d1;border-radius:0;font-size:14px;background:#fff;width:100%}
        .voltagem-row{margin-bottom:14px}
        .voltagem-row label{display:block;font-size:14px;color:#333;margin-bottom:6px}
        .voltagem-options{display:flex;gap:8px}
        .voltagem-btn{flex:1;padding:8px;border:1px solid #d1d1d1;border-radius:0;font-size:14px;background:#fff;cursor:pointer;transition:all .15s;text-align:center}
        .voltagem-btn.active{border-color:#3483fa;background:#e3edfb;color:#3483fa;font-weight:600}
        .delivery-info{margin:6px 0 14px;font-size:14px;line-height:1.35}
        .delivery-green{color:#00a650}
        .delivery-muted{color:#999;font-size:13px;margin-top:2px}
        .benefits-list{margin-top:14px;display:flex;flex-direction:column;gap:8px;font-size:13px;color:#555;line-height:1.4}
        .benefits-list > div{display:flex;align-items:flex-start;gap:8px}
        .benefits-list svg{flex-shrink:0;margin-top:2px}
        .benefits-list a{color:#3483fa;text-decoration:none}
        .fav-share-row{margin-top:14px;display:flex;flex-direction:row;flex-wrap:wrap;gap:16px;justify-content:center}
        @media (min-width:769px){ .fav-share-row{justify-content:flex-start} }
        .fav-btn{display:flex;align-items:center;gap:8px;background:none;border:none;color:#3483fa;font-size:14px;padding:4px 0;cursor:pointer;text-align:left}
        .fav-btn svg{color:#3483fa}

        .btn-buy{width:100%;padding:12px;background:#3483fa;color:#fff;border:none;border-radius:0;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px;transition:background .15s}
        .btn-buy:hover{background:#2968c8}
        .btn-cart{width:100%;padding:12px;background:#e3edfb;color:#3483fa;border:none;border-radius:0;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s;margin-bottom:20px}
        .btn-cart:hover{background:#d0e0f5}
        .btn-buy:disabled,.btn-cart:disabled{cursor:wait;opacity:.9}
        .prod-spin{animation:prodSpin 1s linear infinite}
        @keyframes prodSpin{to{transform:rotate(360deg)}}

        .seller-box{margin-top:16px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#555}
        .seller-box b{color:#333;font-weight:600;font-size:14px;display:block;margin-bottom:4px}
        .desc-block{margin-top:32px;padding-top:24px;border-top:1px solid #eee}
        .ml-footer{margin-top:32px;padding:0 0 24px;background:#fff;border-top:1px solid #eee;font-size:12px;color:#666;line-height:1.5}
        .ml-footer-app{background:#FFE600;padding:14px 20px;display:flex;align-items:center;gap:12px;margin-bottom:16px}
        .ml-footer-app img{height:28px;width:auto;display:block}
        .ml-footer-app span{color:#000;font-weight:600;font-size:14px}
        .ml-footer-copy{margin:0 15px 8px;color:#333;font-weight:600}
        .ml-footer-legal{margin:0 15px;color:#666}
        .desc-block h2{font-size:20px;font-weight:600;color:#333;margin-bottom:12px}
        .desc-block p{font-size:15px;color:#555;line-height:1.6}
        .reviews-block{margin-top:32px;padding-top:24px;border-top:1px solid #eee}
        .reviews-block h2{font-size:20px;font-weight:600;color:#333;margin-bottom:16px}
        .reviews-summary{display:flex;align-items:center;gap:16px;margin-bottom:24px}
        .reviews-avg{font-size:38px;font-weight:700;color:#3483fa;line-height:1}
        .reviews-stars{display:inline-flex;gap:2px;margin-bottom:4px}
        .reviews-count{font-size:13px;color:#666}
        .reviews-subtitle{font-size:16px;font-weight:600;color:#333;margin:16px 0 12px}
        .reviews-list{display:flex;flex-direction:column;gap:20px}
        .review{padding:12px 0;border-bottom:1px solid #f0f0f0}
        .review:last-child{border-bottom:none}
        .review-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
        .review-stars{display:inline-flex;gap:1px;color:#3483fa}
        .review-date{font-size:13px;color:#888}
        .review-images{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
        .review-images img{width:110px;height:90px;object-fit:cover;border-radius:0;border:1px solid #eee;cursor:pointer;transition:transform .15s}
        .review-images img:hover{transform:scale(1.03)}
        .review-text{font-size:14px;color:#333;line-height:1.5;margin:8px 0}
        .review-actions{display:flex;gap:8px;margin-top:10px}
        .review-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#fff;border:1px solid #d1d1d1;border-radius:0;font-size:13px;color:#333;cursor:pointer;transition:background .15s,border-color .15s}
        .review-btn:hover{border-color:#3483fa;color:#3483fa}
        .review-btn.icon-only{padding:6px 10px}
        .review-btn span{color:#666}
        @media (max-width:900px){
          .produto-grid{grid-template-columns:1fr}
          .main-wrap{order:2}
          .slider{height:420px}
          .buy-col{order:5;position:static;border:none;padding:0;border-radius:0;background:transparent}
          .prod-header-title{font-size:20px}
          .slider-counter{font-size:10px;left:0}
          .produto-container{padding:15px}
          .prod-header{padding:8px 0 !important}
          .prod-header-row .sold{margin-left:0}
        }


      `}</style>

      <div>
        <LojaHeader 
          cartCount={cartCount} 
          customMobileMenu={(
            <button 
              className="ml-icon-btn" 
              aria-label="Voltar" 
              type="button" 
              onClick={() => navigate({ to: "/loja" })}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "17px", width: "auto", padding: "4px 8px 4px 0" }}
            >
              <ArrowLeft size={14} strokeWidth={2.5} color="#000" style={{ width: "14px", height: "14px" }} />
              <span style={{ fontWeight: 500, fontSize: "17px", color: "#000" }}>Volver</span>
            </button>
          )}
        />
        <OfferTimerBanner />
      </div>

      




      <div className="produto-container">
        <div className="produto-grid">
          <div className="main-wrap">
            <div className="prod-header">
              {(() => {
                const b = pickBadge(product.slug, product.title);
                if (b.kind !== "official") return null;
                const brand = b.label.replace("LOJA OFICIAL ", "");
                const brandTitle = brand.charAt(0) + brand.slice(1).toLowerCase();
                return (
                  <div className="official-note">
                    <div className="official-note-title">Compra productos nuevos e certificados</div>
                    <div className="official-note-sub">Producto certificado por {brandTitle} en México</div>
                  </div>
                );
              })()}
              <div className="prod-header-row">
                <span className="sold">Nuevo | +{soldCount(product.slug).toLocaleString("es-MX")} vendidos</span>
                <span className="rating">
                  <span className="rating-num">{ratingFor(product.slug).toFixed(1).replace(".", ",")}</span>
                  <span className="stars">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const avg = ratingFor(product.slug);
                      const full = i <= Math.floor(avg);
                      const half = !full && i === Math.ceil(avg) && avg % 1 >= 0.3;
                      return (
                        <div key={i} style={{ position: "relative", width: 14, height: 14 }}>
                          <Star size={14} fill="#e6e6e6" strokeWidth={0} />
                          {(full || half) && (
                            <div style={{ position: "absolute", top: 0, left: 0, width: half ? "50%" : "100%", overflow: "hidden" }}>
                              <Star size={14} fill="#3483fa" strokeWidth={0} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </span>
                  <span>({reviewCount(product.slug).toLocaleString("es-MX")})</span>
                </span>
              </div>
              {(() => { const b = pickBadge(product.slug, product.title); return <div><span className={`product-badge ${b.kind}`}>{b.label}</span></div>; })()}
              <div className="prod-header-title">{product.title}</div>
            </div>


            <div className="slider">
              {images.length > 1 && (
                <div className="slider-counter">{active + 1}/{images.length}</div>
              )}
              <div
                className="slider-track"
                ref={trackRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const i = Math.round(el.scrollLeft / el.clientWidth);
                  if (i !== active) setActive(i);
                }}
              >
                {images.map((src, i) => (
                  <div key={src + i} className="slide">
                    <img src={lojaImageSrc(src)} alt={product.title} draggable={false} loading={i === 0 ? "eager" : "lazy"} decoding="async" fetchPriority={i === 0 ? "high" : "low"} />
                  </div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <div className="dots">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className={`dot${i === active ? " active" : ""}`}
                    onClick={() => {
                      const el = trackRef.current;
                      if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
                      setActive(i);
                    }}
                    aria-label={`Imagem ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>



          <div className="buy-col">

            {product.stock !== 0 && (
              <>
                <div className="info-price-old">
                  <span className="old-value">{product.oldPrice || formatMXN(priceOld)}</span>
                  {product.stock !== 0 && <span className="info-price-off">95% OFF</span>}
                </div>
                <div className="info-price" style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  $ {Math.floor(price).toLocaleString("es-MX")}<span className="cents">{Math.round((price - Math.floor(price)) * 100).toString().padStart(2, "0")}</span>
                </div>
              </>
            )}


            <div className="info-price-old" style={{ marginTop: 20, marginBottom: 20 }}>
              <span className="info-price-off">ENVÍO GRATIS POR ENCIMA DE $ 19</span>
            </div>



            {isGeladeira && (
              <div className="voltagem-row">
                <label>Voltagem</label>
                <div className="voltagem-options">
                  {["110V", "220V", "Bivolt"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`voltagem-btn${voltagem === v ? " active" : ""}`}
                      onClick={() => setVoltagem(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`stock-info ${product.stock === 0 ? 'out' : ''}`} style={{ marginBottom: 0 }}>
              {product.stock === 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  X SIN STOCK
                </span>
              ) : 'Stock disponible'}
            </div>
            {product.stock !== 0 && product.stock !== undefined && (
              <div className="stock-info low" style={{ marginBottom: 0, marginTop: 4 }}>
                ÚLTIMAS {product.stock} UNIDADES
              </div>
            )}
            <div className="stock-sub" style={{ marginBottom: 20 }}>Almacenado y enviado por {product.stock !== 0 ? <img src={fullIcon.url} alt="FULL" style={{ height: 18, verticalAlign: "middle" }} /> : <b>Mercado Libre</b>}</div>


            <button type="button" className="btn-buy" onClick={(event) => addToCartAndGo(event, "buy")} disabled={!!adding} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {adding === "buy" ? <Loader2 size={18} className="prod-spin" /> : "Comprar ahora"}
            </button>
            <button type="button" className="btn-cart" onClick={(event) => addToCartAndGo(event, "cart")} disabled={!!adding} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {adding === "cart" ? <Loader2 size={18} className="prod-spin" /> : <><ShoppingCart size={16} /> Agregar al carrito</>}
            </button>



            <div className="benefits-list">
              <div><RotateCcw size={16} color="#888" /> <span><span style={{ color: "#3483fa" }}>Devolución gratis.</span> <span style={{ color: "#888" }}>Tienes 30 días desde que lo recibes.</span></span></div>
              <div><ShieldCheck size={16} color="#888" /> <span><span style={{ color: "#3483fa" }}>Compra Protegida.</span> <span style={{ color: "#888" }}>Recibe el producto que esperabas o te devolvemos tu dinero.</span></span></div>
              <div><Award size={16} color="#888" /> <span>12 meses de garantía de fábrica.</span></div>
            </div>

            <div className="fav-share-row">
              <button type="button" className="fav-btn"><Heart size={16} /> Agregar a favoritos</button>
              <button
                type="button"
                className="fav-btn"
                onClick={() => {
                  setShared(true);
                  window.setTimeout(() => setShared(false), 2000);
                }}
              >
                <Share2 size={16} /> {shared ? "Link copiado" : "Compartir"}
              </button>
            </div>

            {(() => {
              const b = pickBadge(product.slug, product.title);
              if (b.kind !== "official") return null;
              const brand = b.label.replace("LOJA OFICIAL ", "");
              const brandNice = brand.charAt(0) + brand.slice(1).toLowerCase();
              return (
                <div className="seller-box">
                  <div className="seller-official"><span style={{ color: "#000" }}>Tienda oficial </span><span style={{ color: "#000", fontWeight: 600 }}>{brandNice}</span> <BadgeCheck size={14} color="#fff" fill="#3483fa" style={{ display: "inline-block", verticalAlign: "middle" }} /></div>
                  <div style={{ marginTop: 6, color: "#000" }}>Vendido por <span style={{ color: "#3483fa" }}>Mercado Libre Electrónicos</span></div>
                  <div style={{ color: "#000", fontWeight: 600 }}>+1 M ventas</div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="desc-block">
          <h2>Descripción</h2>
          <p>
            {product.title}. Producto nuevo, original y con garantía. Envío inmediato a todo
            México con envío gratis. Revisa las fotos y demás información de esta oferta especial.
          </p>
        </div>

        <ReviewsBlock slug={product.slug} />
      </div>

      <footer className="ml-footer">
        <div className="ml-footer-app">
          <img src={mlMobileLogo.url} alt="Mercado Livre" />
          <span>¡Compra y vende con la app!</span>
        </div>
        <p className="ml-footer-copy">© 1999-2026. Mercado Libre S. de R.L. de C.V.</p>
        <p className="ml-footer-legal">RFC: MLE010101AAA / Av. de los Insurgentes Sur 1602, Crédito Constructor, Benito Juárez, Ciudad de México, CDMX - empresa del grupo Mercado Libre.</p>
      </footer>
      {addedOpen && (
        <Suspense fallback={null}>
          <AddedToCartModal
            open={addedOpen}
            onClose={() => setAddedOpen(false)}
            product={{ title: product.title, img: product.img, qty }}
          />
        </Suspense>
      )}
    </div>
  );
}




function ReviewsBlock({ slug }: { slug: string }) {
  const reviews = lojaReviews[slug] ?? [
    { stars: 5, date: "10 dic. 2024", images: [], text: "Excelente producto, llegó rápido y bien empacado. ¡Lo recomiendo!", useful: 42 },
    { stars: 5, date: "05 dic. 2024", images: [], text: "Muy bueno, superó mis expectativas. Gran relación calidad-precio.", useful: 31 },
    { stars: 4, date: "28 nov. 2024", images: [], text: "Me gustó mucho el producto, funciona perfectamente.", useful: 18 },
  ];
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const recentDate = (idx: number) => {
    let h = idx + 2;
    for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    const daysAgo = 2 + ((h + idx * 7) % 5); // 2..6
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  const avg = ratingFor(slug);
  const total = reviewCount(slug);
  return (
    <div className="reviews-block">
      <h2>Opiniones del producto</h2>
      <div className="reviews-summary">
        <div className="reviews-avg">{avg.toFixed(1)}</div>
        <div>
          <div className="reviews-stars">
            {[1, 2, 3, 4, 5].map((i) => {
              const full = i <= Math.floor(avg);
              const half = !full && i === Math.ceil(avg) && avg % 1 >= 0.3;
              return (
                <div key={i} style={{ position: "relative", width: 16, height: 16 }}>
                  <Star size={16} fill="#e6e6e6" strokeWidth={0} />
                  {(full || half) && (
                    <div style={{ position: "absolute", top: 0, left: 0, width: half ? "50%" : "100%", overflow: "hidden" }}>
                      <Star size={16} fill="#3483fa" strokeWidth={0} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="reviews-count">{total.toLocaleString("es-MX")} calificaciones</div>
        </div>
      </div>
      <h3 className="reviews-subtitle">Opiniones destacadas</h3>
      <div className="reviews-list">
        {reviews.map((r, idx) => (
          <div key={idx} className="review">
            <div className="review-header">
              <span className="review-stars">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} size={14} fill="#3483fa" strokeWidth={0} />
                ))}
              </span>
              <span className="review-date">{recentDate(idx)}</span>
            </div>
            {r.images.length > 0 && (
              <div className="review-images">
                {r.images.map((src) => (
                  <img key={src} src={lojaImageSrc(src)} alt="Foto de la calificación" loading="lazy" />
                ))}
              </div>
            )}
            <p className="review-text">{r.text}</p>
            <div className="review-actions">
              <button type="button" className="review-btn"><ThumbsUp size={14} /> Es útil <span>{r.useful}</span></button>
              <button type="button" className="review-btn icon-only" aria-label="No es útil"><ThumbsDown size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


