import { useEffect, useState } from 'react';
import type { Product } from '../lib/types';
import ProductPrice from './ProductPrice';
export default function SelectedProductPrice({ product, variationId }: { product: Product; variationId: number }) {
  const [variation, setVariation] = useState<Product | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!variationId) return;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    void fetch(`/api/product-option?product_id=${variationId}`, { credentials: 'omit', cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Variação indisponível');
      const data = await response.json() as Product;
      if (data.id !== variationId || !data.prices) throw new Error('Variação inválida');
      if (!controller.signal.aborted) setVariation(data);
    }).catch(() => { setFailed(true); }).finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [variationId]);
  return <>{variationId ? variation ? <ProductPrice product={variation} detail/> : <p className="detail-price" role="status">{failed ? 'Consulte o preço desta opção no carrinho.' : 'Consultando preço da opção…'}</p> : <ProductPrice product={product} detail/>}</>;
}
