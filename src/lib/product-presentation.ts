import type { Product } from './types';
export function promotion(p: Product): boolean {
  const { price, regular_price, sale_price, price_range } = p.prices;
  return p.on_sale === true && p.type !== 'variable' && !price_range && /^\d+$/.test(price) && /^\d+$/.test(regular_price) && price === sale_price && Number(price) > 0 && Number(regular_price) > Number(price);
}
export function rating(p: Product): { average: number; count: number } | null {
  const average = Number(p.average_rating), count = p.review_count;
  return Number.isFinite(average) && average > 0 && average <= 5 && Number.isInteger(count) && Number(count) > 0 ? { average, count: Number(count) } : null;
}
export function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try { return new URL(value).protocol === 'https:' ? value : undefined; } catch { return; }
}
