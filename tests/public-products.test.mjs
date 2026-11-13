import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { publicProductData } = await loadTs(new URL('../worker/public-products.ts',import.meta.url));
test('leitura pública restrita não encaminha cookies, tokens, query arbitrária ou escrita',async()=>{
 let calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return Response.json([],{headers:{'X-WP-TotalPages':'2','Set-Cookie':'secret'}})};
 const response=await publicProductData(new Request('https://preview.test/api/product-reviews?product_id=10&page=2&status=hold',{headers:{Cookie:'pa_cart=private'}}),fetcher);
 assert.equal(response.status,200);assert.equal(response.headers.get('set-cookie'),null);assert.equal(response.headers.get('X-WP-TotalPages'),'2');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.deepEqual(calls[0].options.headers,{Accept:'application/json'});assert.equal(calls[0].options.redirect,'manual');assert.ok(!calls[0].url.includes('status'));
 assert.equal((await publicProductData(new Request('https://preview.test/api/product-reviews?product_id=x'),fetcher)).status,400);
 assert.equal((await publicProductData(new Request('https://preview.test/api/product-reviews?product_id=1',{method:'POST'}),fetcher)).status,405);assert.equal(calls.length,1);
});
test('erros remotos e redirects não são propagados como dados de produto',async()=>{assert.equal((await publicProductData(new Request('https://preview.test/api/product-option?product_id=10'),async()=>new Response(null,{status:302,headers:{Location:'https://external.test'}}))).status,502)});
