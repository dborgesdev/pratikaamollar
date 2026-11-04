import { useEffect, useRef, useState } from 'react';
import HomeHero from './HomeHero';
import { fetchBanners, type Banner } from '../lib/banners';
import { galleryIndex, swipeDirection } from '../lib/gallery';
import '../hero-carousel.css';

export default function HomeHeroCarousel({ loadBanners = fetchBanners }: { loadBanners?: typeof fetchBanners }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);
  const [touching, setTouching] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 767px)').matches);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const count = banners.length + 1;
  const originalVisible = index === 0 || !loaded.has(banners[index - 1]?.id);
  const running = count > 1 && !touching && !hidden && !reduced;
  const go = (delta: number) => setIndex(current => galleryIndex(current, delta, count));
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    // Defer one task so StrictMode's setup/cleanup probe never sends an extra request.
    const start = setTimeout(() => {
      void loadBanners(controller.signal).then(data => { if (!controller.signal.aborted) setBanners(data); }).catch(() => { /* Original Hero is the fallback. */ }).finally(() => clearTimeout(timer));
    }, 0);
    return () => { clearTimeout(start); clearTimeout(timer); controller.abort(); };
  }, [loadBanners]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const viewport = matchMedia('(max-width: 767px)');
    const resize = () => setMobile(viewport.matches);
    const update = () => setReduced(media.matches);
    const visibility = () => setHidden(document.hidden);
    media.addEventListener('change', update); viewport.addEventListener('change', resize); document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', update); viewport.removeEventListener('change', resize); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setIndex(current => galleryIndex(current, 1, count)), 6000);
    return () => clearInterval(timer);
  }, [running, count, index]);
  return <div className="hero-carousel" role={count > 1 ? 'region' : undefined} aria-roledescription={count > 1 ? 'carrossel' : undefined} aria-label={count > 1 ? 'Destaques' : undefined}
    onKeyDown={event => { if (count < 2 || event.altKey || event.ctrlKey || event.metaKey) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); go(event.key === 'ArrowRight' ? 1 : -1); } }}
    onTouchStart={event => { swiped.current = false; const touch = event.touches[0]; gesture.current = { x: touch.clientX, y: touch.clientY }; setTouching(true); }}
    onTouchEnd={event => { const start = gesture.current, touch = event.changedTouches[0]; if (start && count > 1) { const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y); swiped.current = direction !== 0; go(direction); } gesture.current = null; setTouching(false); }}
    onTouchCancel={() => { gesture.current = null; setTouching(false); }}>
    <div className="hero-carousel-stage">
      <div className={`hero-original-slide${originalVisible ? ' is-active' : ''}`} aria-hidden={!originalVisible} inert={!originalVisible}><HomeHero/></div>
      {banners.map((banner, offset) => {
        const active = index === offset + 1;
        const picture = (active || loaded.has(banner.id)) && <picture><source media="(max-width: 767px)" srcSet={banner.mobile.url}/><img src={banner.desktop.url} alt={mobile ? banner.mobile.alt : banner.desktop.alt} width="1920" height="840" decoding="async" onLoad={() => setLoaded(current => new Set(current).add(banner.id))} onError={() => { setBanners(current => current.filter(item => item.id !== banner.id)); setIndex(0); }}/></picture>;
        // Mount only current/previously visited images; one responsive download per banner.
        return <div key={banner.id} className={`hero-banner-slide${active && loaded.has(banner.id) ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`${offset + 2} de ${count}`} aria-hidden={!active} inert={!active}>
          {banner.link ? <a className="hero-banner-link" href={banner.link} onClick={event => { if (swiped.current) { event.preventDefault(); swiped.current = false; } }}>{picture}</a> : picture}
        </div>;
      })}
    </div>
    {count > 1 && <div className="hero-carousel-dots" role="group" aria-label="Escolher destaque">
      {Array.from({ length: count }, (_, slide) => <button key={slide} type="button" aria-label={`Ir para slide ${slide + 1} de ${count}`} aria-current={index === slide ? 'true' : undefined} onClick={() => setIndex(slide)}><span aria-hidden="true"/></button>)}
    </div>}
  </div>;
}
