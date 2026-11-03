import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../lib/store';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
export default function Catalog() {
  const { products, categories } = useCatalog(); const { slug } = useParams(); const [page, setPage] = useState(1);
  const category = categories.find(item => item.slug === slug);
  const list = products.filter(product => !slug || product.categories.some(item => item.slug === slug));
  const title = category?.name || (slug ? 'Categoria não encontrada' : 'Todos os produtos');
  return <><Seo title={title}/><section className="page-banner catalog-banner"><div className="wrap"><div className="breadcrumb"><Link to="/">Início</Link> / Catálogo</div><h1>{title}</h1></div><img className="banner-photo" src={slug === 'acessorios' ? products.find(product => product.id === 16006)?.images[0]?.src : '/editorial/'+(slug === 'rebolos' ? 'rebolos' : 'maquinas-de-afiacao')+'.png'} alt="" width="565" height="442"/></section><div className="wrap catalog section"><aside aria-label="Categorias"><h2>Categorias</h2><Link className={!slug ? 'selected' : ''} to="/produtos">Todos os produtos <span>{products.length}</span></Link>{categories.map(item => <Link aria-current={slug === item.slug ? 'page' : undefined} className={slug === item.slug ? 'selected' : ''} key={item.id} to={'/categoria/'+item.slug}>{item.name}<span>{item.count}</span></Link>)}</aside><div className="catalog-results"><p className="result-count">{list.length} produtos encontrados</p><div className="product-grid catalog-grid">{list.slice((page-1)*9,page*9).map(product => <ProductCard key={product.id} product={product}/>)}</div>{!list.length && <div className="empty"><h2>Nenhum produto encontrado.</h2><Link className="button" to="/produtos">Ver todos os produtos</Link></div>}{list.length > 9 && <nav className="pagination" aria-label="Páginas do catálogo"><button disabled={page === 1} onClick={() => setPage(page-1)}>Anterior</button><span>Página {page} de {Math.ceil(list.length/9)}</span><button disabled={page*9 >= list.length} onClick={() => setPage(page+1)}>Próxima</button></nav>}</div></div></>;
}
