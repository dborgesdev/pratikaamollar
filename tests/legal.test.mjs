import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { default: worker } = await loadTs(new URL('../worker/index.ts', import.meta.url));
const { legalBusinessIdentity, legalDocuments } = await loadTs(new URL('../shared/legal.ts', import.meta.url));
const forbidden = /minuta|pend[eê]ncias?|revis[aã]o pendente|antes da publica[cç][aã]o|React|WordPress|WooCommerce|Store API|Worker|ponte de carrinho|infraestrutura|checkout nativo|valida[cç][aã]o nativa/i;

test('documentos aprovados: oito seções de privacidade e quatro nas demais; conteúdo voltado ao consumidor', () => {
 assert.equal(legalDocuments.length,4);
 assert.deepEqual(legalDocuments.map(document=>document.sections.length),[8,4,4,4]);
 assert.deepEqual(legalDocuments[0].sections.map(section=>section.title),['Apresentação','Dados utilizados e suas finalidades','Atendimento pelo WhatsApp','Compartilhamento de informações','Cookies e funcionamento da loja','Conservação dos dados','Seus direitos','Contato sobre privacidade']);
 for(const document of legalDocuments){
  assert.deepEqual(document.pending,[]);
  assert.doesNotMatch(JSON.stringify(document),forbidden);
  assert.ok(document.sections.every(section=>section.title&&section.paragraphs.length&&section.paragraphs.every(Boolean)));
 }
 assert.ok(legalBusinessIdentity.includes('Razão social: Pratika Amollar'));
 assert.ok(legalBusinessIdentity.includes('CNPJ: 30.867.419/0001-06'));
 const terms=legalDocuments[1].sections[0].paragraphs.join(' ');
 assert.match(terms,/Pratika Amollar/);assert.match(terms,/30\.867\.419\/0001-06/);assert.match(terms,/Endereço comercial/);
 const returns=legalDocuments[2].sections;
 assert.match(returns.find(section=>section.title==='Solicitação e retorno').paragraphs.join(' '),/Solicite ao atendimento o endereço e as instruções/);
 assert.equal(returns.find(section=>section.title==='Restituição').paragraphs[0],'Nos casos de exercício do direito de arrependimento, os valores pagos serão restituídos conforme a legislação aplicável. O reembolso será processado, sempre que possível, pelo mesmo meio de pagamento utilizado na compra. Os prazos de disponibilização do valor pela instituição financeira ou de pagamento serão informados ao cliente durante o atendimento, sem prejuízo dos direitos assegurados por lei.');
});

test('páginas legais: HTML completo, identificação, canonical e SEO; noindex preservado em ambas as configurações', async () => {
 const previous=globalThis.HTMLRewriter;
 try {
  for(const document of legalDocuments) for(const suffix of ['', '/', '?utm_source=qa']) for(const preview of ['true','false']){
   const captured={};
   globalThis.HTMLRewriter=class { handlers=new Map(); on(selector,handler){this.handlers.set(selector,handler);return this} transform(response){for(const [selector,handler] of this.handlers){handler.element({setInnerContent(value){captured[selector]=value},setAttribute(name,value){captured[selector+name]=value},append(value){captured[selector]=value}})}return response} };
   const response=await worker.fetch(new Request('https://local.test/'+document.slug+suffix),{PREVIEW:preview,PUBLIC_ORIGIN:'https://pratikaamollar.com.br',ASSETS:{fetch:async()=>new Response('<html/>',{headers:{'Content-Type':'text/html'}})}});
   assert.equal(response.status,200);assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
   const html=captured['#root'];
   assert.doesNotMatch(html,forbidden);
   for(const line of legalBusinessIdentity)assert.ok(html.includes(line));
   for(const section of document.sections){assert.ok(html.includes(section.title));for(const paragraph of section.paragraphs)assert.ok(html.includes(paragraph));}
   assert.ok(captured.head.includes('noindex, nofollow'));
   assert.ok(captured.head.includes('https://pratikaamollar.com.br/'+document.slug));
   assert.equal(captured.title,document.title+' | Pratika Amollar');
   assert.equal(captured['meta[name="description"]content'],document.description);
   assert.ok(captured.head.includes('og:description'));
   assert.ok(!captured.head.includes('application/ld+json'));
  }
 }finally{globalThis.HTMLRewriter=previous}
});
