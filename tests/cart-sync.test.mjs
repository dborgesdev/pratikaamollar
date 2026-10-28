import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
async function moduleFrom(path) { const source = readFileSync(new URL(path, import.meta.url), 'utf8'); const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText; return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64')); }
const { CartSync } = await moduleFrom('../src/lib/cart-sync.ts');
const { whatsappMessage } = await moduleFrom('../src/lib/contact.ts');
const price = { price: '88000', regular_price: '88000', currency_minor_unit: 2, currency_code: 'BRL' };
const product = { id: 16006, name: 'Rampa', images: [], prices: price, is_purchasable: true, is_in_stock: true };
function cart(quantity = 0, max = 9) { return { items: quantity ? [{ id: 16006, key: 'server-key', name: 'Rampa', quantity, images: [], prices: price, totals: { line_total: String(quantity * 88000), currency_minor_unit: 2, currency_code: 'BRL' }, quantity_limits: { minimum: 1, maximum: max, editable: true } }] : [], items_count: quantity, coupons: [], errors: [], totals: { total_price: String(quantity * 88000), currency_minor_unit: 2, currency_code: 'BRL' } }; }

test('adição é imediata e dez cliques viram uma escrita absoluta', async () => {
 const writes = []; const sync = new CartSync(async (path, body) => { writes.push({path,body}); return cart(body.quantity); }, 1000); sync.hydrate(cart());
 const start = performance.now(); for (let i=0;i<10;i++) sync.add(product,1); const feedback = performance.now()-start;
 assert.equal(sync.getSnapshot().cart.items_count,10); assert.equal(writes.length,0); await sync.flush(); assert.equal(writes.length,1); assert.equal(writes[0].body.quantity,10); assert.equal(sync.getSnapshot().busy,false);
 console.log(JSON.stringify({scenario:'10 rapid adds',feedbackMs:Number(feedback.toFixed(3)),writes:writes.length}));
});
test('resposta antiga não apaga intenção mais recente; escritor único', async () => {
 let resolveFirst; const writes=[]; let active=0,maximum=0;
 const sync=new CartSync(async(path,body)=>{writes.push(body.quantity); active++; maximum=Math.max(maximum,active); if(writes.length===1)await new Promise(resolve=>resolveFirst=resolve); active--; return cart(body.quantity);},1000);
 sync.hydrate(cart(1)); sync.setQuantity(16006,2); const flushing=sync.flush(); sync.setQuantity(16006,4); assert.equal(sync.getSnapshot().cart.items_count,4); resolveFirst(); await flushing; assert.deepEqual(writes,[2,4]); assert.equal(maximum,1); assert.equal(sync.getSnapshot().cart.items_count,4);
});
test('remoção otimista pode ser revertida antes de ir ao servidor',async()=>{
 const writes=[]; const sync=new CartSync(async(path,body)=>{writes.push({path,body});return cart(body.quantity);},1000);sync.hydrate(cart(2));sync.setQuantity(16006,0);assert.equal(sync.getSnapshot().cart.items_count,0);sync.add(product,1);await sync.flush();assert.equal(writes.length,1);assert.equal(writes[0].path,'cart/update-item');assert.equal(writes[0].body.quantity,1);
});
test('falha de estoque reverte, reconcilia e bloqueia handoff até conferência',async()=>{
 let calls=0;const sync=new CartSync(async(path)=>{calls++;if(path==='cart')return cart(1);throw Error('Estoque insuficiente.');},1000);sync.hydrate(cart(1));sync.setQuantity(16006,5);await assert.rejects(sync.flush(),/Estoque insuficiente/);assert.equal(sync.getSnapshot().cart.items_count,1);assert.equal(sync.getSnapshot().failed,true);await sync.refresh();assert.equal(sync.getSnapshot().failed,false);assert.equal(calls,3);
});
test('respeita limite retornado pelo WooCommerce',async()=>{
 const writes=[];const sync=new CartSync(async(path,body)=>{writes.push(body.quantity);return cart(body.quantity,3);},1000);sync.hydrate(cart(1,3));sync.setQuantity(16006,12);assert.equal(sync.getSnapshot().cart.items_count,3);await sync.flush();assert.deepEqual(writes,[3]);
});
test('timeout de adição não é repetido: GET recupera o item já aceito',async()=>{
 const paths=[];const sync=new CartSync(async(path)=>{paths.push(path);if(path==='cart')return cart(1);throw Error('Timeout');},1000);sync.hydrate(cart());sync.add(product,1);await assert.rejects(sync.flush());assert.deepEqual(paths,['cart/add-item','cart']);assert.equal(sync.getSnapshot().cart.items_count,1);
});
test('contato valida e formata nome e mensagem para o WhatsApp',()=>{
 const url=new URL(whatsappMessage('  Maria  Silva  ','Tenho dúvidas sobre máquinas e rebolos.')); assert.equal(url.pathname,'/5517991628264');assert.match(url.searchParams.get('text'),/\*Nome:\* Maria Silva\n\n\*Mensagem:\*\nTenho dúvidas/);assert.throws(()=>whatsappMessage('A','oi'));assert.throws(()=>whatsappMessage('Maria','a'.repeat(1501)));
});
test('checkout trava novas intenções até terminar o handoff',async()=>{
 const writes=[];const sync=new CartSync(async(path,body)=>{writes.push(body.quantity);return cart(body.quantity);},1000);sync.hydrate(cart(1));sync.setQuantity(16006,2);const unlock=await sync.lockForCheckout();sync.setQuantity(16006,5);assert.equal(sync.getSnapshot().cart.items_count,2);assert.equal(sync.getSnapshot().checkoutLocked,true);unlock();sync.setQuantity(16006,3);await sync.flush();assert.deepEqual(writes,[2,3]);assert.equal(sync.getSnapshot().checkoutLocked,false);
});
