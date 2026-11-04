import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
import { readFileSync } from 'node:fs';
const { normalizeBanners, fetchBanners } = await loadTs(new URL('../src/lib/banners.ts', import.meta.url));
const banner = id => ({ id, status:'publish', acf:{ desktop:{url:`https://example.test/${id}.jpg`,alt:'Descrição do banner'},mobile:{url:`https://example.test/${id}-mobile.jpg`,alt:''} } });
test('resposta real de 04/11/2026 extrai URLs ACF sem consultas de mídia',()=>{
  const records=JSON.parse(readFileSync(new URL('./fixtures/banners-real.json',import.meta.url),'utf8'));
  const normalized=normalizeBanners(records);
  assert.equal(normalized.length,1);assert.equal(normalized[0].id,16164);
  assert.equal(normalized[0].desktop.url,records[0].acf.desktop.url);
  assert.equal(normalized[0].mobile.url,records[0].acf.mobile.url);
  assert.equal(normalized[0].desktop.alt,records[0].acf.desktop.title);
  assert.equal(normalized[0].link,'https://pratikaamollar.com.br/produtos');
});
test('link ACF opcional aceita URL web e ignora vazio ou protocolos executáveis',()=>{
  const normalized = link => normalizeBanners([{...banner(1),acf:{...banner(1).acf,link}}])[0].link;
  assert.equal(normalized('https://pratikaamollar.com.br/produtos'),'https://pratikaamollar.com.br/produtos');
  for(const value of ['',null,undefined,'  ','javascript:alert(1)','data:text/html,abc','inválido']) assert.equal(normalized(value),undefined);
});
test('alt original tem prioridade; vazio usa título, nome da imagem ou empresa',()=>{
  const withImage = desktop => normalizeBanners([{id:1,acf:{desktop,mobile:'https://example.test/m.jpg'}}])[0].desktop.alt;
  const url='https://example.test/d.jpg';
  assert.equal(withImage({url,alt:'Texto do WordPress',title:'Título'}),'Texto do WordPress');
  assert.equal(withImage({url,alt:'',title:'Título'}),'Título');
  assert.equal(withImage({url,alt:' ',filename:'banner.webp'}),'banner.webp');
  assert.equal(withImage({url}),'Pratika Amollar');
});
test('ausência, um e múltiplos banners preservam ordem da coleção',()=>{
  assert.deepEqual(normalizeBanners([]),[]);
  assert.equal(normalizeBanners([banner(1)]).length,1);
  assert.deepEqual(normalizeBanners([banner(3),banner(2),banner(1)]).map(b=>b.id),[3,2,1]);
});
test('URLs e Arrays ACF; IDs, campos incompletos, rascunhos e URLs inseguras são ignorados',()=>{
  const direct={id:2,acf:{desktop:'https://example.test/d.jpg',mobile:'https://example.test/m.jpg'}};
  assert.equal(normalizeBanners([banner(1),direct]).length,2);
  assert.deepEqual(normalizeBanners([{id:3,acf:{desktop:12,mobile:13}},{...banner(4),status:'draft'},{id:5,acf:{desktop:'javascript:alert(1)',mobile:'https://example.test/m.jpg'}},{id:6,acf:{desktop:12}},null]),[]);
  assert.equal(normalizeBanners([banner(1),banner(1)]).length,1);
});
test('uma requisição obtém registros e imagens, sem cookies ou cache persistente',async()=>{
  const calls=[];
  const result=await fetchBanners(undefined,async(url,options)=>{calls.push({url,options});return Response.json([banner(1),banner(2)],{headers:{'X-WP-TotalPages':'1'}})});
  assert.equal(result.length,2);assert.equal(calls.length,1);
  assert.match(calls[0].url,/acf_format=standard/);assert.match(calls[0].url,/per_page=100/);
  assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.credentials,'omit');
});
test('falhas e paginação acima do limite não produzem campanha parcial',async()=>{
  await assert.rejects(fetchBanners(undefined,async()=>new Response('',{status:503})),/503/);
  await assert.rejects(fetchBanners(undefined,async()=>{throw new Error('offline')}),/offline/);
  await assert.rejects(fetchBanners(undefined,async()=>Response.json([banner(1)],{headers:{'X-WP-TotalPages':'2'}})),/100/);
  await assert.rejects(fetchBanners(undefined,async()=>Response.json({})),/inválida/);
});
