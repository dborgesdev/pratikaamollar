import { httpsUrl } from './product-presentation';
export const HERO_IMAGE_URL = 'https://loja.pratikaamollar.com.br/wp-json/wp/v2/hero-img?_embed=wp:featuredmedia&per_page=1&status=publish&orderby=date&order=desc';
export function heroImage(data: unknown): { src: string; alt: string } | null {
  if (!Array.isArray(data)) return null;
  const post = data[0], media = post?._embedded?.['wp:featuredmedia']?.[0];
  const src = httpsUrl(media?.source_url);
  return post?.status === 'publish' && media?.media_type === 'image' && src ? { src, alt: typeof media.alt_text === 'string' ? media.alt_text : '' } : null;
}

export async function fetchHeroImage(signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<{ src: string; alt: string } | null> {
  try {
    const response = await fetcher(HERO_IMAGE_URL, { signal, credentials: 'omit', cache: 'no-store' });
    return response.ok ? heroImage(await response.json()) : null;
  } catch { return null; }
}
