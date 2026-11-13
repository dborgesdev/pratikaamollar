import EmbeddedVideo from './EmbeddedVideo';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { Picture } from '../lib/types';
import { galleryIndex, swipeDirection } from '../lib/gallery';
import type { ProductVideo } from '../lib/product-media';
type Media = { kind: 'image'; src: string; thumbnail: string; alt: string } | ({ kind: 'video' } & ProductVideo);
export default function ProductGallery({ pictures, name, videos = [] }: { pictures: Picture[]; name: string; videos?: ProductVideo[] }) {
  const [index, setIndex] = useState(0);
  const video = useRef<HTMLVideoElement | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const media: Media[] = pictures.filter((picture, i, all) => all.findIndex(other => other.src === picture.src) === i).map(picture => ({ kind: 'image', src: picture.src, thumbnail: picture.thumbnail, alt: picture.alt }));
  // Position is the number of native images before this video. Stable for equal positions.
  let inserted = 0;
  for (const item of [...videos].sort((a, b) => a.position - b.position)) { media.splice(Math.min(item.position + inserted++, media.length), 0, { kind: 'video', ...item }); }
  const currentIndex = Math.min(index, Math.max(0, media.length - 1));
  const active = media[currentIndex];
  function select(next: number) { video.current?.pause(); setIndex(next); }
  function move(delta: number) { select(galleryIndex(currentIndex, delta, media.length)); }
  if (!active) return <div className="gallery-main gallery-empty">Imagem indisponível</div>;
  return <div className="product-gallery"><div className="gallery-main" role="group" aria-roledescription="carrossel" aria-label={'Mídias de ' + name} tabIndex={media.length > 1 ? 0 : undefined}
    onKeyDown={event => { if ((event.target as HTMLElement).closest('video') || media.length < 2) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); select(event.key === 'Home' ? 0 : media.length - 1); } }}
    onPointerDown={event => { if ((event.target as HTMLElement).closest('button,video')) return; if (event.isPrimary && event.pointerType !== 'mouse') start.current = { x: event.clientX, y: event.clientY, id: event.pointerId }; }}
    onPointerCancel={() => { start.current = null; }}
    onPointerUp={event => { const origin = start.current; start.current = null; if (origin && origin.id === event.pointerId) { const direction = swipeDirection(event.clientX - origin.x, event.clientY - origin.y); if (direction) move(direction); } }}>
    {active.kind === 'image' ? <img key={active.src} src={active.src} alt={active.alt || name} width="700" height="700" draggable={false}/> : active.type !== 'mp4' ? <EmbeddedVideo key={active.src + active.attachmentId} video={active}/> : <video key={active.src} ref={video} src={active.src} poster={active.poster} controls playsInline preload="none" aria-label={active.title}><a href={active.src}>Abrir vídeo do produto</a></video>}
    {active.kind === 'video' && media.length > 1 && <div className="gallery-video-swipe">Deslize aqui para mudar de mídia</div>}
    {media.length > 1 && <><button type="button" className="gallery-arrow previous" aria-label="Mídia anterior" onClick={() => move(-1)}><ChevronLeft size={23}/></button><button type="button" className="gallery-arrow next" aria-label="Próxima mídia" onClick={() => move(1)}><ChevronRight size={23}/></button><span className="gallery-position" role="status" aria-live="polite">{currentIndex + 1} / {media.length}</span></>}
  </div>{media.length > 1 && <div className="thumbnails" aria-label="Miniaturas do produto">{media.map((item, i) => <button type="button" key={item.src + i} className={i === currentIndex ? 'active' : ''} onClick={() => select(i)} aria-label={'Ver ' + (item.kind === 'video' ? 'vídeo ' : 'imagem ') + (i + 1)} aria-pressed={i === currentIndex}>{item.kind === 'image' ? <img src={item.thumbnail || item.src} alt="" loading="lazy" width="70" height="70"/> : <>{item.poster && <img src={item.poster} alt="" loading="lazy" width="70" height="70"/>}<Play size={20} aria-hidden="true"/><span>Vídeo</span></>}</button>)}</div>}</div>;
}
