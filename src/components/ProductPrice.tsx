import type { Product } from '../lib/types';
import { money } from '../lib/api';
import { promotion } from '../lib/product-presentation';
export default function ProductPrice({ product: p, detail = false }: { product: Product; detail?: boolean }) {
  const sale = promotion(p), range = p.prices.price_range;
  return <div className={detail ? 'detail-price product-price' : 'price product-price'}>{sale && <><del aria-label="Preço original">{money({ ...p.prices, price: p.prices.regular_price })}</del><span className="offer-label">Oferta</span></>}<strong>{Number(p.prices.price) > 0 ? range && range.min_amount !== range.max_amount ? `${money({ ...p.prices, price: range.min_amount })} – ${money({ ...p.prices, price: range.max_amount })}` : money(p.prices) : 'Consulte disponibilidade'}</strong></div>;
}
