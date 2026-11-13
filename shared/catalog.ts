import { productVideos } from '../src/lib/product-media';
import type { Category, Picture, Product } from '../src/lib/types';
export interface CatalogData { products: Product[]; categories: Category[] }
export interface CatalogPayload extends CatalogData {
  meta: { source: 'woocommerce-store-api'; upstreamRequests: number; categoryFallbacks: number };
}
export type RawProduct = Product & { permalink?: string; extensions?: { pratika_media?: unknown } };
function picture(image: Picture, responsive: boolean): Picture {
  return { id: image.id, src: image.src, thumbnail: image.thumbnail || image.src, alt: image.alt || '', srcset: responsive ? image.srcset || '' : '', sizes: responsive ? image.sizes || '' : '' };
}
/** Preserve API associations; use only a matching, same-origin canonical category when the API omits them. */
export function normalizeCatalog(raw: RawProduct[], metadata: Category[], upstreamRequests: number): CatalogPayload {
  let categoryFallbacks = 0;
  const byId = new Map(metadata.map(category => [category.id, category]));
  for (const product of raw) for (const category of product.categories || []) {
    if (!byId.has(category.id)) byId.set(category.id, { ...category, image: null, count: 0 });
  }
  const categories = [...byId.values()].map(category => ({ id: category.id, name: category.name, slug: category.slug, count: 0, image: category.image ? picture(category.image, false) : null }));
  const products = raw.map(product => {
    let assigned = (product.categories || []).map(category => categories.find(item => item.id === category.id)!).filter(Boolean);
    if (!assigned.length && product.permalink) {
      try {
        const url = new URL(product.permalink);
        const path = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
        if (url.origin === 'https://loja.pratikaamollar.com.br' && path[0] === 'shop') {
          const category = categories.find(item => path.slice(1, -1).includes(item.slug));
          if (category) { assigned = [category]; categoryFallbacks++; }
        }
      } catch { /* Invalid permalinks do not become invented category associations. */ }
    }
    assigned.forEach(category => category.count++);
    const unique = (product.images || []).filter((image, index, all) => all.findIndex(other => other.src === image.src) === index);
    return {
      id: product.id, name: product.name, slug: product.slug, type: product.type, on_sale: product.on_sale === true, average_rating: product.average_rating, review_count: product.review_count,
      description: product.description || '', short_description: product.short_description || '',
      prices: { price: product.prices.price, regular_price: product.prices.regular_price, sale_price: product.prices.sale_price, price_range: product.prices.price_range, currency_code: product.prices.currency_code, currency_minor_unit: product.prices.currency_minor_unit },
      images: unique.map((image, index) => picture(image, index === 0)),
      videos: productVideos(product.extensions?.pratika_media, unique),
      is_in_stock: product.is_in_stock, is_purchasable: product.is_purchasable,
      categories: assigned, attributes: product.attributes || [], variations: product.variations || [],
    };
  });
  return { products, categories: categories.filter(category => category.count > 0), meta: { source: 'woocommerce-store-api', upstreamRequests, categoryFallbacks } };
}
