export type LojaCartItem = { slug: string; qty: number };

export const LOJA_CART_KEY = "loja_cart_v1";

function normalizeCartItem(item: unknown): LojaCartItem | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  if (typeof record.slug !== "string" || !record.slug.trim()) return null;
  const qty = Number(record.qty);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return { slug: record.slug, qty: Math.max(1, Math.floor(qty)) };
}

export function readCartStorage(): LojaCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOJA_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean) as LojaCartItem[];
  } catch {
    return [];
  }
}

export function writeCartStorage(items: LojaCartItem[]) {
  if (typeof window === "undefined") return;
  const normalized = items.map(normalizeCartItem).filter(Boolean) as LojaCartItem[];
  window.localStorage.setItem(LOJA_CART_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event("cart:update"));
}

export function addCartItem(slug: string, qty = 1): LojaCartItem[] {
  const safeQty = Math.max(1, Math.floor(Number(qty) || 1));
  const items = readCartStorage();
  const index = items.findIndex((item) => item.slug === slug);
  if (index >= 0) items[index] = { ...items[index], qty: items[index].qty + safeQty };
  else items.push({ slug, qty: safeQty });
  writeCartStorage(items);
  return items;
}

export function countCartItems(items = readCartStorage()): number {
  return items.reduce((total, item) => total + item.qty, 0);
}