export interface Review { id: number; product_id: number; reviewer: string; review: string; rating: number; verified: boolean; date_created_gmt?: string }
export async function fetchReviews(id: number, page: number, signal: AbortSignal): Promise<{ reviews: Review[]; more: boolean }> {
  const response = await fetch(`/api/product-reviews?product_id=${id}&page=${page}`, { signal, credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar as avaliações.');
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error('Resposta de avaliações inválida.');
  const reviews = data.filter((r): r is Review => r?.product_id === id && Number.isInteger(r.id) && typeof r.review === 'string' && typeof r.reviewer === 'string' && Number.isFinite(r.rating) && r.rating >= 0 && r.rating <= 5);
  const pages = Number(response.headers.get('X-WP-TotalPages'));
  return { reviews, more: pages > 0 ? page < pages : data.length === 10 };
}
