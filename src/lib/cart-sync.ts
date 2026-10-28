import type { Cart, CartItem, Product } from './types';

type Transport = (path: string, body?: object) => Promise<Cart>;
interface Intent { quantity: number; revision: number; product?: Product }
export interface CartSnapshot { cart: Cart | null; busy: boolean; notice: string; failed: boolean; checkoutLocked: boolean }

/** One authoritative session, one writer, absolute quantity intents. */
export class CartSync {
  private confirmed: Cart | null = null;
  private intents = new Map<number, Intent>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private uncertain = false;
  private locked = false;
  private running: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private snapshot: CartSnapshot = { cart: null, busy: false, notice: '', failed: false, checkoutLocked: false };
  constructor(private transport: Transport, private delay = 280) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  hydrate(cart: Cart) { if (!this.running) { this.confirmed = cart; this.publish('', false); } }
  private project(): Cart | null {
    if (!this.confirmed) return null;
    let delta = 0;
    const items = this.confirmed.items.map(item => ({ ...item }));
    for (const [id, intent] of this.intents) {
      const index = items.findIndex(item => item.id === id);
      const current = items[index];
      const p = intent.product;
      if (!current && !p) continue;
      const price = current?.prices || p!.prices;
      const unit = current && current.quantity ? Number(current.totals.line_total) / current.quantity : Number(price.price);
      const total = Math.round(unit * intent.quantity);
      delta += total - Number(current?.totals.line_total || 0);
      const next: CartItem = current ? { ...current, quantity: intent.quantity, totals: { ...current.totals, line_total: String(total) } } : {
        id, key: 'pending-' + id, name: p!.name, images: p!.images, prices: p!.prices,
        quantity: intent.quantity, quantity_limits: { minimum: 1, maximum: 99, editable: true },
        totals: { line_total: String(total), currency_code: price.currency_code, currency_minor_unit: price.currency_minor_unit },
      };
      if (index >= 0) { if (intent.quantity === 0) items.splice(index, 1); else items[index] = next; }
      else if (intent.quantity > 0) items.push(next);
    }
    return { ...this.confirmed, items, items_count: items.reduce((sum, i) => sum + i.quantity, 0), totals: { ...this.confirmed.totals, total_price: String(Math.max(0, Number(this.confirmed.totals.total_price) + delta)) } };
  }
  private publish(notice = this.snapshot.notice, failed = this.snapshot.failed) {
    this.snapshot = { cart: this.project(), busy: this.intents.size > 0 || !!this.running, notice, failed, checkoutLocked: this.locked };
    this.listeners.forEach(listener => listener());
  }
  add(product: Product, quantity: number) {
    if (!this.confirmed) { this.publish('O carrinho está conectando. Tente novamente em instantes.', true); return; }
    if (!product.is_in_stock || !product.is_purchasable) { this.publish('Produto indisponível para compra.', true); return; }
    const current = this.project()?.items.find(item => item.id === product.id);
    this.setQuantity(product.id, (current?.quantity || 0) + quantity, product);
  }
  setQuantity(id: number, quantity: number, product?: Product) {
    if (this.locked || !this.confirmed || !Number.isInteger(quantity) || quantity < 0) return;
    const current = this.project()?.items.find(item => item.id === id);
    const maximum = current?.quantity_limits.maximum ?? 99;
    const minimum = current?.quantity_limits.minimum ?? 1;
    if (current && !current.quantity_limits.editable && quantity > 0) return;
    const target = quantity === 0 ? 0 : Math.max(minimum, Math.min(maximum, quantity));
    this.intents.set(id, { quantity: target, revision: ++this.revision, product: product || this.intents.get(id)?.product });
    this.publish(target === 0 ? 'Produto removido. Sincronizando…' : 'Carrinho atualizado. Sincronizando…', false);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.drain(); }, this.delay);
  }
  private drain(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.process().finally(() => { this.running = null; this.publish(); });
    this.publish();
    return this.running;
  }
  private async process() {
    while (this.intents.size) {
      const [id, intent] = this.intents.entries().next().value!;
      let current = this.confirmed?.items.find(item => item.id === id);
      try {
        if (this.uncertain) { this.confirmed = await this.transport('cart'); this.uncertain = false; current = this.confirmed.items.find(item => item.id === id); }
        if (current?.quantity === intent.quantity || (!current && intent.quantity === 0)) {
          this.intents.delete(id); this.publish(); continue;
        }
        const path = !current ? 'cart/add-item' : intent.quantity === 0 ? 'cart/remove-item' : 'cart/update-item';
        const body = !current ? { id, quantity: intent.quantity } : intent.quantity === 0 ? { key: current.key } : { key: current.key, quantity: intent.quantity };
        this.confirmed = await this.transport(path, body);
        if (this.intents.get(id)?.revision === intent.revision) this.intents.delete(id);
        this.publish(this.intents.size ? 'Sincronizando carrinho…' : 'Carrinho sincronizado.', false);
      } catch (error) {
        // Never retry an ambiguous add blindly: read authoritative session first.
        try { this.confirmed = await this.transport('cart'); this.uncertain = false; } catch { this.uncertain = true; /* Keep last confirmed state, checkout stays blocked. */ }
        this.intents.clear();
        this.publish((error as Error).message + ' Confira as quantidades do carrinho antes de continuar.', true);
        break;
      }
    }
  }
  async refresh() {
    clearTimeout(this.timer);
    if (this.running) await this.running;
    this.running = (async () => {
      this.confirmed = await this.transport('cart');
      this.uncertain = false;
      this.publish('Carrinho conferido. Você pode continuar.', false);
    })();
    this.publish();
    try { await this.running; } finally { this.running = null; this.publish(); }
    if (this.intents.size) await this.drain();
  }
  async lockForCheckout() {
    this.locked = true; this.publish();
    try { await this.flush(); } catch (error) { this.locked = false; this.publish(); throw error; }
    return () => { this.locked = false; this.publish(); };
  }
  async flush() {
    clearTimeout(this.timer);
    do { await this.drain(); } while (this.intents.size);
    if (this.snapshot.failed) throw new Error(this.snapshot.notice);
  }
}

