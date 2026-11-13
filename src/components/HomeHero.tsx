import { useEffect, useState } from 'react';
import { fetchHeroImage } from '../lib/hero-image';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
export default function HomeHero({ loadImage = fetchHeroImage }: { loadImage?: typeof fetchHeroImage }) {
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const task = setTimeout(() => { void loadImage(controller.signal).then(data => { if (!controller.signal.aborted) setImage(data); }).catch(() => {}).finally(() => clearTimeout(timeout)); }, 0);
    return () => { clearTimeout(task); clearTimeout(timeout); controller.abort(); };
  }, [loadImage]);
  return <section className="hero"><div className="hero-light" aria-hidden="true"/><div className="hero-inner wrap"><div className="hero-copy"><span className="eyebrow">Precisão em cada detalhe</span><h1>Equipamentos<br/><em>para afiação.</em></h1><p>Máquinas, rebolos e acessórios.<br/>Da escolha do equipamento ao próximo fio.</p><div className="actions"><Link className="button" to="/produtos">Explorar produtos <ArrowRight size={20}/></Link></div></div><Link className="hero-product" to="/categoria/maquinas-de-afiacao" aria-label="Explorar máquinas de afiação">{image && <><div className="machine-shadow"/><img src={image.src} onError={() => setImage(null)} alt={image?.alt || "Máquina de afiação do catálogo Pratika Amollar"} fetchPriority="high" width="565" height="442"/></>}</Link></div></section>;
}
