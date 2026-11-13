import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../lib/types';
import { galleryIndex, swipeDirection } from '../lib/gallery';
import { plain } from '../lib/api';
export default function CardGallery({ product: p }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const gesture = useRef<{ x: number; y: number } | null>(null), suppress = useRef(false);
  const images = p.images.filter((image, i, all) => all.findIndex(other => other.src === image.src) === i);
  const picture = images[index] || images[0];
  const move = (delta: number) => setIndex(current => galleryIndex(current, delta, images.length));
  return <div className="card-gallery" onKeyDown={event => { if (images.length > 1 && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}>
    <Link className="product-image" to={'/produto/' + p.slug} aria-label={plain(p.name)} onTouchStart={event => { suppress.current = false; const touch = event.touches[0]; gesture.current = { x: touch.clientX, y: touch.clientY }; }} onTouchCancel={() => { gesture.current = null; }} onTouchEnd={event => { const touch = event.changedTouches[0], start = gesture.current; gesture.current = null; if (start) { const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y); if (direction && images.length > 1) { suppress.current = true; move(direction); } } }} onClick={event => { if (suppress.current) { event.preventDefault(); suppress.current = false; } }}>
      {picture ? <img src={picture.thumbnail || picture.src} srcSet={picture.srcset || undefined} sizes="(max-width: 600px) 90vw, (max-width: 1024px) 40vw, 300px" alt={picture.alt || plain(p.name)} loading="lazy" width="430" height="430" draggable={false}/> : <span>Imagem indisponível</span>}
    </Link>{images.length > 1 && <><button type="button" className="gallery-arrow previous" aria-label={'Imagem anterior de ' + plain(p.name)} onClick={() => move(-1)}><ChevronLeft size={20}/></button><button type="button" className="gallery-arrow next" aria-label={'Próxima imagem de ' + plain(p.name)} onClick={() => move(1)}><ChevronRight size={20}/></button><span className="card-gallery-position" role="status" aria-live="polite">{index + 1} / {images.length}</span></>}
  </div>;
}
