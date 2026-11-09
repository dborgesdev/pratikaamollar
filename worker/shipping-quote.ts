import { isShippingQuoteInput, type ShippingQuoteResult } from '../shared/shipping-quote';
import { parseInfixsQuote } from './infixs-quote';

const origin = 'https://loja.pratikaamollar.com.br';
const unavailable = 'Não foi possível consultar o frete agora. Tente novamente.';
let active = 0;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function boundedText(body: ReadableStream<Uint8Array> | null, max: number) {
  if (!body) throw new Error('Missing body');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let size = 0, result = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return result + decoder.decode();
      size += value.byteLength;
      if (size > max) throw new Error('Body too large');
      result += decoder.decode(value, { stream: true });
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
}

export async function shippingQuote(request: Request, quantityEnabled: string | undefined, limiter?: RateLimit) {
  if (request.method !== 'POST') return json({ message: 'Método não permitido.' }, 405);
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({ message: 'Origem inválida.' }, 403);
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return json({ message: 'Formato inválido.' }, 415);
  let input: unknown;
  try { input = JSON.parse(await boundedText(request.body, 1024)); }
  catch { return json({ message: 'Consulta inválida.' }, 400); }
  if (!isShippingQuoteInput(input)) return json({ message: 'Confira o produto, a quantidade e o CEP.' }, 400);
  if (input.quantity > 1 && quantityEnabled !== 'true') {
    return json({ message: 'A cotação para mais de uma unidade está disponível na finalização da compra.' }, 422);
  }
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  if ((limiter && !(await limiter.limit({ key: ip })).success) || active >= 8) {
    return json({ message: 'Muitas consultas de frete. Aguarde e tente novamente.' }, 429);
  }

  active++;
  const signal = AbortSignal.timeout(10000);
  let stage = 'catalog';
  try {
    const options = { redirect: 'manual', cache: 'no-store', signal } as const;
    const product = await fetch(origin + '/wp-json/wc/store/v1/products/' + input.productId, options);
    if (product.status === 404) return json({ message: 'Produto indisponível.' }, 404);
    if (!product.ok) throw new Error('Catalog unavailable');
    const data = JSON.parse(await boundedText(product.body, 256 * 1024));
    if (data.id !== input.productId || !data.is_purchasable || !data.is_in_stock
      || (data.sold_individually && input.quantity > 1)
      || (data.type === 'variable' ? !data.variations?.some((variation: { id: number }) => variation.id === input.variationId)
        : data.type !== 'simple' || input.variationId !== undefined)) {
      return json({ message: 'Confira a opção e a quantidade do produto.' }, 422);
    }
    const body = new URLSearchParams({
      action: 'infixs_correios_automatico_calculate_shipping',
      postcode: input.postalCode,
      product_id: String(input.productId),
      quantity: String(input.quantity),
    });
    if (input.variationId !== undefined) body.set('variation_id', String(input.variationId));
    stage = 'ajax';
    const result = await fetch(origin + '/wp-admin/admin-ajax.php', { ...options, method: 'POST', body });
    if (!result.ok || !result.headers.get('Content-Type')?.startsWith('text/html')) throw new Error('Infixs unavailable');
    stage = 'normalize';
    const rates = await parseInfixsQuote(await boundedText(result.body, 64 * 1024));
    return json({ currency: 'BRL', quantity: input.quantity, rates } satisfies ShippingQuoteResult);
  } catch {
    console.warn('Shipping quote failed', { stage, timeout: signal.aborted });
    return json({ message: unavailable }, signal.aborted ? 504 : 502);
  } finally {
    active--;
  }
}
