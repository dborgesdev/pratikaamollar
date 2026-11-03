interface Item { key: string; id: number; quantity: number; variation: { attribute: string; value: string }[] }
const reply = (message: string, status: number) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
export async function prepareHandoff(request: Request, secret: string | undefined, readCart: () => Promise<Response>): Promise<Response> {
  if (request.method !== 'POST' || request.headers.get('Origin') !== new URL(request.url).origin) return reply('Origem inválida.', 403);
  if (!secret || secret.length < 32) return reply('A transferência segura aguarda configuração da ponte WordPress. Seu carrinho está preservado.', 503);
  if (!request.headers.get('Cookie')?.split(';').some(c => /^pa_cart=.+/.test(c.trim()))) return reply('Sua sessão expirou. Confira o carrinho e tente novamente.', 409);
  let expected: unknown;
  try { const text = await request.text(); if (text.length > 12000) return reply('Requisição muito grande.', 413); expected = JSON.parse(text).items; } catch { return reply('Confira o carrinho antes de continuar.', 400); }
  const response = await readCart();
  if (!response.ok) return reply('Não foi possível validar sua sessão. Confira o carrinho e tente novamente.', response.status === 401 || response.status === 403 ? 409 : 502);
  const cart = await response.json() as { items: Item[]; errors?: unknown[] };
  if (!Array.isArray(cart.items) || !cart.items.length || cart.items.length > 100 || cart.errors?.length) return reply('O carrinho mudou ou contém itens indisponíveis. Confira-o antes de continuar.', 409);
  const items = cart.items.map(i => ({ key: i.key, id: i.id, quantity: i.quantity, variation: i.variation ?? [] }));
  if (items.some(i => typeof i.key !== 'string' || !i.key || !Number.isSafeInteger(i.id) || i.id < 1 || !Number.isSafeInteger(i.quantity) || i.quantity < 1 || i.quantity > 999 || !Array.isArray(i.variation) || i.variation.some(a => typeof a.attribute !== 'string' || typeof a.value !== 'string'))) return reply('Resposta de carrinho inválida.', 502);
  const snapshot = (rows: {key: string; id: number; quantity: number}[]) => JSON.stringify(rows.map(i => [i.key, i.id, i.quantity]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
  if (!Array.isArray(expected) || expected.length !== items.length || snapshot(expected) !== snapshot(items)) return reply('O carrinho da sessão mudou. Confira as quantidades e tente novamente.', 409);
  const now = Math.floor(Date.now() / 1000);
  const payload = encode(new TextEncoder().encode(JSON.stringify({ v: 2, iat: now, exp: now + 90, jti: crypto.randomUUID(), aud: 'pratika-checkout', origin: new URL(request.url).origin, items })));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = encode(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))));
  return Response.json({ action: 'https://loja.pratikaamollar.com.br/wp-admin/admin-post.php', fields: { action: 'pa_handoff', payload, signature } }, { headers: { 'Cache-Control': 'no-store' } });
}
