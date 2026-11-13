import type { Picture } from './types';
import { httpsUrl } from './product-presentation';
export interface ProductVideo { src: string; poster?: string; position: number; title: string; type: 'mp4' | 'youtube' | 'vimeo'; attachmentId: number }
export function embedUrl(type: ProductVideo['type'], src: string): string | undefined {
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:') return;
    if (type === 'youtube' && ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'].includes(url.hostname)) {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = url.hostname.endsWith('youtu.be') ? parts[0] : url.searchParams.get('v') || (['shorts', 'embed'].includes(parts[0]) ? parts[1] : '');
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&playsinline=1&controls=1&rel=0`;
    }
    if (type === 'vimeo' && ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(url.hostname)) {
      const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);
      if (match) {
        const hash = url.searchParams.get('h') || match[2];
        return `https://player.vimeo.com/video/${match[1]}?autoplay=0&playsinline=1${hash && /^[a-zA-Z0-9]+$/.test(hash) ? '&h=' + hash : ''}`;
      }
    }
  } catch { return; }
}
/** Our Store API extension reads the native WoodMart map; no ACF or extra fetches. */
export function productVideos(data: unknown, pictures: Picture[]): ProductVideo[] {
  const rows = (data as { videos?: unknown } | null)?.videos;
  if (!Array.isArray(rows)) return [];
  const seen = new Set<number>();
  return rows.flatMap(row => {
    const src = httpsUrl(row?.src), type = row?.type;
    const index = pictures.findIndex(picture => picture.id === row?.attachment_id);
    if (!src || index < 0 || seen.has(row.attachment_id) || !['mp4', 'youtube', 'vimeo'].includes(type) || (type !== 'mp4' && !embedUrl(type, src))) return [];
    seen.add(row.attachment_id);
    return [{ src, type, attachmentId: row.attachment_id, poster: httpsUrl(row.poster) || pictures[index].src, position: index + 1, title: typeof row.title === 'string' ? row.title : 'Vídeo do produto' }];
  });
}
