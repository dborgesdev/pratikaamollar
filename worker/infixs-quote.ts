import type { ShippingRate } from '../shared/shipping-quote';

const prefix = '.infixs-correios-automatico-shipping-results';
const grid = prefix + ' > ' + prefix + '-grid';
const row = grid + ' > div > ';

export async function parseInfixsQuote(html: string): Promise<ShippingRate[]> {
  const fields: { kind: string; text: string }[] = [];
  let roots = 0, grids = 0, empty = 0, cells = 0;
  const rewriter = new HTMLRewriter()
    .on(prefix, { element() { roots++; } })
    .on(grid, { element() { grids++; } })
    .on(grid + ' > div', { element() { cells++; } })
    .on(prefix + ' > ' + prefix + '-empty', { element() { empty++; } });
  // Remove crossed-out prices before collecting the current cost.
  const clean = await new HTMLRewriter().on(grid + ' > ' + prefix + '-cost > del', {
    element(element) { element.remove(); },
  }).transform(new Response(html)).text();

  for (const [kind, selector] of [
    ['label', row + prefix + '-method'],
    ['time', row + prefix + '-time'],
    ['cost', grid + ' > ' + prefix + '-cost'],
  ]) {
    let field: (typeof fields)[number];
    rewriter.on(selector, {
      element() { field = { kind, text: '' }; fields.push(field); },
      text(chunk) { field.text += chunk.text; },
    });
  }
  await rewriter.transform(new Response(clean)).text();
  if (roots === 1 && empty === 1 && grids === 0) return [];
  if (roots !== 1 || grids !== 1 || empty !== 0) throw new Error('Unexpected Infixs markup');
  const rates: ShippingRate[] = [];
  for (let index = 0; index < fields.length;) {
    const label = fields[index++];
    const time = fields[index]?.kind === 'time' ? fields[index++] : undefined;
    const cost = fields[index++];
    const price = decodeText(cost?.text ?? '');
    const amountMinor = price === 'Grátis' ? 0 : parseBrl(price);
    const name = decodeText(label.text);
    if (label.kind !== 'label' || !name || cost?.kind !== 'cost' || !Number.isSafeInteger(amountMinor)) {
      throw new Error('Unexpected Infixs rate');
    }
    rates.push({ label: name, deliveryEstimate: time ? decodeText(time.text) || null : null, amountMinor });
  }
  if (!rates.length || cells !== 2 + rates.length * 2) throw new Error('Unexpected Infixs grid');
  return rates;
}

function parseBrl(price: string): number {
  const match = /^R\$\s*([0-9]+|[0-9]{1,3}(?:\.[0-9]{3})+),([0-9]{2})$/.exec(price);
  return match ? Number(match[1].replaceAll('.', '') + match[2]) : NaN;
}

// The templates escape every visible field with esc_html().
function decodeText(text: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key: string) => {
    if (!key.startsWith('#')) return entities[key] ?? entity;
    const value = key[1]?.toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return value <= 0x10ffff ? String.fromCodePoint(value) : entity;
  }).trim();
}
