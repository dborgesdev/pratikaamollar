import CardGallery from './CardGallery';
import ProductPrice from './ProductPrice';
import RatingSummary from './RatingSummary';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import { plain } from '../lib/api';
import AddToCart from './AddToCart';
export default function ProductCard({ product: p }: { product: Product }) {
  return <article className="product-card"><CardGallery product={p}/><div className="product-content"><small>{p.categories.map(c => c.name).join(' / ')}</small><Link className="product-name" to={'/produto/' + p.slug}>{plain(p.name)}</Link><RatingSummary product={p}/><ProductPrice product={p}/>{p.is_purchasable && p.is_in_stock && p.type === 'simple' ? <AddToCart product={p}/> : <Link className="button outline" to={'/produto/' + p.slug}>Conhecer produto</Link>}</div></article>;
}
