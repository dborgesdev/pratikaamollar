import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import type { Product } from '../lib/types';
import { fetchReviews, type Review } from '../lib/reviews';
import RatingSummary, { Stars } from './RatingSummary';
import StoreReviews from './StoreReviews';
import { showStoreReviews } from '../data/googleReviews';
import ReviewForm from './ReviewForm';
import { useProductReviews } from './ReviewContext';
import { submitReview } from '../lib/review-submission';
export default function ProductReviews({ product, loadReviews = fetchReviews, sendReview = submitReview }: { product: Product; loadReviews?: typeof fetchReviews; sendReview?: typeof submitReview }) {
  const [reviews, setReviews] = useState<Review[]>([]), [page, setPage] = useState(0), [more, setMore] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const { summary, refreshSummary } = useProductReviews();
  const currentProduct = summary ? { ...product, ...summary } : product;
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function load(reset = false) {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setBusy(true); setError('');
    try { const result = await loadReviews(product.id, reset ? 1 : page + 1, controller.signal); setReviews(current => [...(reset ? [] : current), ...result.reviews.filter(r => !current.some(other => other.id === r.id && !reset))]); setMore(result.more); setPage(current => reset ? 1 : current + 1); }
    catch { setError('Não foi possível carregar as avaliações. Tente novamente.'); }
    finally { clearTimeout(timeout); request.current = null; setBusy(false); }
  }
  return <section id="product-reviews" className="product-reviews description" aria-labelledby="reviews-title"><h2 id="reviews-title">Avaliações de clientes</h2><RatingSummary product={currentProduct}/>{showStoreReviews(currentProduct.review_count) && reviews.length === 0 && <StoreReviews/>}{!currentProduct.review_count && !page && <p>Ainda não há avaliações para este produto.</p>}{reviews.map(review => <article className="review" key={review.id}><div><strong>{review.reviewer || 'Cliente'}</strong>{review.verified === true && <span className="verified-review">Compra verificada</span>}</div>{review.rating > 0 && <Stars value={review.rating}/>}<div className="rich-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review.review) }}/></article>)}{page > 0 && !reviews.length && <p>Nenhum comentário disponível.</p>}{error && <p role="status">{error}</p>}{more && (Boolean(currentProduct.review_count) || page > 0 || error) && <button type="button" className="button outline" disabled={busy} onClick={() => void load()}>{busy ? 'Carregando…' : error ? 'Tentar novamente' : page ? 'Mais avaliações' : 'Ler comentários'}</button>}<ReviewForm productId={product.id} send={sendReview} onApproved={() => { void refreshSummary(); void load(true); }}/></section>;
}
