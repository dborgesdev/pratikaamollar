import DOMPurify from 'dompurify';
import { plain } from '../lib/api';
import type { Product } from '../lib/types';
export function ShortDescription({ html }: { html: string }) {
  return plain(html).trim() ? <div className="rich-text product-excerpt" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}/> : null;
}
export default function ProductDescription({ product: p }: { product: Product }) {
  const full = plain(p.description).trim();
  const repeated = full === plain(p.short_description).trim();
  return <section className="description" id="product-description">{full && !repeated && <><h2>Conheça o produto</h2><div className="rich-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.description) }}/></>}{p.attributes?.length > 0 && <dl>{p.attributes.map(a => <div key={a.id}><dt>{a.name}</dt><dd>{a.terms.map(t => t.name).join(', ')}</dd></div>)}</dl>}</section>;
}
