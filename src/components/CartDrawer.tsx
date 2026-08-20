import { Link, useNavigate } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { lojaProducts } from "@/data/lojaProducts";
import { type LojaProduct } from "@/data/types";
import { lojaImageSrc } from "@/lib/lojaImage";
import { countCartItems, readCartStorage, writeCartStorage, type LojaCartItem } from "@/lib/lojaCart";
import fullIcon from "@/assets/iconefull.png.asset.json";

type CartItem = LojaProduct & { qty: number };

function parsePrice(p: string): number {
  const cleaned = p.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function formatMXN(v: number): string {
  return "$ " + v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);

  const loadCart = () => {
    const rows = readCartStorage();
    const items = rows
      .map((r) => {
        const p = lojaProducts.find((x) => x.slug === r.slug);
        return p ? { ...p, qty: r.qty } : null;
      })
      .filter(Boolean) as CartItem[];
    setCart(items);
  };

  useEffect(() => {
    if (open) {
      loadCart();
    }
  }, [open]);

  useEffect(() => {
    const h = () => loadCart();
    window.addEventListener("cart:update", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("cart:update", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const update = (items: CartItem[]) => {
    setCart(items);
    writeCartStorage(items.map((x) => ({ slug: x.slug, qty: x.qty })));
  };

  const changeQty = (slug: string, delta: number) => {
    const next = cart
      .map((x) => (x.slug === slug ? { ...x, qty: x.qty + delta } : x))
      .filter((x) => x.qty > 0);
    update(next);
  };

  const removeItem = (slug: string) => {
    update(cart.filter((x) => x.slug !== slug));
  };

  const total = cart.reduce((s, x) => s + parsePrice(x.price) * x.qty, 0);
  const cartCount = countCartItems(cart.map(c => ({ slug: c.slug, qty: c.qty })));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90%] sm:max-w-md p-0 flex flex-col bg-[#ededed]">
        <SheetHeader className="p-4 bg-[#FFE600] border-b border-black/5 flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart size={20} />
            Carrito ({cartCount})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground gap-4">
              <ShoppingCart size={48} strokeWidth={1.5} className="opacity-20" />
              <p>Tu carrito está vacío.</p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-[#3483FA] font-semibold hover:underline"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-none shadow-sm border border-black/5 overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                  <span className="font-bold text-sm">Productos</span>
                  <img src={fullIcon.url} alt="FULL" className="h-4" loading="lazy" decoding="async" />
                </div>
                {cart.map((it) => (
                  <div key={it.slug} className="p-4 flex gap-3 border-b border-gray-100 last:border-0">
                    <img 
                      src={lojaImageSrc(it.img)} 
                      alt={it.title} 
                      className="w-20 h-20 object-contain flex-shrink-0 bg-white border border-gray-100 rounded-none" 
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-tight">
                        {it.title}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="inline-flex items-center border border-gray-200 h-8 overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => changeQty(it.slug, -1)}
                            disabled={it.qty <= 1}
                            className="w-8 h-full flex items-center justify-center text-[#3483FA] hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 min-w-[24px] text-center text-sm font-semibold border-x border-gray-100">
                            {it.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQty(it.slug, 1)}
                            className="w-8 h-full flex items-center justify-center text-[#3483FA] hover:bg-gray-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex flex-col items-end">
                             <div className="flex items-baseline gap-2">
                               <span className="text-base font-bold text-[#00a650] whitespace-nowrap">
                                 {formatMXN(parsePrice(it.price) * it.qty)}
                               </span>
                               <span className="bg-[#00a650] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-none whitespace-nowrap">
                                 5% OFF
                               </span>
                             </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(it.slug)}
                            className="text-gray-400 hover:text-red-500 mt-1 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Productos ({cartCount})</span>
                <span>{formatMXN(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envío</span>
                <span className="text-[#00a650] font-bold">Gratis</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#00a650] border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>{formatMXN(total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/checkout" });
              }}
              className="w-full h-10 bg-[#3483FA] text-white font-semibold text-sm rounded-none hover:bg-[#2968c8] transition-colors shadow-md"
            >
              Finalizar Compra
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 mt-2 bg-white text-[#3483FA] border border-[#3483FA] font-semibold text-sm rounded-none hover:bg-[#f0f7ff] transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
