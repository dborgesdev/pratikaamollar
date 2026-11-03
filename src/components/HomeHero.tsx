import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
export default function HomeHero() {
  return <section className="hero"><div className="hero-light" aria-hidden="true"/><div className="hero-inner wrap"><div className="hero-copy"><span className="eyebrow">Precisão em cada detalhe</span><h1>Equipamentos<br/><em>para afiação.</em></h1><p>Máquinas, rebolos e acessórios.<br/>Da escolha do equipamento ao próximo fio.</p><div className="actions"><Link className="button" to="/produtos">Explorar produtos <ArrowRight size={20}/></Link></div></div><Link className="hero-product" to="/categoria/maquinas-de-afiacao" aria-label="Explorar máquinas de afiação"><div className="machine-shadow"/><img src="/editorial/maquinas-de-afiacao.png" alt="Máquina de afiação do catálogo Pratika Amollar" fetchPriority="high" width="565" height="442"/></Link></div></section>;
}
