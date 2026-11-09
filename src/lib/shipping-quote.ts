import type { ShippingQuoteInput, ShippingQuoteResult } from '../../shared/shipping-quote'

export async function requestShippingQuote(input: ShippingQuoteInput, signal: AbortSignal): Promise<ShippingQuoteResult> {
  try {
    const response = await fetch('/api/shipping-quote', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal,
    })
    const data = await response.json()
    if (response.ok && data.currency === 'BRL' && data.quantity === input.quantity && Array.isArray(data.rates)) return data
    if (!response.ok && typeof data.message === 'string') return Promise.reject(new Error(data.message))
  } catch {
    // Network and malformed responses use the same public message.
  }
  throw new Error('Não foi possível consultar o frete agora. Tente novamente.')
}
