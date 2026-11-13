import { googleReviews } from '../data/googleReviews';
import { Stars } from './RatingSummary';

export default function StoreReviews() {
  return <section className="store-reviews" aria-labelledby="store-reviews-title">
    <h3 id="store-reviews-title">O que nossos clientes dizem</h3>
    <p className="store-reviews-source">Avaliações da Pratika Amollar no Google</p>
    <div className="store-reviews-grid">{googleReviews.map(review => <article className="store-review" key={review.author}>
      <strong>{review.author}</strong>
      <Stars value={review.rating}/>
      <p>{review.comment}</p>
    </article>)}</div>
    <a className="text-link" href="https://maps.app.goo.gl/SJFiVidLhGNtgSLCA" target="_blank" rel="noopener noreferrer">Ver perfil da loja no Google <span className="sr-only">(abre em outra aba)</span></a>
  </section>;
}
