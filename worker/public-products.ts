const STORE = 'https://loja.pratikaamollar.com.br/wp-json/wc/store/v1/';
/** Public reads only. No cart token, cookies, credentials, redirects or persistent cache. */
export async function publicProductData(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const id = url.searchParams.get('product_id') || '';
  const page = url.searchParams.get('page') || '1';
  if (!/^[1-9]\d{0,9}$/.test(id) || !/^[1-9]\d{0,4}$/.test(page)) return Response.json({ message: 'Consulta inválida.' }, { status: 400 });
  const path = url.pathname === '/api/product-reviews' ? `products/reviews?product_id=${id}&page=${page}&per_page=10&orderby=date&order=desc` : `products/${id}`;
  try {
    const response = await fetcher(STORE + path, { headers: { Accept: 'application/json' }, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(12000) });
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    const pages = response.headers.get('X-WP-TotalPages');
    if (pages && /^\d+$/.test(pages)) headers.set('X-WP-TotalPages', pages);
    if (!response.ok) return Response.json({ message: 'Dados do produto indisponíveis.' }, { status: 502, headers });
    return new Response(response.body, { headers });
  } catch { return Response.json({ message: 'Dados do produto indisponíveis.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } }); }
}
