import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Cart } from './types';
import { api } from './api';
import { CartSync } from './cart-sync';
import { catalogResource } from './catalog-session';
import type { Category, Product } from './types';
interface CatalogState { products: Product[]; categories: Category[]; loading: boolean; error: string; reload: () => void }
interface CartState extends ReturnType<CartSync['getSnapshot']> {
  cartLoading: boolean; cartError: string; loadCart: () => Promise<void>;
  mutate: (path: string, body: Record<string, unknown>) => Promise<void>;
  setQuantity: (id: number, quantity: number) => void; flushCart: () => Promise<void>;
  beginCheckout: () => Promise<() => void>; refreshCart: () => Promise<void>;
}
const CatalogContext = createContext<CatalogState>(null!);
const CartContext = createContext<CartState>(null!);
let cartRequest: Promise<Cart> | undefined;
function initialSession() { return cartRequest ??= api<Cart>('cart').catch(error => { cartRequest = undefined; throw error; }); }
export function needsCatalog(path: string) { return path === '/' || path === '/produtos' || path.startsWith('/categoria/') || path.startsWith('/produto/'); }
export function StoreProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [sync] = useState(() => new CartSync((path, body) => api<Cart>(path, body)));
  const cart = useSyncExternalStore(sync.subscribe, sync.getSnapshot);
  const catalog = useSyncExternalStore(catalogResource.subscribe, catalogResource.getSnapshot);
  const [cartLoading, setCartLoading] = useState(false), [cartError, setCartError] = useState('');
  const catalogState = useMemo<CatalogState>(() => ({
    products: catalog.data?.products || [], categories: catalog.data?.categories || [],
    loading: !catalog.data && (catalog.status === 'idle' || catalog.status === 'loading'), error: catalog.error,
    reload: () => { void catalogResource.load().catch(() => {}); },
  }), [catalog]);
  async function loadCart() {
    if (sync.getSnapshot().cart) return;
    setCartLoading(true); setCartError('');
    try { sync.hydrate(await initialSession()); } catch (error) { setCartError((error as Error).message); throw error; } finally { setCartLoading(false); }
  }
  useEffect(() => { if (needsCatalog(pathname)) void catalogResource.load().catch(() => {}); }, [pathname]);
  useEffect(() => {
    // Session reads do not compete with essential catalogue requests or hold the home loader.
    if (pathname === '/carrinho' || catalog.status === 'ready') void loadCart().catch(() => {});
  }, [pathname, catalog.status]);
  async function mutate(path: string, body: Record<string, unknown>) {
    await loadCart();
    if (path === 'cart/add-item') { const product = catalog.data?.products.find(item => item.id === Number(body.id)); if (product) sync.add(product, Number(body.quantity)); }
    else { const item = sync.getSnapshot().cart?.items.find(item => item.key === body.key); if (item) sync.setQuantity(item.id, path === 'cart/remove-item' ? 0 : Number(body.quantity)); }
  }
  const cartState: CartState = { ...cart, cartLoading, cartError, loadCart, mutate, setQuantity: (id, quantity) => sync.setQuantity(id, quantity), flushCart: () => sync.flush(), beginCheckout: () => sync.lockForCheckout(), refreshCart: () => sync.refresh() };
  return <CatalogContext.Provider value={catalogState}><CartContext.Provider value={cartState}>{children}</CartContext.Provider></CatalogContext.Provider>;
}
export const useCatalog = () => useContext(CatalogContext);
export const useCart = () => useContext(CartContext);
export function useStore() { return { ...useCatalog(), ...useCart() }; }
