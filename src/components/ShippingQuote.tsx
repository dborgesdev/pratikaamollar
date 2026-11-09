import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { ShippingQuoteInput, ShippingQuoteResult } from '../../shared/shipping-quote'
import { requestShippingQuote } from '../lib/shipping-quote'

type Props = Omit<ShippingQuoteInput, 'postalCode'> & { requiresVariation: boolean }

export function ShippingQuote({ productId, variationId, quantity, requiresVariation }: Props) {
  const id = useId()
  const [cep, setCep] = useState('')
  const [result, setResult] = useState<ShippingQuoteResult | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  const waitingForVariation = requiresVariation && variationId === undefined

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (waitingForVariation || loading) return
    setResult(null)
    if (cep.length !== 8) {
      setMessage('Informe um CEP com oito dígitos.')
      return
    }
    const controller = new AbortController()
    request.current = controller
    setMessage('')
    setLoading(true)
    try {
      const quote = await requestShippingQuote({ productId, variationId, quantity, postalCode: cep }, controller.signal)
      if (!controller.signal.aborted) setResult(quote)
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Falha na consulta de frete.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return <section aria-labelledby={id + '-title'} className="mt-5 border-t border-[var(--line)] pt-4">
    <h2 id={id + '-title'} className="mb-3 font-sans text-base font-bold tracking-normal">Calcule o frete e o prazo de entrega</h2>
    <form onSubmit={calculate}>
      <label htmlFor={id} className="mb-1 block text-sm">CEP</label>
      <div className="flex flex-wrap items-center gap-2">
        <input id={id} className="w-36" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
          value={cep.length > 5 ? cep.slice(0, 5) + '-' + cep.slice(5) : cep}
          onChange={event => {
            request.current?.abort()
            setCep(event.target.value.replace(/\D/g, '').slice(0, 8))
            setResult(null)
            setMessage('')
            setLoading(false)
          }} />
        <button type="submit" className="button outline" disabled={loading || waitingForVariation}>Calcular</button>
      </div>
    </form>
    <div role="status" className="mt-2 text-sm">
      {waitingForVariation && 'Selecione uma opção para calcular o frete.'}
      {loading && 'Consultando frete…'}
      {message}
      {result && (result.rates.length ? <>
        <ul className="space-y-2">
          {result.rates.map((rate, index) => <li key={index} className="flex flex-wrap justify-between gap-x-4 border-b border-[var(--line)] py-2">
            <span><strong>{rate.label}</strong>{rate.deliveryEstimate && <span className="block">{rate.deliveryEstimate}</span>}</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: result.currency }).format(rate.amountMinor / 100)}</span>
          </li>)}
        </ul>
        <p className="mt-2">Valor estimado para este produto. O frete final será confirmado na finalização da compra.</p>
      </> : 'Nenhuma opção de entrega foi retornada para este CEP.')}
    </div>
  </section>
}
