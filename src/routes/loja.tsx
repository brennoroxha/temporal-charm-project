import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { lojaProducts } from "@/data/lojaProducts";
import { type LojaProduct } from "@/data/types";
import { LojaHeader } from "@/components/LojaHeader";
import { OfferTimerBanner } from "@/components/OfferTimerBanner";
const AddedToCartModal = lazy(() =>
  import("@/components/AddedToCartModal").then((m) => ({ default: m.AddedToCartModal })),
);
import { lojaImageSrc } from "@/lib/lojaImage";
import { addCartItem, countCartItems, readCartStorage } from "@/lib/lojaCart";
import { ShoppingCart, Loader2, Star } from "lucide-react";
import fullIcon from "@/assets/iconefull.png.asset.json";


export const Route = createFileRoute("/loja")({
  validateSearch: (search: Record<string, unknown>) => {
    const q = typeof search.q === "string" ? search.q : "";
    return q ? { q } : {};
  },
  head: () => ({
    meta: [
      { title: "Loja Mercado Livre" },
      { name: "description", content: "Ofertas especiais com Mega Desconto. 95% OFF." },
    ],
  }),
  component: LojaPage,
});

function LojaPage() {
  const navigate = useNavigate();
  const { q = "" } = Route.useSearch();
  const [cartCount, setCartCount] = useState(0);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [addedProduct, setAddedProduct] = useState<LojaProduct | null>(null);

  const products = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return lojaProducts;
    return lojaProducts.filter((p) =>
      p.title.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
    );
  }, [q]);



  const refresh = () => {
    setCartCount(countCartItems());
  };

  useEffect(() => {
    (window as any).__lojaReactReady = true;
    refresh();
    const h = () => refresh();
    window.addEventListener("cart:update", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("cart:update", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const addToCart = (event: React.MouseEvent<HTMLAnchorElement>, p: LojaProduct) => {
    event.preventDefault();
    if (loadingSlug) return;
    setLoadingSlug(p.slug);
    setTimeout(() => {
      addCartItem(p.slug, 1);
      setCartCount(countCartItems(readCartStorage()));
      setLoadingSlug(null);
      setAddedProduct(p);
    }, 600);
  };


  return (
    <div className="loja-page">
      <style>{`
        html,body,#root{margin:0;padding:0}
        .loja-page{background:#fff;color:#333;min-height:100vh;font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
        .loja-page *{box-sizing:border-box}

        .loja-banner{background:linear-gradient(90deg,#00a650,#3483FA);color:#fff;text-align:center;padding:10px 16px;font-weight:700;font-size:14px}
        .loja-strip{background:#FFE600;color:#2d2d2d;text-align:center;padding:10px 16px;line-height:1.35;box-shadow:inset 0 6px 6px -4px rgba(0,0,0,.18)}
        .loja-strip-title{font-weight:400;font-size:21px;color:#111}
        .loja-strip-sub{font-weight:400;font-size:17px;color:#333;margin-top:2px}
        @media (max-width:480px){.loja-strip-title{font-size:20px}.loja-strip-sub{font-size:16px}}
        .loja-main{max-width:1200px;margin:16px auto;padding:0 12px}
        .loja-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
        .loja-card{background:#fff;border-radius:0;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;height:100%;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:transform .15s,box-shadow .15s}
        .loja-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.15)}
        .loja-img-wrap{height:200px;background:#fff;display:flex;align-items:center;justify-content:center;padding:12px;border-bottom:1px solid #e6e6e6}
        .loja-img-wrap img{width:180px;height:180px;object-fit:contain;display:block}

        .loja-info{padding:10px 14px 14px;display:flex;flex-direction:column;flex:1;gap:0}
        .loja-title{font-size:14px;line-height:1.35;color:#333;font-weight:500;min-height:38px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px}
        .loja-old-price{font-size:12px;color:#999;text-decoration:line-through;margin:0;line-height:1.1}
        .loja-price-row{display:flex;align-items:baseline;gap:6px;line-height:1.1;flex-wrap:nowrap;width:100%}
        .loja-price{color:#000;font-weight:600;font-size:22px;line-height:1.1;margin-top:0}
        .loja-discount{color:#fff;background:#00a650;font-size:12px;font-weight:700;padding:2px 4px;border-radius:0;display:inline-block;white-space:nowrap}
        .loja-stock{font-size:12px;padding:2px 6px;border-radius:0;width:fit-content;margin-top:0;font-weight:400}
        .loja-stock.low{color:#00a650;background:#e6f6ef;padding-left:6px;font-weight:400}
        .loja-stock.out{color:#fff;background:#ff0000;padding:2px 8px;font-weight:700;text-transform:uppercase;border-radius:0}
        .loja-stock.medium{color:#847900;background:#ffffc7}
        .loja-stock.high{color:#008412;background:#cbffc7}
        .loja-shipping{color:#00a650;font-weight:600;font-size:13px}
        .loja-btn{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:8px;height:38px;border:1px solid #3483FA;color:#3483FA;background:#fff;border-radius:0;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none;transition:background .15s}
        .loja-btn:hover{background:#eaf2ff}
        .loja-btn svg{width:16px;height:16px}
        .loja-btn:disabled{cursor:wait;opacity:.9}
        .loja-spin{animation:lojaSpin 1s linear infinite}
        @keyframes lojaSpin{to{transform:rotate(360deg)}}
        @media (max-width:480px){.loja-grid{grid-template-columns:repeat(2,1fr);gap:10px}.loja-price{font-size:18px}.loja-title{font-size:13px;min-height:34px}.loja-img-wrap{padding:10px}}
        .loja-card .rating-row{display:flex;align-items:center;gap:4px;margin-bottom:2px}
        .loja-card .stars{color:#3483fa;display:inline-flex;gap:1px}
        .loja-card .rating-count{font-size:12px;color:#999}
      `}</style>

      <div>
        <LojaHeader cartCount={cartCount} initialQuery={q} />
        <OfferTimerBanner />
      </div>



      <main className="loja-main">
        {q.trim() && (
          <div style={{ padding: "8px 4px 12px", fontSize: 14, color: "#333" }}>
            {products.length > 0
              ? <>Resultados para <b>"{q}"</b> ({products.length})</>
              : <>No se encontraron productos para <b>"{q}"</b>. <button type="button" onClick={() => navigate({ to: "/loja", search: {} as any })} style={{ background: "transparent", border: 0, color: "#3483FA", cursor: "pointer", padding: 0, textDecoration: "underline" }}>Limpiar búsqueda</button></>}
          </div>
        )}
        <div className="loja-grid">
          {products.map((p) => {
            const isLoading = loadingSlug === p.slug;
            return (
              <div key={p.slug} className="loja-card" style={p.stock === 0 ? { cursor: "default", transform: "none", boxShadow: "0 1px 2px rgba(0,0,0,.08)" } : {}}>
                {p.stock !== 0 ? (
                  <Link
                    to="/produto/$slug"
                    params={{ slug: p.slug }}
                    style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "contents" }}
                  >
                    <div className="loja-img-wrap">
                      <img src={lojaImageSrc(p.img)} alt={p.title} loading="lazy" decoding="async" />
                    </div>
                  </Link>
                ) : (
                  <div className="loja-img-wrap">
                    <img src={lojaImageSrc(p.img)} alt={p.title} loading="lazy" decoding="async" style={{ opacity: 0.7 }} />
                  </div>
                )}
                <div className="loja-info">
                  {p.stock !== 0 ? (
                    <Link
                      to="/produto/$slug"
                      params={{ slug: p.slug }}
                      style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
                    >
                      <div className="loja-title">{p.title}</div>
                      {p.oldPrice && <div className="loja-old-price">{p.oldPrice}</div>}
                      <div className="loja-price-row">
                        <div className="loja-price" style={{ whiteSpace: "nowrap" }}>{p.price}</div>
                        <div className="loja-discount">95% OFF</div>
                      </div>
                      {p.stock !== undefined && (
                        <div className={`loja-stock ${p.stock <= 6 ? 'low' : p.stock <= 10 ? 'medium' : 'high'}`}>
                          ÚLTIMAS {p.stock} UNIDADES
                        </div>
                      )}
                      <div className="loja-shipping" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Envío <img src={fullIcon.url} alt="FULL" style={{ height: 18, verticalAlign: "middle" }} />
                      </div>
                    </Link>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="loja-title">{p.title}</div>
                      {p.stock !== undefined && (
                        <div className={`loja-stock out`}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            X SIN STOCK
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}


        </div>
      </main>

      {addedProduct && (
      <Suspense fallback={null}>
      <AddedToCartModal
        open={!!addedProduct}
        onClose={() => setAddedProduct(null)}
        product={addedProduct ? { title: addedProduct.title, img: addedProduct.img, qty: 1 } : null}
      />
      </Suspense>
      )}
    </div>
  );
}

