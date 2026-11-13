import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import { catalogPage } from '../lib/catalog-pagination';
import ProductCard from './ProductCard';

export default function CatalogProducts({ products }: { products: Product[] }) {
  const [requestedPage, setPage] = useState(1);
  const { items, page, pages } = catalogPage(products, requestedPage);
  // Data can shrink independently of navigation; persist the clamped page so growth won't jump back.
  useEffect(() => { setPage(current => Math.min(current, pages)); }, [pages]);
  return <div className="catalog-results">
    <p className="result-count">{products.length} produtos encontrados</p>
    <div className="product-grid catalog-grid">{items.map(product => <ProductCard key={product.id} product={product}/>)}</div>
    {!products.length && <div className="empty"><h2>Nenhum produto encontrado.</h2><Link className="button" to="/produtos">Ver todos os produtos</Link></div>}
    {pages > 1 && <nav className="pagination catalog-pagination" aria-label="Páginas do catálogo">
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
      <span role="status" aria-live="polite" aria-atomic="true">Página {page} de {pages}</span>
      <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)}>Próxima</button>
    </nav>}
  </div>;
}
