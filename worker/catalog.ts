import { normalizeCatalog, type CatalogPayload, type RawProduct } from '../shared/catalog';
import type { Category } from '../src/lib/types';
const API = 'https://loja.pratikaamollar.com.br/wp-json/wc/store/v1/';
interface Page<T> { items: T[]; pages: number | null }
export interface CatalogResult { data: CatalogPayload; timing: string }
/** Request-local aggregation only: no server cache, TTL, background sync or personal headers. */
export async function fetchCatalog(fetcher: typeof fetch = fetch): Promise<CatalogResult> {
  let requests = 0;
  const durations = { products: 0, categories: 0 };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  async function page<T>(endpoint: string, number: number, group: keyof typeof durations): Promise<Page<T>> {
    const start = performance.now(); requests++;
    const response = await fetcher(API + endpoint + '?per_page=100&page=' + number, {
      headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'manual', signal: controller.signal,
    });
    if (!response.ok) throw new Error('O catálogo WooCommerce não respondeu corretamente.');
    const items = await response.json() as T[];
    durations[group] += performance.now() - start;
    if (!Array.isArray(items)) throw new Error('Resposta de catálogo inválida.');
    const total = response.headers.get('X-WP-TotalPages');
    return { items, pages: total && /^\d+$/.test(total) ? Number(total) : null };
  }
  async function collection<T>(endpoint: string, group: keyof typeof durations): Promise<T[]> {
    const first = await page<T>(endpoint, 1, group);
    const items = [...first.items];
    let number = 2;
    while (first.pages !== null ? number <= first.pages : items.length > 0 && items.length % 100 === 0) {
      if (number > 100) throw new Error('O catálogo excede o limite seguro de paginação.');
      const next = await page<T>(endpoint, number++, group);
      items.push(...next.items);
      if (next.items.length < 100) break;
    }
    return items;
  }
  try {
    const [products, categories] = await Promise.all([collection<RawProduct>('products', 'products'), collection<Category>('products/categories', 'categories')]);
    const start = performance.now();
    const data = normalizeCatalog(products, categories, requests);
    return { data, timing: `wc-products;dur=${durations.products.toFixed(1)}, wc-categories;dur=${durations.categories.toFixed(1)}, normalize;dur=${(performance.now() - start).toFixed(2)}, wc-requests;desc="${requests}"` };
  } finally { clearTimeout(timeout); controller.abort(); }
}
export function catalogResponse(result: CatalogResult): Response {
  return Response.json(result.data, { headers: { 'Cache-Control': 'no-store', 'Server-Timing': result.timing, 'X-Content-Type-Options': 'nosniff' } });
}
