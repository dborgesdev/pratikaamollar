import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = createRequire(require.resolve('wrangler'))('miniflare');
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const parser = compile('../worker/infixs-quote.ts');
const prefix = 'infixs-correios-automatico-shipping-results';
const box = (suffix, content) => '<div class="' + prefix + suffix + '">' + content + '</div>';
const row = (label, cost, time = '') => '<div>' + box('-method', label) + time + '</div>' + box('-cost', cost);
const grid = rows => box('', box('-grid', '<div>Entrega</div><div>Custo</div>' + rows));

test('Infixs parser accepts the two template shapes and rejects unrecognized markup', async () => {
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: parser + '\nexport default {async fetch(request) { try { return Response.json(await parseInfixsQuote(await request.text())); } catch { return new Response(null, {status: 502}); } }};',
    compatibilityDate: '2026-10-01',
  }));
  try {
    const parse = html => runtime.dispatchFetch('http://localhost/', { method: 'POST', body: html });
    const rows = row('PAC &amp; entrega', '<del>R$ 2.199,99</del> R$&nbsp;1.234,50', box('-time', 'Até 5 dias úteis'))
      + row('SEDEX', 'R$ 25,09') + row('Frete grátis', 'Grátis');
    const expected = [
      { label: 'PAC & entrega', amountMinor: 123450, deliveryEstimate: 'Até 5 dias úteis' },
      { label: 'SEDEX', amountMinor: 2509, deliveryEstimate: null },
      { label: 'Frete grátis', amountMinor: 0, deliveryEstimate: null },
    ];
    assert.deepEqual(await (await parse(grid(rows))).json(), expected);
    assert.deepEqual(await (await parse(grid(rows).replaceAll('<div class', '<div style="color:black" class'))).json(), expected);
    assert.deepEqual(await (await parse(box('', box('-empty', 'Sem opções')))).json(), []);
    for (const html of ['0', '<p>Erro PHP</p>', grid(row('PAC', '<del>R$ 20,00</del>')), grid(row('PAC', 'USD 2.00'))]) {
      assert.equal((await parse(html)).status, 502);
    }
  } finally {
    await runtime.dispose();
  }
});

test('Worker quotes anonymously and rejects unsafe or unavailable requests', async () => {
  const handler = compile('../worker/shipping-quote.ts').replace(/^import .*;$/gm, '');
  const validation = compile('../shared/shipping-quote.ts');
  const html = grid(row('SEDEX', 'R$ 19,00'));
  const script = parser + validation + handler + `
    const fetch = async (url, options) => {
      if (options.redirect !== 'manual') throw new Error('Unsafe redirect policy');
      const headers = new Headers(options.headers);
      if (['Cookie', 'Cart-Token', 'Authorization', 'Nonce'].some(name => headers.has(name))) throw new Error('Credentials leaked');
      if (url.includes('/products/')) {
        if (url.endsWith('/3')) throw new Error('Connection failed');
        return Response.json(url.endsWith('/2')
          ? { id: 2, type: 'variable', is_purchasable: true, is_in_stock: true, variations: [{ id: 20 }] }
          : { id: 1, type: 'simple', is_purchasable: true, is_in_stock: true });
      }
      const expected = options.body.get('product_id') === '2' ? '20' : null;
      if (options.body.get('variation_id') !== expected || options.body.get('action') !== 'infixs_correios_automatico_calculate_shipping') throw new Error('Bad form');
      if (expected && options.body.get('quantity') !== '2') throw new Error('Bad quantity');
      return new Response(${JSON.stringify(html)}, { headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'test=anonymous' } });
    };
    export default {fetch(request) { return shippingQuote(request, new URL(request.url).searchParams.get('quantityEnabled')); }};
  `;
  const runtime = new Miniflare(convertV4MiniflareOptions({ modules: true, script, compatibilityDate: '2026-10-01' }));
  try {
    const quote = (input, multi = false) => runtime.dispatchFetch('http://localhost/api/shipping-quote?quantityEnabled=' + multi, {
      method: 'POST',
      headers: { Origin: 'http://localhost', 'Content-Type': 'application/json', Cookie: 'pa_cart=visitor', 'Cart-Token': 'visitor', Authorization: 'Bearer visitor' },
      body: JSON.stringify({ productId: 1, quantity: 1, postalCode: '01001000', ...input }),
    });
    const [simple, variable] = await Promise.all([quote({}), quote({ productId: 2, variationId: 20, quantity: 2 }, true)]);
    for (const response of [simple, variable]) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Set-Cookie'), null);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.equal((await response.json()).rates[0].amountMinor, 1900);
    }
    assert.equal((await quote({ quantity: 2 })).status, 422);
    assert.equal((await quote({ productId: 2, variationId: 21 })).status, 422);
    assert.equal((await quote({ postalCode: '123' })).status, 400);
    assert.equal((await quote({ productId: 3 })).status, 502);
  } finally {
    await runtime.dispose();
  }
});
