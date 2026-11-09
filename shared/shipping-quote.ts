export interface ShippingQuoteInput {
  productId: number
  variationId?: number
  quantity: number
  postalCode: string
}

export interface ShippingRate {
  label: string
  amountMinor: number
  deliveryEstimate: string | null
}

export interface ShippingQuoteResult {
  currency: 'BRL'
  quantity: number
  rates: ShippingRate[]
}

export function isShippingQuoteInput(value: unknown): value is ShippingQuoteInput {
  if (!value || typeof value !== 'object') return false
  const { productId, variationId, quantity, postalCode } = value as ShippingQuoteInput
  const validId = (id: number) => Number.isSafeInteger(id) && id > 0
  return validId(productId) && (variationId === undefined || validId(variationId))
    && Number.isInteger(quantity) && quantity >= 1 && quantity <= 99
    && typeof postalCode === 'string' && /^[0-9]{8}$/.test(postalCode)
}
