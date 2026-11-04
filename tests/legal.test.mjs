import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { default: worker } = await loadTs(new URL('../worker/index.ts', import.meta.url));
const { legalDocuments } = await loadTs(new URL('../shared/legal.ts', import.meta.url));
test('minutas legais: acesso direto 200, conteúdo e SEO no HTML, noindex também fora da prévia', async () => {
 const previous=globalThis.HTMLRewriter;
 try {
  for(const document of legalDocuments) for(const suffix of ['', '/', '?utm_source=qa']){
   const captured={};
   globalThis.HTMLRewriter=class { handlers=new Map(); on(selector,handler){this.handlers.set(selector,handler);return this} transform(response){for(const [selector,handler] of this.handlers){handler.element({setInnerContent(value){captured[selector]=value},setAttribute(name,value){captured[selector+name]=value},append(value){captured[selector]=value}})}return response} };
   const response=await worker.fetch(new Request('https://local.test/'+document.slug+suffix),{PREVIEW:'false',PUBLIC_ORIGIN:'https://pratikaamollar.com.br',ASSETS:{fetch:async()=>new Response('<html/>',{headers:{'Content-Type':'text/html'}})}});
   assert.equal(response.status,200);assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
   assert.match(captured['#root'],/Minuta para revisão/);assert.ok(captured['#root'].includes(document.title));assert.ok(captured['#root'].includes(document.pending[0]));assert.ok(captured.head.includes('noindex, nofollow'));assert.ok(captured.head.includes('https://pratikaamollar.com.br/'+document.slug));assert.equal(captured.title,document.title+' | Pratika Amollar');assert.equal(captured['meta[name="description"]content'],document.description);
  }
 }finally{globalThis.HTMLRewriter=previous}
});
