import { Link } from "@tanstack/react-router";
import { X, Check } from "lucide-react";
import { useEffect } from "react";
import { lojaImageSrc } from "@/lib/lojaImage";

type Props = {
  open: boolean;
  onClose: () => void;
  product: { title: string; img: string; qty: number } | null;
};

export function AddedToCartModal({ open, onClose, product }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  return (
    <>
      <style>{`
        .atc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:flex-end;justify-content:center;animation:atcFade .18s ease}
        .atc-modal{background:#fff;width:100%;max-width:520px;border-radius:14px 14px 0 0;padding:20px 20px 24px;position:relative;animation:atcSlide .22s ease}
        .atc-close{position:absolute;top:10px;right:10px;background:transparent;border:0;cursor:pointer;color:#666;padding:6px;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .atc-close:hover{background:#f0f0f0}
        .atc-head{display:flex;gap:14px;align-items:center;padding-bottom:16px;border-bottom:1px solid #eee}
        .atc-img-wrap{position:relative;width:60px;height:60px;border-radius:50%;border:2px solid #00a650;padding:4px;flex-shrink:0}
        .atc-img-wrap img{width:100%;height:100%;object-fit:contain;border-radius:50%}
        .atc-check{position:absolute;bottom:-2px;right:-2px;background:#00a650;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
        .atc-info{min-width:0;flex:1}
        .atc-info .t1{font-size:16px;font-weight:600;color:#333;margin:0 0 4px}
        .atc-info .t2{font-size:14px;color:#333;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0}
        .atc-info .t3{font-size:13px;color:#666;margin-top:4px}
        .atc-actions{display:flex;flex-direction:column;gap:10px;margin-top:20px}
        .atc-primary{height:48px;background:#3483FA;color:#fff;border:0;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:background .15s}
        .atc-primary:hover{background:#2968c8}
        .atc-secondary{height:48px;background:#eaf2ff;color:#3483FA;border:0;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
        .atc-secondary:hover{background:#d9e8ff}
        @media (min-width:600px){.atc-overlay{align-items:center}.atc-modal{border-radius:14px}}
        @keyframes atcFade{from{opacity:0}to{opacity:1}}
        @keyframes atcSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
      <div className="atc-overlay" onClick={onClose}>
        <div className="atc-modal" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="atc-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
          <div className="atc-head">
            <div className="atc-img-wrap">
              <img src={lojaImageSrc(product.img)} alt={product.title} loading="lazy" decoding="async" />
              <span className="atc-check"><Check size={12} strokeWidth={3} /></span>
            </div>
            <div className="atc-info">
              <p className="t1">Agregado al carrito</p>
              <p className="t2">{product.title}</p>
              <p className="t3">{product.qty} unidad{product.qty > 1 ? "es" : ""}</p>
            </div>
          </div>
          <div className="atc-actions">
            <button className="atc-primary" onClick={onClose} type="button">
              Ok
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
