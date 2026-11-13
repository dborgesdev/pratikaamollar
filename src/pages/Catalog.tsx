import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../lib/store';
import CatalogProducts from '../components/CatalogProducts';
import Seo from '../components/Seo';
import '../catalog.css';
export default function Catalog() {
  const { products, categories } = useCatalog(); const { slug } = useParams();
  const category = categories.find(item => item.slug === slug);
  const list = products.filter(product => !slug || product.categories.some(item => item.slug === slug));
  const title = category?.name || (slug ? 'Categoria não encontrada' : 'Todos os produtos');
  return <><Seo title={title}/><section className="page-banner catalog-banner"><div className="wrap"><div className="breadcrumb"><Link to="/">Início</Link> / Catálogo</div><h1>{title}</h1></div><img className="banner-photo" src={slug === 'acessorios' ? products.find(product => product.id === 16006)?.images[0]?.src : '/editorial/'+(slug === 'rebolos' ? 'rebolos' : 'maquinas-de-afiacao')+'.png'} alt="" width="565" height="442"/></section><div className="wrap catalog section"><aside aria-label="Categorias"><h2>Categorias</h2><Link className={!slug ? 'selected' : ''} to="/produtos">Todos os produtos <span>{products.length}</span></Link>{categories.map(item => <Link aria-current={slug === item.slug ? 'page' : undefined} className={slug === item.slug ? 'selected' : ''} key={item.id} to={'/categoria/'+item.slug}>{item.name}<span>{item.count}</span></Link>)}</aside><CatalogProducts key={slug || "all"} products={list}/></div></>;
}
