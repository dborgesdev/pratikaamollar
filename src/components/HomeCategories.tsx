import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '../lib/store';
export default function HomeCategories() {
  const { categories, products, loading } = useStore();
  return <section className="section wrap category-section"><div className="section-heading"><div><span className="eyebrow">Categorias</span><h2>Tudo para uma<br className="desktop-break"/> afiação completa.</h2></div><p>Explore cada parte<br/>da sua bancada.</p></div><div className="categories">{[...categories].sort((a, b) => a.id === 74 ? -1 : b.id === 74 ? 1 : 0).map(c => {
    const image = c.slug === 'acessorios' ? products.find(p => p.id === 16006)?.images[0]?.src : '/editorial/' + c.slug + '.png';
    return <Link to={'/categoria/' + c.slug} className={'category-card category-' + c.slug} key={c.id}>{image && <img src={image} alt="" loading="lazy" width="565" height="442"/>}<div><small>Explore o catálogo</small><h3>{c.name}</h3><span>Ver produtos <ArrowUpRight size={23}/></span></div></Link>;
  })}{loading && !categories.length && Array.from({ length: 3 }, (_, i) => <div key={i} className="category-skeleton"/>)}</div></section>;
}
