import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
export default function HomeContact() {
  return <section className="home-contact"><div className="wrap home-contact-inner"><div><span className="eyebrow">De quem afia. Para quem faz.</span><h2>Qual é o próximo<br/><em>passo da sua bancada?</em></h2></div><div><p>Tem uma dúvida sobre máquinas, rebolos ou acessórios? Conte para a gente o que você procura.</p><Link className="button" to="/contato">Vamos conversar <MessageCircle size={20}/></Link><a className="contact-phone" href="tel:+5517991628264">(17) 99162-8264 <ArrowUpRight size={17}/></a></div></div></section>;
}
