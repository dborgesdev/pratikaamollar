import type { Prices } from './types';
export const native = 'https://loja.pratikaamollar.com.br';
export const whatsapp = 'https://wa.me/5517991628264?text=' + encodeURIComponent('Olá! Gostaria de informações sobre os produtos da Pratika Amollar.');
export function plain(value: string) { return new DOMParser().parseFromString(value, 'text/html').body.textContent || ''; }
export function money(p: Prices) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: p.currency_code }).format(Number(p.price) / 10 ** p.currency_minor_unit); }
export async function api<T>(path: string, body?: object): Promise<T> {
  try {
    const response = await fetch('/api/store/' + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(body ? 90000 : 30000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Não foi possível conectar à loja. Tente novamente.');
    return data as T;
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) throw new Error('A loja demorou para responder. Vamos conferir o estado do carrinho.', { cause: error });
    throw error;
  }
}


