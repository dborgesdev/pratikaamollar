export interface BannerImage { url: string; alt: string }
export interface Banner { id: number; desktop: BannerImage; mobile: BannerImage; link?: string }
function bannerLink(value: unknown): string | undefined {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url) return undefined;
  try { return ['https:', 'http:'].includes(new URL(url).protocol) ? url : undefined; } catch { return undefined; }
}
export const BANNERS_URL = 'https://loja.pratikaamollar.com.br/wp-json/wp/v2/banners?acf_format=standard&_embed=wp:featuredmedia&per_page=100&status=publish&orderby=date&order=desc';
function image(value: unknown): BannerImage | null {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : null;
  const url = typeof value === 'string' ? value : record?.url;
  if (typeof url !== 'string') return null;
  try { if (new URL(url).protocol !== 'https:') return null; } catch { return null; }
  const alt = [record?.alt, record?.title, record?.filename].find(value => typeof value === 'string' && value.trim());
  return { url, alt: typeof alt === 'string' ? alt : 'Pratika Amollar' };
}
export function normalizeBanners(data: unknown): Banner[] {
  if (!Array.isArray(data)) throw new Error('Resposta de banners inválida');
  const seen = new Set<number>();
  return data.flatMap(record => {
    if (!record || typeof record.id !== 'number' || seen.has(record.id) || (record.status && record.status !== 'publish')) return [];
    const desktop = image(record.acf?.desktop), mobile = image(record.acf?.mobile);
    if (!desktop || !mobile) return [];
    seen.add(record.id);
    return [{ id: record.id, desktop, mobile, link: bannerLink(record.acf?.link) }];
  });
}
export async function fetchBanners(signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<Banner[]> {
  const response = await fetcher(BANNERS_URL, { signal, credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error(`Banners: HTTP ${response.status}`);
  // WP limits collections to 100. Never silently display a partial campaign or fan out requests.
  if (Number(response.headers.get('X-WP-TotalPages')) > 1) throw new Error('Banners excedem 100 registros: reduzir publicados para manter consulta única');
  return normalizeBanners(await response.json());
}
