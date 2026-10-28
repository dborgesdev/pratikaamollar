import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
export default function HomeEditorial() {
  return <section className="editorial"><div className="wrap editorial-grid"><div><span className="eyebrow">Rebolos para afiação</span><h2>O próximo fio<br/>começa no <em>detalhe.</em></h2><p>Grãos, dimensões e aplicações.<br/>Encontre as especificações no catálogo.</p><Link className="button" to="/categoria/rebolos">Ver rebolos <ArrowRight size={20}/></Link></div><div className="editorial-photo"><img src="/editorial/rebolos.png" alt="Rebolo do catálogo Pratika Amollar" width="612" height="408" loading="lazy"/></div></div></section>;
}
