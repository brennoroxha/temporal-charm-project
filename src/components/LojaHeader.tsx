import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import mlDesktopLogo from "@/assets/ml-desktop-local.webp";
import mlMobileLogo from "@/assets/ml-logo-local.webp";
import ofertasBanner from "@/assets/ofertas.webp.asset.json";
const CartDrawer = lazy(() =>
  import("./CartDrawer").then((m) => ({ default: m.CartDrawer })),
);


type Props = {
  cartCount?: number;
  onCartClick?: () => void;
  initialQuery?: string;
  customMobileMenu?: React.ReactNode;
};

export function LojaHeader({ cartCount = 0, onCartClick, initialQuery = "", customMobileMenu }: Props) {
  const [city, setCity] = useState<string>("Carregando...");
  const [q, setQ] = useState(initialQuery);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartEverOpened = useRef(false);
  if (isCartOpen) cartEverOpened.current = true;
  const navigate = useNavigate();


  useEffect(() => { setQ(initialQuery); }, [initialQuery]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate({ to: "/loja", search: term ? ({ q: term } as any) : ({} as any) });
  };

  useEffect(() => {
    let cancelled = false;
    fetch("https://get.geojs.io/v1/ip/geo.json")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const parts = [d.city, d.region].filter(Boolean);
        setCity(parts.length ? parts.join(", ") : "Brasil");
      })
      .catch(() => !cancelled && setCity("Brasil"));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCart = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    if (onCartClick) onCartClick();
    else setIsCartOpen(true);
  };


  const goToSearch = (term: string) => {
    navigate({ to: "/loja", search: term ? ({ q: term } as any) : ({} as any) });
  };

  return (
    <>
      <style>{`
        .ml-header{background:#FFE600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
        .ml-header-top{max-width:1200px;margin:0 auto;padding:14px 20px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:24px}
        .ml-logo{display:flex;align-items:center;text-decoration:none;color:#000}
        .ml-logo img{height:33px;width:auto;display:block}
        .ml-search{display:none}
        .ml-promo{display:flex;align-items:center;color:#000;white-space:nowrap}
        .ml-promo img{height:37px;width:auto;display:block}
        .ml-header-bottom{max-width:1200px;margin:0 auto;padding:0 20px 10px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:24px;font-size:13px;color:#000}
        .ml-location{display:flex;align-items:flex-start;gap:6px;line-height:1.1}
        .ml-location svg{width:16px;height:16px;color:#000;margin-top:2px;flex-shrink:0}
        .ml-location span{display:block}
        .ml-location .lbl{color:#333;font-size:12px}
        .ml-location .val{font-weight:400}
        .ml-nav{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:640px}
        .ml-nav a,.ml-nav button{color:#000;text-decoration:none;position:relative;background:transparent;border:0;padding:0;font:inherit;cursor:pointer}
        .ml-nav a.has-caret::after,.ml-nav button.has-caret::after{content:"";display:inline-block;margin-left:4px;border:4px solid transparent;border-top-color:#000;transform:translateY(2px)}
        .ml-nav .badge{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#00a650;color:#fff;font-size:8px;font-weight:400;padding:1px 4px;border-radius:3px;line-height:1}
        .ml-account{display:flex;align-items:center;gap:18px}
        .ml-account a,.ml-account button{color:#000;text-decoration:none;background:transparent;border:0;padding:0;font:inherit;cursor:pointer}
        .ml-cart{display:flex;align-items:center;color:#000}
        .ml-cart svg{width:20px;height:20px}

        .ml-mobile-wrap{display:none}
        .ml-header-mobile{background:#FFE600;padding:8px 12px;display:flex;flex-direction:column;gap:8px;position:sticky;top:0;z-index:50;box-shadow:0 1px 2px rgba(0,0,0,.08)}
        .ml-header-mobile-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;min-width:0}
        .ml-header-mobile-top > *:last-child{justify-self:end}
        .ml-header-mobile-top > *:first-child{min-width:32px;overflow:visible;justify-self:start}
        .ml-logo-mobile{display:flex;align-items:center;justify-content:center}
        .ml-logo-mobile img{height:56px;width:auto;object-fit:contain;display:block;border:0;background:transparent}
        .ml-search-mobile{display:none}
        .ml-icon-btn{background:transparent;border:0;color:#000;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;position:relative}
        .ml-icon-btn svg{width:24px;height:24px}
        .ml-location-mobile{background:#FFE600;padding:10px 12px 10px;display:flex;align-items:center;gap:6px;font-size:13px;color:#000;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 3px rgba(0,0,0,.08)}
        .ml-location-mobile svg{width:16px;height:16px;color:#000;flex-shrink:0}
        .ml-location-mobile .lbl{color:#333;font-size:13px}
        .ml-location-mobile .val{font-weight:400}
        .ml-cart-badge{position:absolute;top:-6px;right:-8px;background:#e53935;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;padding:0 4px;border-radius:8px;display:flex;align-items:center;justify-content:center;line-height:1}

        @media (max-width:768px){
          .ml-header{display:none}
          .ml-mobile-wrap{display:contents}
        }
      `}</style>

      <header className="ml-header">
        <div className="ml-header-top">
          <a className="ml-logo" href="/loja">
            <img src={mlDesktopLogo} alt="Mercado Livre" width={134} height={34} decoding="async" fetchPriority="high" />
          </a>
          <div className="ml-promo">
            <img src={ofertasBanner.url} alt="Ofertas por tempo limitado" width={420} height={60} loading="lazy" decoding="async" />
          </div>
        </div>
        <div className="ml-header-bottom">
          <div style={{ width: "160px" }}></div>

          <nav className="ml-nav">
            <button type="button" className="has-caret" onClick={() => goToSearch("")}>Categorias</button>
            <button type="button" onClick={() => goToSearch("oferta")}>Ofertas</button>
            <button type="button" onClick={() => goToSearch("cupom")}>Cupons</button>
            <button type="button" onClick={() => goToSearch("mercado")}>Supermercado</button>
            <button type="button" onClick={() => goToSearch("moda")}>Moda</button>
            <button type="button" onClick={() => goToSearch("play")}><span className="badge">GRÁTIS</span>Mercado Play</button>
            <button type="button" onClick={() => goToSearch("")}>Vender</button>
            <button type="button" onClick={() => goToSearch("")}>Contato</button>
          </nav>
          <div className="ml-account">
            <button type="button" onClick={() => navigate({ to: "/auth" })}>Crie a sua conta</button>
            <button type="button" onClick={() => navigate({ to: "/auth" })}>Entre</button>
            <button type="button" onClick={() => setIsCartOpen(true)}>Compras</button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="ml-cart"
              aria-label="Carrinho"
              style={{ background: "transparent", border: 0, cursor: "pointer", position: "relative", padding: 0 }}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="ml-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className="ml-mobile-wrap">
        <header className="ml-header-mobile">
          <div className="ml-header-mobile-top">
            {customMobileMenu || (
              <button className="ml-icon-btn" aria-label="Menu" type="button" onClick={() => goToSearch("")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            )}
            <a href="/loja" className="ml-logo-mobile" aria-label="Mercado Livre">
              <img src={mlMobileLogo} alt="Mercado Livre" width={168} height={56} decoding="async" fetchPriority="high" />
            </a>
            <button className="ml-icon-btn" aria-label="Carrinho" type="button" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={24} />
              {cartCount > 0 && <span className="ml-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </header>
      </div>
      {cartEverOpened.current && (
        <Suspense fallback={null}>
          <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
        </Suspense>
      )}
    </>
  );
}

