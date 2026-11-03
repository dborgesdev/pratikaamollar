import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Picture } from '../lib/types';
import { galleryIndex, swipeDirection } from '../lib/gallery';
export default function ProductGallery({ pictures, name }: { pictures: Picture[]; name: string }) {
  const images = pictures.filter((picture, index, all) => all.findIndex(other => other.src === picture.src) === index);
  const [index, setIndex] = useState(0);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  function move(delta: number) { setIndex(current => galleryIndex(current, delta, images.length)); }
  if (!images.length) return <div className="gallery-main gallery-empty">Imagem indisponível</div>;
  return <div className="product-gallery"><div className="gallery-main" role="group" aria-roledescription="carrossel" aria-label={'Imagens de ' + name} tabIndex={images.length > 1 ? 0 : undefined}
    onKeyDown={event => { if(images.length < 2) return; if(event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } else if(event.key === 'Home' || event.key === 'End') { event.preventDefault(); setIndex(event.key === 'Home' ? 0 : images.length - 1); } }}
    onPointerDown={event => { if((event.target as HTMLElement).closest('button')) return; if(event.isPrimary && event.pointerType !== 'mouse') start.current = { x:event.clientX, y:event.clientY, id:event.pointerId }; }}
    onPointerCancel={() => { start.current = null; }}
    onPointerUp={event => { const origin = start.current; start.current = null; if(origin && origin.id === event.pointerId) { const direction = swipeDirection(event.clientX-origin.x,event.clientY-origin.y); if(direction) move(direction); } }}>
    <img key={images[index].src} src={images[index].src} alt={images[index].alt || name} width="700" height="700" draggable={false}/>
    {images.length > 1 && <><button type="button" className="gallery-arrow previous" aria-label="Imagem anterior" onClick={() => move(-1)}><ChevronLeft size={23}/></button><button type="button" className="gallery-arrow next" aria-label="Próxima imagem" onClick={() => move(1)}><ChevronRight size={23}/></button><span className="gallery-position" role="status" aria-live="polite">{index + 1} / {images.length}</span></>}
  </div>{images.length > 1 && <div className="thumbnails" aria-label="Miniaturas do produto">{images.map((picture,i) => <button type="button" key={picture.src} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={'Ver imagem '+(i+1)} aria-pressed={i === index}><img src={picture.thumbnail || picture.src} alt="" loading="lazy" width="70" height="70"/></button>)}</div>}</div>;
}
