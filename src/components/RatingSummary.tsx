import type { Product } from '../lib/types';
import { rating } from '../lib/product-presentation';
export function Stars({ value }: { value: number }) { return <span className="rating-stars" aria-label={`${value.toLocaleString('pt-BR')} de 5 estrelas`}><span aria-hidden="true">★★★★★</span><span aria-hidden="true" style={{ width: `${value / 5 * 100}%` }}>★★★★★</span></span>; }
export default function RatingSummary({ product }: { product: Product }) {
  const data = rating(product);
  return data ? <div className="rating-summary"><Stars value={data.average}/><span>{data.average.toLocaleString('pt-BR')} ({data.count} {data.count === 1 ? 'avaliação' : 'avaliações'})</span></div> : null;
}
