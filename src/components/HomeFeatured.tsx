import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '../lib/store';
import ProductCard from './ProductCard';
export default function HomeFeatured(){const {products,loading}=useStore();return <section className="section wrap featured"><div className="section-heading"><div><span className="eyebrow">Seleção Pratika Amollar</span><h2>Feitos para o seu trabalho.</h2></div><Link className="text-link" to="/produtos">Explorar produtos <ArrowUpRight size={18}/></Link></div><div className="product-grid">{loading&&!products.length&&Array.from({length:4},(_,i)=><div className="product-skeleton" key={i} aria-hidden="true"/>)}{[...products].sort((a,b)=>Number(b.is_purchasable)-Number(a.is_purchasable)||Number(b.id===15675)-Number(a.id===15675)).slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
