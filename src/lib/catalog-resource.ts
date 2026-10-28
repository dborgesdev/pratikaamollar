import type { CatalogPayload } from '../../shared/catalog';
export interface CatalogSnapshot { data: CatalogPayload | null; status: 'idle' | 'loading' | 'ready' | 'error'; error: string }
type FetchCatalog = (signal: AbortSignal) => Promise<CatalogPayload>;
/** Reuse the loaded document/session data, without TTL, persistence or periodic refresh. */
export class CatalogResource {
  private snapshot: CatalogSnapshot;
  private listeners = new Set<() => void>();
  private pending: Promise<CatalogPayload> | null = null;
  constructor(private fetcher: FetchCatalog, initial: CatalogPayload | null = null, private timeoutMs = 20000) {
    this.snapshot = { data: initial, status: initial ? 'ready' : 'idle', error: '' };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(snapshot: CatalogSnapshot) { this.snapshot = snapshot; this.listeners.forEach(listener => listener()); }
  load(): Promise<CatalogPayload> {
    if (this.snapshot.data) return Promise.resolve(this.snapshot.data);
    if (this.pending) return this.pending;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('O catálogo demorou para responder. Tente novamente.')); }, this.timeoutMs);
    });
    this.publish({ ...this.snapshot, status: 'loading', error: '' });
    this.pending = Promise.race([Promise.resolve().then(() => this.fetcher(controller.signal)), timeout]).then(data => {
      if (!Array.isArray(data.products) || !Array.isArray(data.categories)) throw new Error('Não foi possível ler o catálogo.');
      this.publish({ data, status: 'ready', error: '' }); return data;
    }).catch(error => { this.publish({ data: null, status: 'error', error: (error as Error).message || 'Não foi possível carregar o catálogo.' }); throw error; })
      .finally(() => { clearTimeout(timer); this.pending = null; });
    return this.pending;
  }
}
