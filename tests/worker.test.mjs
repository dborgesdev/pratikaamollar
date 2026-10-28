import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const env={PREVIEW:'true',PUBLIC_ORIGIN:'https://pratikaamollar.com.br',ASSETS:{fetch:async()=>new Response('asset')}};
test('preview bloqueia indexação',async()=>{const r=await worker.fetch(new Request('https://preview.test/robots.txt'),env);assert.match(await r.text(),/Disallow: \//)});
test('proxy recusa endpoint arbitrário',async()=>{const r=await worker.fetch(new Request('https://preview.test/api/store/orders'),env);assert.equal(r.status,404)});
test('mutações recusam origem externa',async()=>{const r=await worker.fetch(new Request('https://preview.test/api/store/cart/add-item',{method:'POST',headers:{Origin:'https://evil.test'}}),env);assert.equal(r.status,403)});
test('handoff sem configuração falha de forma explícita',async()=>{const r=await worker.fetch(new Request('https://preview.test/api/handoff',{method:'POST',headers:{Origin:'https://preview.test'}}),env);assert.equal(r.status,503);assert.match((await r.json()).message,/ponte WordPress/)});
test('proxy não aceita escrita em produtos',async()=>{const r=await worker.fetch(new Request('https://preview.test/api/store/products',{method:'POST',headers:{Origin:'https://preview.test'}}),env);assert.equal(r.status,404)});

test('handoff assina itens do servidor sem expor token',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({items:[{id:16006,quantity:2,variation:[]}],coupons:[]});
 try{
 const r=await worker.fetch(new Request('https://preview.test/api/handoff',{method:'POST',headers:{Origin:'https://preview.test',Cookie:'pa_cart=private-token'}}),{...env,HANDOFF_SECRET:'a-test-secret-with-at-least-32-bytes'});
 assert.equal(r.status,200);const body=await r.json();assert.equal(body.action,'https://loja.pratikaamollar.com.br/wp-admin/admin-post.php');assert.equal(body.fields.action,'pa_handoff');
 const payload=JSON.parse(Buffer.from(body.fields.payload,'base64url'));assert.deepEqual(payload.items,[{id:16006,quantity:2,variation:[]}]);assert.ok(payload.exp>Date.now()/1000);assert.ok(payload.exp<Date.now()/1000+100);assert.ok(body.fields.signature);assert.ok(!JSON.stringify(body).includes('private-token'));
 }finally{globalThis.fetch=previous}
});
test('cupons não estão expostos no React nem no proxy', async()=>{
 const r=await worker.fetch(new Request('https://preview.test/api/store/cart/apply-coupon',{method:'POST',headers:{Origin:'https://preview.test'}}),env);assert.equal(r.status,404);
});
