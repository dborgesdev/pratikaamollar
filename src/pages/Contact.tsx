import { ArrowUpRight, MapPin, Mail, Phone } from 'lucide-react';
import { whatsapp } from '../lib/api';
import Seo from '../components/Seo';
import ContactForm from '../components/ContactForm';
export default function Contact() {
  return <><Seo title="Fale com a Pratika"/><section className="contact-page wrap section"><div className="contact-intro"><span className="eyebrow">Fale com a Pratika Amollar</span><h1>Do seu trabalho.<br/><em>Da sua próxima ideia.</em><br/>Vamos conversar.</h1><p>Máquinas, rebolos ou acessórios. Estamos aqui para conversar sobre o que você procura para a sua bancada.</p><div className="contact-details"><a href={whatsapp}><Phone/><div><small>Telefone / WhatsApp</small><h3>(17) 99162-8264</h3></div><ArrowUpRight/></a><a href="mailto:amolar.net@outlook.com"><Mail/><div><small>E-mail</small><h3>amolar.net@outlook.com</h3></div><ArrowUpRight/></a><a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Avenida Progresso 1310 Eldorado São José do Rio Preto SP 15043-420')} target="_blank" rel="noopener noreferrer"><MapPin/><div><small>Pratika Amollar · São José do Rio Preto / SP</small><h3>Avenida Progresso, 1310</h3><p>Eldorado · CEP 15043-420</p></div><ArrowUpRight/></a></div></div><ContactForm/></section></>;
}
