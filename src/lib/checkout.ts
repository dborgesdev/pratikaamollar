import type { Cart } from './types';
const action = 'https://loja.pratikaamollar.com.br/wp-admin/admin-post.php';
export async function checkoutTransfer(cart: Cart, send: typeof fetch = fetch) {
  const response = await send('/api/handoff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.items.map(({ key, id, quantity }) => ({ key, id, quantity })) }), signal: AbortSignal.timeout(45000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Não foi possível abrir o checkout. Seu carrinho está preservado. Tente novamente.');
  if (data.action !== action || data.fields?.action !== 'pa_handoff' || typeof data.fields.payload !== 'string' || !/^[A-Za-z0-9_-]+$/.test(data.fields.payload) || typeof data.fields.signature !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(data.fields.signature)) throw new Error('Transferência inválida. Seu carrinho está preservado. Tente novamente.');
  return { action, fields: { action: 'pa_handoff', payload: data.fields.payload as string, signature: data.fields.signature as string } };
}
