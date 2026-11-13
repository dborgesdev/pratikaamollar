import type { Product } from '../lib/types';
import { rating } from '../lib/product-presentation';
import RatingSummary from './RatingSummary';
import { useProductReviews } from './ReviewContext';

export default function ProductRating({ product }: { product: Product }) {
  const { policy, openForm, summary } = useProductReviews();
  const current = summary ? { ...product, ...summary } : product;
  if (rating(current)) return <a className="product-rating-link" href="#product-reviews"><RatingSummary product={current}/></a>;
  return current.review_count === 0 && policy?.enabled ? <button type="button" className="first-review" onClick={openForm}>Seja o primeiro a avaliar</button> : null;
}
