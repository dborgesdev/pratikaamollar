import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Product } from '../lib/types';
import { plain } from '../lib/api';
export default function Seo({ title, description = 'Máquinas, rebolos e acessórios para afiação. Conheça os produtos da Pratika Amollar.', product }: { title: string; description?: string; product?: Product }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const fullTitle = title + ' | Pratika Amollar'; const url = 'https://pratikaamollar.com.br' + pathname;
    document.title = fullTitle;
    function meta(key: string, content: string, property = false) { let element = document.querySelector<HTMLMetaElement>(`meta[${property ? 'property' : 'name'}="${key}"]`); if (!element) { element = document.createElement('meta'); element.setAttribute(property ? 'property' : 'name', key); document.head.append(element); } element.content = content; }
    meta('description', description); meta('og:title', fullTitle, true); meta('og:description', description, true); meta('og:url', url, true); meta('og:type', product ? 'product' : 'website', true); meta('og:image', product?.images[0]?.src || 'https://pratikaamollar.com.br/brand/logo-pratika-amollar.png', true);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); } canonical.href = url;
    document.querySelectorAll('script[data-product-schema]').forEach(element => element.remove());
    if (product) { const script = document.createElement('script'); script.type = 'application/ld+json'; script.dataset.productSchema = ''; script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: plain(product.name), description, image: product.images.map(i => i.src), ...(Number(product.prices.price) > 0 ? { offers: { '@type': 'Offer', price: Number(product.prices.price) / 10 ** product.prices.currency_minor_unit, priceCurrency: product.prices.currency_code, availability: product.is_in_stock && product.is_purchasable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url } } : {}) }); document.head.append(script); }
  }, [title, description, pathname, product]);
  return null;
}
