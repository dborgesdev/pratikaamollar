import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadTs } from './helpers/load-ts.mjs';
const { normalizeCatalog } = await loadTs(new URL('../shared/catalog.ts',import.meta.url));
const { fetchCatalog, catalogResponse } = await loadTs(new URL('../worker/catalog.ts',import.meta.url));
const { CatalogResource } = await loadTs(new URL('../src/lib/catalog-resource.ts',import.meta.url));
const products = JSON.parse(readFileSync(new URL('../docs/performance/raw-products-before.json',import.meta.url),'utf8'));
const categories=[{id:74,slug:'maquinas-de-afiacao',name:'Máquinas de Afiação',count:4,image:null},{id:73,slug:'rebolos',name:'Rebolos',count:5,image:null},{id:98,slug:'acessorios',name:'Acessórios',count:2,image:null}];
const payload=normalizeCatalog(products,categories,2);
test('catálogo real mantém 11 produtos, preços, atributos, variações e categorias oficiais',()=>{
 assert.equal(payload.products.length,11);assert.equal(payload.meta.categoryFallbacks,4);
 assert.deepEqual(payload.categories.map(c=>[c.id,c.count]),[[74,4],[73,5],[98,2]]);
 for(const p of payload.products){const raw=products.find(x=>x.id===p.id);assert.equal(p.prices.price,raw.prices.price);assert.equal(p.prices.currency_minor_unit,raw.prices.currency_minor_unit);assert.deepEqual(p.attributes,raw.attributes);assert.deepEqual(p.variations,raw.variations);assert.equal(new Set(p.images.map(i=>i.src)).size,p.images.length);}
 assert.ok(JSON.stringify(payload).length<JSON.stringify(products).length);
});
test('fallback de categoria não aceita origem externa nem inventa termos',()=>{
 const p=products[0]; const data=normalizeCatalog([{...p,categories:[],permalink:'https://evil.test/shop/rebolos/item'},{...p,id:999,categories:[],permalink:'https://loja.pratikaamollar.com.br/shop/desconhecida/item'}],categories,2);
 assert.equal(data.meta.categoryFallbacks,0);assert.equal(data.categories.length,0);
});
test('Worker agrega duas coleções em paralelo e não guarda respostas entre visitas',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return Response.json(url.includes('categories')?categories:products,{headers:{'X-WP-TotalPages':'1'}})};
 for(let visit=0;visit<2;visit++){const result=await fetchCatalog(fetcher);assert.equal(result.data.meta.upstreamRequests,2);assert.equal(catalogResponse(result).headers.get('cache-control'),'no-store');}
 assert.equal(calls.length,4);assert.ok(calls.every(c=>c.options.cache==='no-store'&&!c.options.headers.Cookie&&!c.options.headers['Cart-Token']));assert.ok(calls.every(c=>!c.url.includes('&category=')));
});
test('paginação recupera mais de cem produtos sem truncar',async()=>{
 const all=Array.from({length:125},(_,i)=>({...products[0],id:i+1}));
 const result=await fetchCatalog(async url=>{const u=new URL(url);if(u.pathname.endsWith('categories'))return Response.json(categories,{headers:{'X-WP-TotalPages':'1'}});const page=Number(u.searchParams.get('page'));return Response.json(all.slice((page-1)*100,page*100),{headers:{'X-WP-TotalPages':'2'}})});
 assert.equal(result.data.products.length,125);assert.equal(result.data.meta.upstreamRequests,3);
});
test('falha WooCommerce é explícita, sem servir catálogo antigo',async()=>{await assert.rejects(fetchCatalog(async()=>new Response('',{status:503})),/WooCommerce/)});
test('React deduplica inicialização concorrente e reutiliza dados nas rotas',async()=>{
 let requests=0;const resource=new CatalogResource(async()=>{requests++;return payload});
 const a=resource.load(),b=resource.load();assert.equal(a,b);await a;
 for(const route of ['/','/produtos','/categoria/rebolos','/produto/item']){assert.ok(route);assert.equal(await resource.load(),payload)}
 assert.equal(requests,1);assert.equal(resource.getSnapshot().status,'ready');
});
test('catálogo do HTML de produto evita nova consulta no navegador',async()=>{let calls=0;const r=new CatalogResource(async()=>{calls++;return payload},payload);await r.load();assert.equal(calls,0)});
test('timeout libera loading e permite retry; resposta tardia não substitui dados novos',async()=>{
 let firstResolve;let count=0;
 const r=new CatalogResource(()=>++count===1?new Promise(resolve=>{firstResolve=resolve}):Promise.resolve(payload),null,15);
 await assert.rejects(r.load(),/demorou/);assert.equal(r.getSnapshot().status,'error');await r.load();firstResolve({...payload,products:[]});await new Promise(resolve=>setTimeout(resolve,1));assert.equal(r.getSnapshot().data,payload);
});
test('erro de rede permite nova tentativa',async()=>{let count=0;const r=new CatalogResource(async()=>{if(!count++)throw new Error('offline');return payload});await assert.rejects(r.load(),/offline/);await r.load();assert.equal(count,2)});

test('latência mantém loading até chegar dado essencial, sem nova chamada concorrente',async()=>{
 let complete;let calls=0;const r=new CatalogResource(()=>{calls++;return new Promise(resolve=>{complete=resolve})},null,1000);const loading=r.load();await new Promise(resolve=>setTimeout(resolve,25));assert.equal(r.getSnapshot().status,'loading');assert.equal(r.load(),loading);complete(payload);await loading;assert.equal(r.getSnapshot().status,'ready');assert.equal(calls,1);
});
