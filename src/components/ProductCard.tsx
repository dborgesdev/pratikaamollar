import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import type { Product } from '../lib/types';
import { money, plain } from '../lib/api';
import { useCart } from '../lib/store';
export default function ProductCard({ product: p }: { product: Product }) {
  const { mutate, cart, checkoutLocked } = useCart();
  const quantity = cart?.items.find(item => item.id === p.id)?.quantity || 0;
  return <article className="product-card"><Link className="product-image" to={'/produto/' + p.slug}><img src={p.images[0]?.thumbnail || p.images[0]?.src} srcSet={p.images[0]?.srcset} sizes="(max-width: 600px) 90vw, (max-width: 1024px) 40vw, 300px" alt={plain(p.name)} loading="lazy" width="430" height="430"/><span><ArrowUpRight size={21}/></span></Link><div className="product-content"><small>{p.categories.map(c => c.name).join(' / ')}</small><Link className="product-name" to={'/produto/' + p.slug}>{plain(p.name)}</Link><strong className="price">{Number(p.prices.price) > 0 ? money(p.prices) : 'Consulte disponibilidade'}</strong>{p.is_purchasable && p.is_in_stock && p.type === 'simple' ? <button className={'button add-button ' + (quantity ? 'in-cart' : '')} disabled={!cart || checkoutLocked} onClick={() => void mutate('cart/add-item', { id: p.id, quantity: 1 })}>{quantity ? <><Check size={17}/> {quantity} no carrinho · adicionar</> : <>Adicionar ao carrinho <Plus size={18}/></>}</button> : <Link className="button outline" to={'/produto/' + p.slug}>Conhecer produto <ArrowUpRight size={18}/></Link>}</div></article>;
}
