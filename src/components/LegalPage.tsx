import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import Seo from './Seo';
import { legalDocuments, type LegalDocument } from '../../shared/legal';
export default function LegalPage({ document }: { document: LegalDocument }) {
useEffect(() => {
 const existing = window.document.querySelector<HTMLMetaElement>('meta[name="robots"]');
 const previous = existing?.content;
 const robots = existing || window.document.createElement('meta');
 robots.name = 'robots'; robots.content = 'noindex, nofollow';
 if (!existing) window.document.head.append(robots);
 return () => { if (previous !== undefined) robots.content = previous; else robots.remove(); };
}, []);
return <div className="wrap section legal-page"><Seo title={document.title} description={document.description}/><span className="eyebrow">Informações da loja</span><h1>{document.title}</h1><p className="legal-draft" role="note">Minuta para revisão — 4 de novembro de 2026. Informações pendentes de confirmação; não constitui a versão definitiva da política.</p><nav aria-label="Políticas da loja" className="legal-nav">{legalDocuments.map(item=><Link key={item.slug} to={'/'+item.slug} aria-current={item.slug===document.slug?'page':undefined}>{item.title}</Link>)}</nav><article aria-label={document.title}>{document.sections.map((section,index)=><section key={section.title} aria-labelledby={'legal-section-'+index}><h2 id={'legal-section-'+index}>{section.title}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</section>)}</article><aside className="legal-pending" aria-labelledby="legal-pending"><h2 id="legal-pending">Antes da publicação definitiva</h2><ul>{document.pending.map(item=><li key={item}>{item}</li>)}</ul></aside><p>Atendimento: <a href="mailto:amolar.net@outlook.com">amolar.net@outlook.com</a> · <a href="https://wa.me/5517991628264">(17) 99162-8264</a>.</p></div>;
}
