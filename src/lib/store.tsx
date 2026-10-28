import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Cart, Category, Product } from './types';
import { api } from './api';
import { CartSync } from './cart-sync';
interface Store { products: Product[]; categories: Category[]; cart: Cart | null; loading: boolean; error: string; busy: boolean; checkoutLocked: boolean; notice: string; failed: boolean; mutate: (path: string, body: Record<string, unknown>) => Promise<void>; setQuantity: (id: number, quantity: number) => void; flushCart: () => Promise<void>; beginCheckout: () => Promise<() => void>; refreshCart: () => Promise<void>; reload: () => void }
const Context = createContext<Store>(null!);
let cartRequest: Promise<Cart> | undefined;
function initialSession() { return cartRequest ??= api<Cart>('cart').catch(error => { cartRequest = undefined; throw error; }); }
let catalogRequest: Promise<{ products: Product[]; categories: Category[] }> | undefined;
function loadCatalog() {
  return catalogRequest ??= (async () => {
    const [products, categories] = await Promise.all([api<Product[]>('products?per_page=100'), api<Category[]>('products/categories?per_page=100')]);
    const grouped = await Promise.all(categories.map(c => api<Product[]>('products?per_page=100&category=' + c.id)));
    return { products: products.map(p => ({ ...p, categories: categories.filter((_, i) => grouped[i].some(item => item.id === p.id)) })), categories };
  })().catch(error => { catalogRequest = undefined; throw error; });
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [sync] = useState(() => new CartSync((path, body) => api<Cart>(path, body)));
  const state = useSyncExternalStore(sync.subscribe, sync.getSnapshot);
  const [products, setProducts] = useState<Product[]>([]), [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [initialCart] = useState(initialSession);
  useEffect(() => { let active = true; initialCart.then(cart => { if (active) sync.hydrate(cart); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [sync, initialCart]);
  async function reload() { setLoading(true); setError(''); try { const data = await loadCatalog(); setProducts(data.products); setCategories(data.categories); if (!sync.getSnapshot().cart) sync.hydrate(await (cartRequest || initialSession())); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } }
  useEffect(() => { void reload(); }, []);
  async function mutate(path: string, body: Record<string, unknown>) {
    if (path === 'cart/add-item') { const p = products.find(p => p.id === Number(body.id)); if (p) sync.add(p, Number(body.quantity)); }
    else { const item = state.cart?.items.find(item => item.key === body.key); if (item) sync.setQuantity(item.id, path === 'cart/remove-item' ? 0 : Number(body.quantity)); }
  }
  return <Context.Provider value={{ products, categories, ...state, loading, error, mutate, setQuantity: (id, quantity) => sync.setQuantity(id, quantity), flushCart: () => sync.flush(), beginCheckout: () => sync.lockForCheckout(), refreshCart: () => sync.refresh(), reload }}>{children}</Context.Provider>;
}
export const useStore = () => useContext(Context);

