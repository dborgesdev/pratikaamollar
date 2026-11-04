import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { loadTs } from './helpers/load-ts.mjs';
const { prepareHandoff } = await loadTs(new URL('../worker/handoff.ts', import.meta.url));
const { checkoutTransfer } = await loadTs(new URL('../src/lib/checkout.ts', import.meta.url));
const secret = 'disposable-local-test-secret-at-least-32-bytes';
const items = [{ key:'first', id:1, quantity:3, variation:[] }, { key:'second', id:2, quantity:2, variation:[{attribute:'Acabamento',value:'Dourado'}] }];
const request = (rows=items, cookie='pa_cart=private-token') => new Request('https://frontend.test/api/handoff', { method:'POST', headers:{Origin:'https://frontend.test',Cookie:cookie},body:JSON.stringify({items:rows}) });
test('domínio definitivo: cliente prepara transferência assinada sem alterar origem; origens externas são recusadas', async()=>{
 const origin='https://pratikaamollar.com.br';
 const transfer=await checkoutTransfer({items},async(path,options)=>prepareHandoff(new Request(origin+path,{...options,headers:{...options.headers,Origin:origin,Cookie:'pa_cart=local-test-token'}}),secret,async()=>Response.json({items,errors:[]})));
 const payload=JSON.parse(Buffer.from(transfer.fields.payload,'base64url'));
 assert.equal(payload.origin,origin);assert.deepEqual(payload.items,items);
 assert.equal(transfer.fields.signature,createHmac('sha256',secret).update(transfer.fields.payload).digest('base64url'));
 for(const bad of ['https://evil.test','https://pratikaamollar.com.br.evil.test','null']){
  const response=await prepareHandoff(new Request(origin+'/api/handoff',{method:'POST',headers:{Origin:bad}}),secret,async()=>{throw Error('Unauthorized request reached cart')});
  assert.equal(response.status,403);
 }
});
test('handoff assina snapshot real, atributos e prazo, sem preço/token', async()=>{
 const r=await prepareHandoff(request(),secret,async()=>Response.json({items,errors:[]})); assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
 const body=await r.json();const p=JSON.parse(Buffer.from(body.fields.payload,'base64url'));assert.equal(p.v,2);assert.equal(p.exp-p.iat,90);assert.equal(p.origin,'https://frontend.test');assert.deepEqual(p.items,items);assert.equal(body.fields.signature,createHmac('sha256',secret).update(body.fields.payload).digest('base64url'));assert.ok(!JSON.stringify(body).includes('private-token'));
});
test('sessão ausente ou expirada, divergência, estoque e resposta inválida bloqueiam',async()=>{
 for(const [req,cart,status] of [[request(items,''),{items},409],[request(),{items:[]},409],[request([{...items[0],quantity:1}]),{items},409],[request(),{items,errors:[{message:'stock'}]},409],[request(),{items:[{id:1,quantity:1}]},502]]) { const r=await prepareHandoff(req,secret,async()=>Response.json(cart));assert.equal(r.status,status);assert.equal((await r.json()).fields,undefined); }
 const expired=await prepareHandoff(request(),secret,async()=>Response.json({message:'expired'},{status:401}));assert.equal(expired.status,409);
});
test('origem externa não consulta Woo; corpo inválido e segredo fraco são recusados',async()=>{
 let reads=0;const read=async()=>{reads++;return Response.json({items});};const r=await prepareHandoff(new Request('https://frontend.test/api/handoff',{method:'POST',headers:{Origin:'https://evil.test'}}),secret,read);assert.equal(r.status,403);assert.equal(reads,0);assert.equal((await prepareHandoff(request(),'short',read)).status,503);
});
test('cliente só aceita destino e contrato fixos e não navega em falha',async()=>{
 const cart={items};let sent;
 const accepted=await checkoutTransfer(cart,async(url,options)=>{sent=JSON.parse(options.body);return Response.json({action:'https://loja.pratikaamollar.com.br/wp-admin/admin-post.php',fields:{action:'pa_handoff',payload:'abc',signature:'a'.repeat(43)}});});assert.match(accepted.action,/admin-post.php$/);assert.deepEqual(sent.items,items.map(({key,id,quantity})=>({key,id,quantity})));
 await assert.rejects(checkoutTransfer(cart,async()=>Response.json({message:'Sessão expirada'},{status:409})),/Sessão expirada/);
 await assert.rejects(checkoutTransfer(cart,async()=>Response.json({action:'https://evil.test',fields:{}})),/Transferência inválida/);assert.equal(cart.items,items);
});
